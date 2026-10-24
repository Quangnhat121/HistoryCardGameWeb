import dotenv from "dotenv";

dotenv.config();

const parsePort = (value: string | undefined): number => {
  const port = Number(value ?? 3000);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("PORT phải là số nguyên từ 1 đến 65535.");
  }

  return port;
};

const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const env = {
  mongoUri: process.env.MONGO_URI ?? "",
  port: process.env.VERCEL ? 3000 : parsePort(process.env.PORT),
  clientOrigins: (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
  iceServers: [
    {
      urls: (process.env.STUN_URLS ?? "stun:stun.l.google.com:19302,stun:stun.cloudflare.com:3478")
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean),
    },
    ...(process.env.TURN_URLS
      ? [{
          urls: process.env.TURN_URLS.split(",").map((url) => url.trim()).filter(Boolean),
          username: process.env.TURN_USERNAME ?? "",
          credential: process.env.TURN_CREDENTIAL ?? "",
        }]
      : []),
  ],
  cloudflareTurnKeyId: process.env.CLOUDFLARE_TURN_KEY_ID ?? "",
  cloudflareTurnApiToken: process.env.CLOUDFLARE_TURN_API_TOKEN ?? "",
  turnCredentialTtlSeconds: parsePositiveInteger(process.env.TURN_CREDENTIAL_TTL_SECONDS, 86_400),
};

export const requireMongoUri = (): string => {
  if (!env.mongoUri) {
    throw new Error("Thiếu MONGO_URI. Hãy tạo file .env từ .env.example.");
  }

  return env.mongoUri;
};
