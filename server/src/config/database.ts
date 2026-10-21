import mongoose from "mongoose";
import { requireMongoUri } from "./env";

let connectionPromise: Promise<void> | null = null;

export const connectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) return;
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(requireMongoUri()).then(() => {
      console.log("Đã kết nối MongoDB.");
    }).catch((error: unknown) => {
      connectionPromise = null;
      throw error;
    });
  }
  await connectionPromise;
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  connectionPromise = null;
};
