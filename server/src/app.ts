import path from "node:path";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { env } from "./config/env";
import { connectDatabase } from "./config/database";
import { apiRouter } from "./routes";

export const createApp = (): express.Express => {
  const app = express();

  app.use(cors({ origin: env.clientOrigins }));
  app.use(express.json());
  app.use("/cards", express.static(path.resolve(__dirname, "../public/cards")));
  app.use("/api", async (_request, _response, next) => {
    try {
      await connectDatabase();
      next();
    } catch (error) {
      next(error);
    }
  }, apiRouter);

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use((_request, response) => {
    response.status(404).json({ message: "Không tìm thấy tài nguyên." });
  });

  app.use(
    (error: unknown, _request: Request, response: Response, _next: NextFunction) => {
      console.error(error);
      response.status(500).json({ message: "Lỗi máy chủ nội bộ." });
    },
  );

  return app;
};
