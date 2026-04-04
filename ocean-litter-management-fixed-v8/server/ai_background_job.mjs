/**
 * 백그라운드 AI 분석 작업 (SQLite 버전)
 * 미분석 보고서를 자동으로 감지하고 Python으로 AI 분석 실행
 */
import { spawn } from 'child_process';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { reports, aiDetections } from '../drizzle/schema.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRIPT_DIR = __dirname;
const AI_SCRIPT_PATH = path.join(SCRIPT_DIR, 'analyze.py');
const DB_PATH = path.join(SCRIPT_DIR, '..', 'db', 'ocean-litter.db');
const OUTPUT_DIR = path.join(SCRIPT_DIR, '..', 'db', 'images');

let db = null;

async function getDb() {
  if (!db) {
    try {
      const sqlite = new Database(DB_PATH);
      
      // surveyorName 컬럼 자동 추가 체크 (백그라운드 작업에서도 독립적으로 수행)
      try {
        const tableInfo = sqlite.prepare("PRAGMA table_info(reports)").all();
        const hasSurveyorName = tableInfo.some(col => col.name === 'surveyorName');
        if (!hasSurveyorName) {
          console.log('[AI Background] Missing column "surveyorName" detected. Adding now...');
          sqlite.prepare("ALTER TABLE reports ADD COLUMN surveyorName TEXT").run();
        }
      } catch (e) {
        console.error('[AI Background] Migration check failed:', e);
      }

      db = drizzle(sqlite);
      console.log('[AI Background] SQLite 연결 성공:', DB_PATH);
    } catch (error) {
      console.error('[AI Background] DB 연결 실패:', error);
      return null;
    }
  }
  return db;
}

async function analyzeImageWithPython(imagePath, reportId, imageIndex) {
  return new Promise((resolve, reject) => {
    const python = spawn('python', [AI_SCRIPT_PATH, imagePath, OUTPUT_DIR, reportId.toString(), imageIndex.toString()], {
      env: { ...process.env, PYTHONUNBUFFERED: '1', PYTHONDONTWRITEBYTECODE: '1' },
    });

    let stdout = '';
    let stderr = '';
    python.stdout.on('data', (data) => { stdout += data.toString(); });
    python.stderr.on('data', (data) => { stderr += data.toString(); });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python 실행 실패: ${stderr}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function processUnanalyzedReports() {
  const database = await getDb();
  if (!database) return;

  try {
    // 쿼리 실행 전 다시 한번 컬럼 존재 여부 확인 (안전 장치)
    // 🚨 중요: 분석 중인 보고서가 중복 선택되지 않도록 detectedImageUrls가 null이거나 '[]'인 것만 가져옴
    const allReports = await database.select().from(reports);
    const unanalyzedReports = allReports.filter(r => !r.detectedImageUrls || r.detectedImageUrls === '[]');

    if (unanalyzedReports.length === 0) return;

    console.log(`[AI Background] ${unanalyzedReports.length}개의 미분석 보고서 발견`);

    for (const report of unanalyzedReports.slice(0, 5)) {
      // 🚨 즉시 '분석 중' 상태로 표시하여 다른 프로세스나 다음 인터벌에서 중복 처리 방지
      await database.update(reports)
        .set({ detectedImageUrls: '["PROCESSING"]', updatedAt: new Date() })
        .where(eq(reports.id, report.id));
      try {
        let beforeUrls = [];
        try {
          beforeUrls = JSON.parse(report.beforeImageUrls || '[]');
        } catch (e) {
          console.error(`[AI Background] JSON 파싱 오류 (보고서 ${report.id}):`, e);
          continue;
        }
        
        if (beforeUrls.length === 0) continue;

        console.log(`[AI Background] 보고서 ${report.id} 분석 시작 (이미지 ${beforeUrls.length}장)`);
        
        // 🚨 중요: 분석 전에 기존 AI 탐지 데이터를 삭제하여 중복 삽입을 방지
        await database.delete(aiDetections).where(eq(aiDetections.reportId, report.id));
        console.log(`[AI Background] 보고서 ${report.id}의 기존 AI 탐지 데이터 삭제 완료.`);

        const detectedUrls = [];

        for (let i = 0; i < beforeUrls.length; i++) {
          let relPath = beforeUrls[i];
          // API URL 형태 제거하고 순수 상대 경로만 추출
          if (relPath.includes('path=')) {
            relPath = relPath.split('path=')[1];
          }
          
          const imagePath = path.join(SCRIPT_DIR, '..', relPath);
          
          if (!fs.existsSync(imagePath)) {
            console.error(`[AI Background] 이미지 파일 없음: ${imagePath}`);
            continue;
          }

          const analysisResult = await analyzeImageWithPython(imagePath, report.id, i);
          if (analysisResult.success) {
            for (const det of analysisResult.detections) {
              await database.insert(aiDetections).values({
                reportId: report.id,
                imageIndex: i,
                className: det.className,
                confidence: det.confidence.toString(),
                xMin: det.xMin, yMin: det.yMin, xMax: det.xMax, yMax: det.yMax,
                createdAt: new Date(),
              });
            }
            if (analysisResult.detectedImageFilename) {
              // DB에는 순수 상대 경로 저장
              detectedUrls.push(`db/images/${analysisResult.detectedImageFilename}`);
            }
          }
        }

        // 분석 결과 업데이트 (성공하든 실패하든 'PROCESSING' 상태를 해제해야 함)
        await database.update(reports)
          .set({ 
            detectedImageUrls: detectedUrls.length > 0 ? JSON.stringify(detectedUrls) : '[]', 
            updatedAt: new Date() 
          })
          .where(eq(reports.id, report.id));
        
        if (detectedUrls.length > 0) {
          console.log(`[AI Background] 보고서 ${report.id} 분석 완료 (${detectedUrls.length}장)`);
        } else {
          console.log(`[AI Background] 보고서 ${report.id} 분석 완료 (탐지된 객체 없음)`);
        }
      } catch (error) {
        console.error(`[AI Background] 보고서 ${report.id} 처리 중 오류:`, error);
      }
    }
  } catch (error) {
    console.error('[AI Background] 보고서 처리 중 오류:', error);
  }
}

export function startAIBackgroundJob() {
  console.log('[AI Background] 백그라운드 AI 분석 작업 시작');
  setInterval(() => { processUnanalyzedReports(); }, 10000);
  setTimeout(() => { processUnanalyzedReports(); }, 5000);
}
