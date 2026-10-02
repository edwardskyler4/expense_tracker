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
  } catch (error) {
    next(error);
  }
});
plaidRouter.post("/exchange-public-token", async (req, res, next) => {
  try {
    const { publicToken } = req.body;
    if (!publicToken)
      return res.status(400).json({ error: "publicToken is required" });
    const response = await requirePlaid().itemPublicTokenExchange({
      public_token: publicToken
    });
    const item = response.data;
    const itemDetails = await requirePlaid().itemGet({
      access_token: item.access_token
    });
    db.prepare(
      `INSERT INTO connections (item_id, access_token, institution_name) VALUES (?, ?, ?)
      ON CONFLICT(item_id) DO UPDATE SET access_token=excluded.access_token,
      institution_name=excluded.institution_name, updated_at=CURRENT_TIMESTAMP`
    ).run(
      item.item_id,
      item.access_token,
      itemDetails.data.item.institution_name ?? null
    );
    const connection = db
      .prepare("SELECT id FROM connections WHERE item_id = ?")
      .get(item.item_id);
    res.status(201).json({ connectionId: connection.id, itemId: item.item_id });
  } catch (error) {
    next(error);
  }
});
plaidRouter.post("/sync", async (_req, res, next) => {
  try {
    const connection = db
      .prepare(
        "SELECT * FROM connections ORDER BY updated_at DESC, id DESC LIMIT 1"
      )
      .get();
    if (!connection)
      return res
        .status(404)
        .json({ error: "Connect a bank before syncing transactions." });
    let cursor;
    let added = 0;
    let modified = 0;
    let removed = 0;
    let hasMore = true;
    while (hasMore) {
      const data = (
        await requirePlaid().transactionsSync({
          access_token: connection.access_token,
          cursor
        })
      ).data;
      const accountUpsert =
        db.prepare(`INSERT INTO accounts (connection_id, plaid_account_id, name, official_name, mask, type, subtype, current_balance, available_balance)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(plaid_account_id) DO UPDATE SET name=excluded.name, official_name=excluded.official_name, mask=excluded.mask, type=excluded.type, subtype=excluded.subtype, current_balance=excluded.current_balance, available_balance=excluded.available_balance, updated_at=CURRENT_TIMESTAMP`);
      for (const account of data.accounts)
        accountUpsert.run(
          connection.id,
          account.account_id,
          account.name,
          account.official_name ?? null,
          account.mask ?? null,
          account.type,
          account.subtype ?? null,
          account.balances.current,
          account.balances.available ?? null
        );
      const transactionUpsert =
        db.prepare(`INSERT INTO transactions (account_id, plaid_transaction_id, date, name, merchant_name, amount, iso_currency_code, plaid_category, pending)
        VALUES ((SELECT id FROM accounts WHERE plaid_account_id = ?), ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(plaid_transaction_id) DO UPDATE SET account_id=excluded.account_id, date=excluded.date, name=excluded.name, merchant_name=excluded.merchant_name, amount=excluded.amount, iso_currency_code=excluded.iso_currency_code, plaid_category=excluded.plaid_category, pending=excluded.pending, updated_at=CURRENT_TIMESTAMP`);
      for (const transaction of [...data.added, ...data.modified])
        transactionUpsert.run(
          transaction.account_id,
          transaction.transaction_id,
          transaction.date,
          transaction.name,
          transaction.merchant_name ?? null,
          transaction.amount,
          transaction.iso_currency_code ?? null,
          transaction.personal_finance_category?.primary ??
            transaction.category?.[0] ??
            null,
          transaction.pending ? 1 : 0
        );
      added += data.added.length;
      modified += data.modified.length;
      const removeTransaction = db.prepare(
        "DELETE FROM transactions WHERE plaid_transaction_id = ?"
      );
      for (const transaction of data.removed)
        removeTransaction.run(transaction.transaction_id);
      removed += data.removed.length;
      cursor = data.next_cursor;
      hasMore = data.has_more;
    }
    db.prepare(
      "UPDATE connections SET updated_at=CURRENT_TIMESTAMP WHERE id = ?"
    ).run(connection.id);
    res.json({
      connection: {
        id: connection.id,
        institutionName: connection.institution_name
      },
      added,
      modified,
      removed
    });
  } catch (error) {
    next(error);
  }
});
