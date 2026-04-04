-- SQLite 데이터베이스 초기화

CREATE TABLE IF NOT EXISTS `users` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `openId` TEXT NOT NULL UNIQUE,
  `name` TEXT,
  `email` TEXT,
  `loginMethod` TEXT,
  `role` TEXT DEFAULT 'user' NOT NULL CHECK(`role` IN ('user', 'admin')),
  `createdAt` INTEGER NOT NULL,
  `updatedAt` INTEGER NOT NULL,
  `lastSignedIn` INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS `reports` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `userId` INTEGER NOT NULL,
  `beachName` TEXT NOT NULL,
  `latitude` TEXT NOT NULL,
  `longitude` TEXT NOT NULL,
  `collectionAmount` INTEGER NOT NULL,
  `beachLength` INTEGER,
  `mainTrash` TEXT,
  `beforeImageUrl` TEXT NOT NULL,
  `beforeImageKey` TEXT NOT NULL,
  `afterImageUrl` TEXT NOT NULL,
  `afterImageKey` TEXT NOT NULL,
  `detectedImageUrl` TEXT,
  `isCollected` INTEGER DEFAULT 0 NOT NULL,
  `collectionCenter` TEXT,
  `createdAt` INTEGER NOT NULL,
  `updatedAt` INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS `aiDetections` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `reportId` INTEGER NOT NULL,
  `className` TEXT NOT NULL,
  `confidence` TEXT NOT NULL,
  `xMin` INTEGER NOT NULL,
  `yMin` INTEGER NOT NULL,
  `xMax` INTEGER NOT NULL,
  `yMax` INTEGER NOT NULL,
  `createdAt` INTEGER NOT NULL
);

-- 기본 사용자 추가
INSERT OR IGNORE INTO `users` (`id`, `openId`, `name`, `role`, `createdAt`, `updatedAt`, `lastSignedIn`)
VALUES (1, 'anonymous', '익명 사용자', 'user', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);
