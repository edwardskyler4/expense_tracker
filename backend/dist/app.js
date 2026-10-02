import express from "express";
import cors from "cors";
import { config } from "./config.js";
import "./db/index.js";
import { healthRouter } from "./routes/health.js";
import { plaidRouter } from "./routes/plaid.js";
import { transactionsRouter } from "./routes/transactions.js";
export const app = express();
app.use(cors({ origin: config.CLIENT_ORIGIN }));
app.use(express.json());
app.use("/api/health", healthRouter);
app.use("/api/plaid", plaidRouter);
app.use("/api/transactions", transactionsRouter);
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: error.message || "Internal server error" });
});
