import { Router } from "express";
import { cardsRouter } from "./cards.routes";
import { leaderboardRouter } from "./leaderboard.routes";

export const apiRouter = Router();

apiRouter.use("/cards", cardsRouter);
apiRouter.use("/leaderboard", leaderboardRouter);
