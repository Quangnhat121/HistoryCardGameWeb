import { Router } from "express";
import { GameRecord } from "../models/GameRecord";

export const leaderboardRouter = Router();

leaderboardRouter.get("/", async (_request, response, next) => {
  try {
    const leaderboard = await GameRecord.aggregate<{ name: string; wins: number }>([
      { $group: { _id: "$winner", wins: { $sum: 1 } } },
      { $sort: { wins: -1, _id: 1 } },
      { $limit: 10 },
      { $project: { _id: 0, name: "$_id", wins: 1 } },
    ]);

    response.json(leaderboard);
  } catch (error) {
    next(error);
  }
});
