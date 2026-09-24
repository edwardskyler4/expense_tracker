import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { config } from "./config.js";
const environment = PlaidEnvironments[config.PLAID_ENV];
export const plaidConfigured = Boolean(config.PLAID_CLIENT_ID && config.PLAID_SECRET);
export const plaid = plaidConfigured
    ? new PlaidApi(new Configuration({ basePath: environment, baseOptions: { headers: {
                "PLAID-CLIENT-ID": config.PLAID_CLIENT_ID,
                "PLAID-SECRET": config.PLAID_SECRET
            } } }))
    : null;
export function requirePlaid() {
    if (!plaid)
        throw new Error("Plaid is not configured. Copy .env.example to .env and add Sandbox credentials.");
    return plaid;
}
