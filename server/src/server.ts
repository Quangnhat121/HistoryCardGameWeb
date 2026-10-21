import { createServer } from "node:http";
import express from "express";
import { configureApp } from "./createApp";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { createSocketServer } from "./socket";

const app = configureApp(express());
const httpServer = createServer(app);
createSocketServer(httpServer);

export default httpServer;

const startServer = async (): Promise<void> => {
  await connectDatabase();
  httpServer.listen(env.port, () => {
    console.log(`Server đang chạy tại http://localhost:${env.port}`);
  });
};

if (!process.env.VERCEL) {
  startServer().catch((error: unknown) => {
    console.error("Không thể khởi động server:", error);
    process.exit(1);
  });
}
