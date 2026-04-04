-- 1. 기존 테이블 백업
ALTER TABLE reports RENAME TO reports_old;
ALTER TABLE aiDetections RENAME TO aiDetections_old;

-- 2. 새 reports 테이블 생성
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  beachName TEXT NOT NULL,
  latitude TEXT NOT NULL,
  longitude TEXT NOT NULL,
  collectionAmount INTEGER NOT NULL,
  beachLength INTEGER,
  mainTrash TEXT,
  cleaningEase TEXT,
  beforeImageUrls TEXT NOT NULL,
  afterImageUrl TEXT NOT NULL,
  detectedImageUrls TEXT,
  isCollected INTEGER DEFAULT 0 NOT NULL,
  collectionCenter TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- 3. 새 aiDetections 테이블 생성
CREATE TABLE aiDetections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reportId INTEGER NOT NULL,
  imageIndex INTEGER DEFAULT 0,
  className TEXT NOT NULL,
  confidence TEXT NOT NULL,
  xMin INTEGER NOT NULL,
  yMin INTEGER NOT NULL,
  xMax INTEGER NOT NULL,
  yMax INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
);

-- 4. 기존 데이터 마이그레이션 (간단한 변환)
INSERT INTO reports (
  id, userId, beachName, latitude, longitude, collectionAmount, beachLength, 
  mainTrash, beforeImageUrls, afterImageUrl, detectedImageUrls, isCollected, 
  collectionCenter, createdAt, updatedAt
)
SELECT 
  id, userId, beachName, latitude, longitude, collectionAmount, beachLength, 
  mainTrash, '["' || beforeImageUrl || '"]', afterImageUrl, '["' || IFNULL(detectedImageUrl, '') || '"]', 
  isCollected, collectionCenter, createdAt, updatedAt
FROM reports_old;

INSERT INTO aiDetections (
  id, reportId, imageIndex, className, confidence, xMin, yMin, xMax, yMax, createdAt
)
SELECT 
  id, reportId, 0, className, confidence, xMin, yMin, xMax, yMax, createdAt
FROM aiDetections_old;

-- 5. 이전 테이블 삭제 (선택 사항, 안전을 위해 주석 처리하거나 나중에 실행)
-- DROP TABLE reports_old;
-- DROP TABLE aiDetections_old;
