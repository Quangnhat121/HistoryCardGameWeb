import { createServer } from "node:http";
import { createApp } from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { createSocketServer } from "./socket";

const startServer = async (): Promise<void> => {
  await connectDatabase();

  const httpServer = createServer(createApp());
  createSocketServer(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`Server đang chạy tại http://localhost:${env.port}`);
  });
};

startServer().catch((error: unknown) => {
  console.error("Không thể khởi động server:", error);
  process.exit(1);
});
