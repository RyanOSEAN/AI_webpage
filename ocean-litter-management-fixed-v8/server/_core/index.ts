import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
// @ts-ignore
import { startAIBackgroundJob } from "../ai_background_job.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // 🖼️ 이미지 서빙 API (경로 보정 포함)
  app.get("/api/images", (req, res) => {
    const relPath = req.query.path as string;
    if (!relPath) return res.status(400).send("Path is required");
    
    const fullPath = path.join(__dirname, "..", "..", relPath);
    if (fs.existsSync(fullPath)) {
      res.sendFile(fullPath);
    } else {
      res.status(404).send("Image not found");
    }
  });

  // 📄 보고서 다운로드 API
  app.get("/api/reports/download", (req, res) => {
    const relPath = req.query.path as string;
    if (!relPath) return res.status(400).send("Path is required");
    
    const fullPath = path.join(__dirname, "..", "..", relPath);
    if (fs.existsSync(fullPath)) {
      res.download(fullPath);
    } else {
      res.status(404).send("File not found");
    }
  });

  const dbPath = path.join(__dirname, "..", "..", "db");
  app.use("/db", express.static(dbPath));

  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  server.listen(port, () => {
    console.log(`✅ Server running at: http://localhost:${port}/`);
    startAIBackgroundJob();
  });
}

startServer().catch(console.error);
