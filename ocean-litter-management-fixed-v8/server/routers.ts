import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  createReport, 
  getAllReports, 
  getReportById, 
  getUncollectedReports,
  markReportAsCollected,
  createAiDetections,
  getDetectionsByReportId,
  getAllDetections,
  updateDetectedImageUrls,
  deleteReport,
  getKpiSummary 
} from "./db";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import archiver from "archiver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFileAsync = promisify(execFile);

const PROJECT_ROOT = path.join(__dirname, "..");

function toApiUrl(relPath: string | null): string | null {
  if (!relPath) return null;
  if (relPath.startsWith('/api/images')) return relPath;
  const normalizedPath = relPath.replace(/\\/g, '/');
  return `/api/images?path=${normalizedPath}`;
}

// JSON 배열 형태의 이미지 경로를 API URL 배열로 변환
function toApiUrlArray(jsonStr: string | null): string[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.map(p => {
        if (typeof p === 'string') {
          return toApiUrl(p) || p;
        }
        return '';
      }).filter(Boolean);
    }
    return [];
  } catch (e) {
    console.error('Failed to parse image URLs:', e);
    return [];
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
  }),
  reports: router({
    getKpiSummary: publicProcedure.query(async () => await getKpiSummary()),
    create: publicProcedure
      .input(z.object({
        beachName: z.string(),
        latitude: z.string(),
        longitude: z.string(),
        beforeImages: z.array(z.object({
          data: z.string(),
          mimeType: z.string(),
        })).optional(),
        afterImage: z.object({
          data: z.string(),
          mimeType: z.string(),
        }).optional(),
        mainTrash: z.string(),
        cleaningEase: z.string(),
        collectionAmount: z.number(),
        surveyorName: z.string().optional(),
        beachLength: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const beforeImagePaths: string[] = [];
        let afterImagePath = '';
        
        if (input.beforeImages && input.beforeImages.length > 0) {
          for (const img of input.beforeImages) {
            try {
              const base64Data = img.data.split(',')[1] || img.data;
              const buffer = Buffer.from(base64Data, 'base64');
              const ext = img.mimeType.includes('jpeg') ? 'jpg' : img.mimeType.split('/')[1] || 'jpg';
              const filename = `before_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
              const filepath = path.join(PROJECT_ROOT, 'db', 'images', 'before_images', filename);
              await fs.mkdir(path.dirname(filepath), { recursive: true });
              await fs.writeFile(filepath, buffer);
              beforeImagePaths.push(`db/images/before_images/${filename}`);
            } catch (e) {
              console.error('Failed to save before image:', e);
            }
          }
        }
        
        if (input.afterImage) {
          try {
            const base64Data = input.afterImage.data.split(',')[1] || input.afterImage.data;
            const buffer = Buffer.from(base64Data, 'base64');
            const ext = input.afterImage.mimeType.includes('jpeg') ? 'jpg' : input.afterImage.mimeType.split('/')[1] || 'jpg';
            const filename = `after_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
            const filepath = path.join(PROJECT_ROOT, 'db', 'images', 'after_images', filename);
            await fs.mkdir(path.dirname(filepath), { recursive: true });
            await fs.writeFile(filepath, buffer);
            afterImagePath = `db/images/after_images/${filename}`;
          } catch (e) {
            console.error('Failed to save after image:', e);
          }
        }
        
        const reportId = await createReport({
          beachName: input.beachName,
          latitude: input.latitude,
          longitude: input.longitude,
          beforeImageUrls: JSON.stringify(beforeImagePaths),
          afterImageUrl: afterImagePath || null,
          detectedImageUrls: JSON.stringify([]),
          mainTrash: input.mainTrash,
          cleaningEase: input.cleaningEase,
          collectionAmount: input.collectionAmount,
          surveyorName: input.surveyorName || null,
          isCollected: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return { id: reportId };
      }),
    list: publicProcedure
      .input(z.object({
        status: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ input }) => {
        let reports = await getAllReports();
        if (input?.status === 'collected') {
          reports = reports.filter(r => r.isCollected);
        } else if (input?.status === 'pending') {
          reports = reports.filter(r => !r.isCollected);
        }
        if (input?.startDate) {
          reports = reports.filter(r => new Date(r.createdAt) >= input.startDate!);
        }
        if (input?.endDate) {
          const endDate = new Date(input.endDate);
          endDate.setHours(23, 59, 59, 999);
          reports = reports.filter(r => new Date(r.createdAt) <= endDate);
        }
        return reports.map(r => ({
          ...r,
          beforeImageUrls: JSON.stringify(toApiUrlArray(r.beforeImageUrls)),
          afterImageUrl: toApiUrl(r.afterImageUrl),
          detectedImageUrls: JSON.stringify(toApiUrlArray(r.detectedImageUrls)),
        }));
      }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const report = await getReportById(input.id);
      return report ? { 
        ...report, 
        beforeImageUrls: JSON.stringify(toApiUrlArray(report.beforeImageUrls)), 
        afterImageUrl: toApiUrl(report.afterImageUrl),
        detectedImageUrls: JSON.stringify(toApiUrlArray(report.detectedImageUrls))
      } : null;
    }),
    markAsCollected: publicProcedure.input(z.object({ reportId: z.number() })).mutation(async ({ input }) => {
      await markReportAsCollected(input.reportId);
      return { success: true };
    }),
    delete: publicProcedure.input(z.object({ reportId: z.number() })).mutation(async ({ input }) => {
      await deleteReport(input.reportId);
      return { success: true };
    }),
    getUncollected: publicProcedure.query(async () => {
      const reports = await getUncollectedReports();
      return reports.map(r => ({
        ...r,
        beforeImageUrls: JSON.stringify(toApiUrlArray(r.beforeImageUrls)),
        afterImageUrl: toApiUrl(r.afterImageUrl),
        detectedImageUrls: JSON.stringify(toApiUrlArray(r.detectedImageUrls)),
      }));
    }),
    downloadReport: publicProcedure.input(z.object({ reportId: z.number() })).mutation(async ({ input }) => {
      const report = await getReportById(input.reportId);
      if (!report) return { success: false, error: '보고서를 찾을 수 없습니다.' };
      const detections = await getDetectionsByReportId(input.reportId);
      const detectionStats = detections.reduce((acc, det) => {
        acc[det.className] = (acc[det.className] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const reportDataForPdf = {
        ...report,
        createdAt: report.createdAt.toLocaleString('ko-KR'),
        updatedAt: report.updatedAt.toLocaleString('ko-KR'),
        detections: Object.entries(detectionStats).map(([className, count]) => ({ className, count })),
      };

      const pdfFilename = `report_${report.id}_${Date.now()}.pdf`;
      const pdfFilePath = path.join(PROJECT_ROOT, "db", "reports", pdfFilename);
      await fs.mkdir(path.dirname(pdfFilePath), { recursive: true });

      try {
        const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
        await execFileAsync(pythonExecutable, [path.join(__dirname, 'create_pdf_report.py'), JSON.stringify(reportDataForPdf), pdfFilePath], { 
          cwd: PROJECT_ROOT,
          timeout: 30000 
        });
        return { success: true, url: `/api/reports/download?path=db/reports/${pdfFilename}` };
      } catch (error) {
        console.error("PDF Generation Error:", error);
        return { success: false, error: 'PDF 변환 실패' };
      }
    }),
    downloadAllReports: publicProcedure.mutation(async () => {
      try {
        const allReports = await getAllReports();
        if (allReports.length === 0) return { success: false, error: '다운로드할 보고서가 없습니다.' };
        
        // 모든 보고서 PDF 생성
        const pdfPaths: string[] = [];
        for (const report of allReports) {
          const detections = await getDetectionsByReportId(report.id);
          const detectionStats = detections.reduce((acc, det) => {
            acc[det.className] = (acc[det.className] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const reportDataForPdf = {
            ...report,
            createdAt: report.createdAt.toLocaleString('ko-KR'),
            updatedAt: report.updatedAt.toLocaleString('ko-KR'),
            detections: Object.entries(detectionStats).map(([className, count]) => ({ className, count })),
          };

          const pdfFilename = `report_${report.id}_${Date.now()}.pdf`;
          const pdfFilePath = path.join(PROJECT_ROOT, "db", "reports", pdfFilename);
          await fs.mkdir(path.dirname(pdfFilePath), { recursive: true });

          try {
            const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
            await execFileAsync(pythonExecutable, [path.join(__dirname, 'create_pdf_report.py'), JSON.stringify(reportDataForPdf), pdfFilePath], { 
              cwd: PROJECT_ROOT,
              timeout: 30000 
            });
            pdfPaths.push(pdfFilePath);
          } catch (error) {
            console.error(`PDF Generation Error for report ${report.id}:`, error);
          }
        }

        if (pdfPaths.length === 0) return { success: false, error: 'PDF 생성 실패' };

        // ZIP 파일 생성
        const zipFilename = `reports_${Date.now()}.zip`;
        const zipFilePath = path.join(PROJECT_ROOT, "db", "reports", zipFilename);
        
        return new Promise((resolve) => {
          const output = createWriteStream(zipFilePath);
          const archive = archiver('zip', { zlib: { level: 9 } });
          
          output.on('close', () => {
            resolve({ success: true, url: `/api/reports/download?path=db/reports/${zipFilename}` });
          });
          
          archive.on('error', (err) => {
            console.error('Archive Error:', err);
            resolve({ success: false, error: 'ZIP 생성 실패' });
          });
          
          archive.pipe(output);
          pdfPaths.forEach(pdfPath => {
            archive.file(pdfPath, { name: path.basename(pdfPath) });
          });
          archive.finalize();
        });
      } catch (error) {
        console.error('Download All Error:', error);
        return { success: false, error: '일괄 다운로드 실패' };
      }
    }),
  }),
  detections: router({
    getByReportId: publicProcedure.input(z.object({ reportId: z.number() })).query(async ({ input }) => await getDetectionsByReportId(input.reportId)),
    list: publicProcedure.query(async () => await getAllDetections()),
    getStats: publicProcedure.input(z.object({ reportId: z.number().optional() }).optional()).query(async ({ input }) => {
      const detections = input?.reportId ? await getDetectionsByReportId(input.reportId) : await getAllDetections();
      const stats: Record<string, number> = {};
      detections.forEach(d => { stats[d.className] = (stats[d.className] || 0) + 1; });
      return Object.entries(stats).map(([name, value]) => ({ name, value }));
    }),
  }),
});

export type AppRouter = typeof appRouter;
