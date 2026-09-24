import { Router } from "express";
import { db } from "../db/index.js";
import { requirePlaid } from "../plaid.js";
import { CountryCode, Products } from "plaid";

export const plaidRouter = Router();

plaidRouter.post("/link-token", async (_req, res, next) => {
  try {
    const response = await requirePlaid().linkTokenCreate({
      user: { client_user_id: "local-development-user" },
      client_name: "Bank-Connected Expense Tracker",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en"
    });
    res.json({ linkToken: response.data.link_token });
  } catch (error) { next(error); }
});

plaidRouter.post("/exchange-public-token", async (req, res, next) => {
  try {
    const { publicToken } = req.body as { publicToken?: string };
    if (!publicToken) return res.status(400).json({ error: "publicToken is required" });
    const response = await requirePlaid().itemPublicTokenExchange({ public_token: publicToken });
    const item = response.data;
    const result = db.prepare(`INSERT INTO connections (item_id, access_token) VALUES (?, ?) ON CONFLICT(item_id) DO UPDATE SET access_token=excluded.access_token, updated_at=CURRENT_TIMESTAMP`).run(item.item_id, item.access_token);
    res.status(201).json({ connectionId: result.lastInsertRowid, itemId: item.item_id });
  } catch (error) { next(error); }
});
