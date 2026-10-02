import "dotenv/config";
import { z } from "zod";
const schema = z.object({
  PORT: z.coerce.number().default(3001),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_PATH: z.string().default("./data/expense-tracker.db"),
  PLAID_CLIENT_ID: z.string().optional(),
  PLAID_SECRET: z.string().optional(),
  PLAID_ENV: z.enum(["sandbox", "development", "production"]).default("sandbox")
});
export const config = schema.parse(process.env);
