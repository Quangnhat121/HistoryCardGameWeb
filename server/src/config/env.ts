import dotenv from "dotenv";

dotenv.config();

const parsePort = (value: string | undefined): number => {
  const port = Number(value ?? 3000);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("PORT phải là số nguyên từ 1 đến 65535.");
  }

  return port;
};

export const env = {
  mongoUri: process.env.MONGO_URI ?? "",
  port: parsePort(process.env.PORT),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
};

export const requireMongoUri = (): string => {
  if (!env.mongoUri) {
    throw new Error("Thiếu MONGO_URI. Hãy tạo file .env từ .env.example.");
  }

  return env.mongoUri;
};
