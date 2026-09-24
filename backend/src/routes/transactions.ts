import { Router } from "express";
import { db } from "../db/index.js";

export const transactionsRouter = Router();

transactionsRouter.get("/", (req, res) => {
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;
  const clauses = ["1=1"];
  const values: string[] = [];
  if (category) { clauses.push("user_category = ?"); values.push(category); }
  if (from) { clauses.push("date >= ?"); values.push(from); }
  if (to) { clauses.push("date <= ?"); values.push(to); }
  const rows = db.prepare(`SELECT * FROM transactions WHERE ${clauses.join(" AND ")} ORDER BY date DESC, id DESC`).all(...values);
  res.json({ transactions: rows });
});

transactionsRouter.patch("/:id/category", (req, res) => {
  const { category } = req.body as { category?: string | null };
  const result = db.prepare("UPDATE transactions SET user_category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(category ?? null, req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Transaction not found" });
  res.json({ ok: true });
});
