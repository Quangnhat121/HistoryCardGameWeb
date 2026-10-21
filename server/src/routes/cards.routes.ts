import { Router } from "express";
import { Card } from "../models/Card";

export const cardsRouter = Router();

cardsRouter.get("/", async (_request, response, next) => {
  try {
    const cards = await Card.find()
      .sort({ cardId: 1 })
      .select({ _id: 0, cardId: 1, image: 1, event: 1 })
      .lean();

    response.json(cards);
  } catch (error) {
    next(error);
  }
});
