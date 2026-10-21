import mongoose from "mongoose";
import { requireMongoUri } from "./env";

export const connectDatabase = async (): Promise<void> => {
  await mongoose.connect(requireMongoUri());
  console.log("Đã kết nối MongoDB.");
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
