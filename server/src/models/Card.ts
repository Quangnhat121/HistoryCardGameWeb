import { InferSchemaType, Schema, model } from "mongoose";

const cardSchema = new Schema(
  {
    cardId: { type: Number, required: true, unique: true, index: true },
    image: { type: String, required: true, trim: true },
    event: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type CardDocument = InferSchemaType<typeof cardSchema>;

export const Card = model<CardDocument>("Card", cardSchema);
