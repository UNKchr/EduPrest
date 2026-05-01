import { Request, Response } from "express";
import { getSummaryReport } from "../services/reports.service";

export const getSummary = async (_req: Request, res: Response) => {
  const summary = await getSummaryReport();
  res.json(summary);
};