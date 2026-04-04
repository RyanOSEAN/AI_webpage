import { eq, desc, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { InsertUser, users, reports, InsertReport, aiDetections, InsertAiDetection } from "../drizzle/schema";
import { ENV } from './_core/env';
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let _db: ReturnType<typeof drizzle> | null = null;

// SQLite 데이터베이스 초기화 및 마이그레이션 체크
export async function getDb() {
  if (!_db) {
    try {
      const dbDir = path.join(__dirname, "..", "db");
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      const dbPath = path.join(dbDir, "ocean-litter.db");
      const sqlite = new Database(dbPath);
      
      // surveyorName 컬럼 자동 추가 체크 (마이그레이션 누락 방지)
      try {
        const tableInfo = sqlite.prepare("PRAGMA table_info(reports)").all() as any[];
        const hasSurveyorName = tableInfo.some(col => col.name === 'surveyorName');
        if (!hasSurveyorName) {
          console.log("[Database] Adding missing column 'surveyorName' to 'reports' table...");
          sqlite.prepare("ALTER TABLE reports ADD COLUMN surveyorName TEXT").run();
        }
      } catch (e) {
        console.error("[Database] Migration check failed:", e);
      }

      _db = drizzle(sqlite);
      console.log("[Database] SQLite connected:", dbPath);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) return;

  try {
    const values: InsertUser = { openId: user.openId };
    const textFields = ["name", "email", "loginMethod"] as const;
    textFields.forEach(field => {
      if (user[field] !== undefined) values[field] = user[field] ?? null;
    });

    if (user.lastSignedIn !== undefined) values.lastSignedIn = user.lastSignedIn;
    if (user.role !== undefined) {
      values.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();

    const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    if (existing.length > 0) {
      await db.update(users).set({ ...values, updatedAt: new Date() }).where(eq(users.openId, user.openId));
    } else {
      await db.insert(users).values(values);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// 보고서 관련 쿼리
export async function createReport(report: Partial<InsertReport> & { beachName: string; latitude: string; longitude: string; beforeImageUrls: string; collectionAmount: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const values = { ...report };
  const result = await db.insert(reports).values(values).returning({ id: reports.id });
  return result[0].id;
}

export async function getAllReports(filters?: { status?: string, startDate?: Date, endDate?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(reports);
  const conditions = [];

  if (filters?.status === 'collected') {
    conditions.push(eq(reports.isCollected, true));
  } else if (filters?.status === 'pending') {
    conditions.push(eq(reports.isCollected, false));
  }

  if (filters?.startDate) conditions.push(gte(reports.createdAt, filters.startDate));
  if (filters?.endDate) conditions.push(lte(reports.createdAt, filters.endDate));

  const allReports = await (conditions.length > 0 
    ? query.where(and(...conditions)) 
    : query).orderBy(desc(reports.createdAt));
  
  return allReports;
}

export async function getReportById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUncollectedReports() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(reports).where(eq(reports.isCollected, false)).orderBy(desc(reports.createdAt));
}

export async function markReportAsCollected(reportId: number, collectionCenter: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reports).set({ isCollected: true, collectionCenter, updatedAt: new Date() }).where(eq(reports.id, reportId));
}

export async function deleteReport(reportId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(aiDetections).where(eq(aiDetections.reportId, reportId));
  await db.delete(reports).where(eq(reports.id, reportId));
}

export async function updateDetectedImageUrls(reportId: number, detectedImageUrls: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reports).set({ detectedImageUrls, updatedAt: new Date() }).where(eq(reports.id, reportId));
}

export async function createAiDetections(detections: InsertAiDetection[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (detections.length === 0) return;
  await db.insert(aiDetections).values(detections);
}

// 🚨 중복 제거 로직을 제거하여 모든 탐지 결과가 개별적으로 저장되도록 함
function deduplicateDetections(detections: any[]): any[] {
  return detections;
}

export async function getDetectionsByReportId(reportId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const detections = await db.select().from(aiDetections).where(eq(aiDetections.reportId, reportId));
  return deduplicateDetections(detections);
}

export async function getAllDetections() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const detections = await db.select().from(aiDetections);
  return deduplicateDetections(detections);
}

export async function getKpiSummary() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const allReports = await db.select().from(reports);
  const totalReports = allReports.length;
  const collectedReports = allReports.filter(r => r.isCollected).length;
  const collectedCollectionAmount = allReports
    .filter(r => r.isCollected)
    .reduce((sum, r) => sum + (r.collectionAmount || 0), 0);
  return { totalReports, collectedReports, collectedCollectionAmount };
}
