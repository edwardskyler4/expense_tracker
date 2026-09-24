import { Router } from "express";
import { plaidConfigured } from "../plaid.js";

export const healthRouter = Router();
healthRouter.get("/", (_req, res) => res.json({ ok: true, plaidConfigured }));
