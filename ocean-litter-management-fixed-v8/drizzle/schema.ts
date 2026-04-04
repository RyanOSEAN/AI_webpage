import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Core user table backing auth flow.
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 조사원이 작성한 보고서 테이블
 */
export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId"), // 보고서 작성자 (비로그인 시 null)
  beachName: text("beachName").notNull(), // 해안명
  latitude: text("latitude").notNull(), // 위도
  longitude: text("longitude").notNull(), // 경도
  collectionAmount: integer("collectionAmount").notNull(), // 수거량 (마대 수)
  beachLength: integer("beachLength"), // 해안 길이 (m)
  mainTrash: text("mainTrash"), // 주요 쓰레기 (단일 선택 + 기타 입력)
  surveyorName: text("surveyorName"), // 조사자 이름
  cleaningEase: text("cleaningEase"), // 청소 용이성 (상/중/하)
  beforeImageUrls: text("beforeImageUrls").notNull(), // 청소 전 사진 URL들 (JSON string array)
  afterImageUrl: text("afterImageUrl"), // 청소 후 사진 URL (선택사항)
  detectedImageUrls: text("detectedImageUrls"), // YOLO 탐지 결과 이미지 URL들 (JSON string array)
  isCollected: integer("isCollected", { mode: "boolean" }).default(false).notNull(), // 운반자가 수거 완료했는지 여부
  collectionCenter: text("collectionCenter"), // 선택된 집하장
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * AI 객체 탐지 결과 테이블
 */
export const aiDetections = sqliteTable("aiDetections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reportId: integer("reportId").notNull(), // 연결된 보고서 ID
  imageIndex: integer("imageIndex").default(0), // 여러 장의 청소 전 사진 중 몇 번째인지
  className: text("className").notNull(), // 탐지된 객체 클래스명
  confidence: text("confidence").notNull(), // 신뢰도 (0-100)
  xMin: integer("xMin").notNull(), // 바운딩 박스 좌표
  yMin: integer("yMin").notNull(),
  xMax: integer("xMax").notNull(),
  yMax: integer("yMax").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type AiDetection = typeof aiDetections.$inferSelect;
export type InsertAiDetection = typeof aiDetections.$inferInsert;
