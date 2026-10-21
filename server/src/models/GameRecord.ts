import { InferSchemaType, Schema, model } from "mongoose";

const gameRecordSchema = new Schema(
  {
    roomCode: { type: String, required: true, uppercase: true, trim: true },
    players: { type: [String], required: true },
    winner: { type: String, required: true, trim: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
    totalTurns: { type: Number, required: true, min: 0 },
  },
  { versionKey: false },
);

gameRecordSchema.index({ winner: 1 });
gameRecordSchema.index({ endedAt: -1 });

export type GameRecordDocument = InferSchemaType<typeof gameRecordSchema>;
export const GameRecord = model<GameRecordDocument>("GameRecord", gameRecordSchema);
