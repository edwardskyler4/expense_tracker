/// <reference types="vite/client" />

type PlaidHandler = { open: () => void };

type Plaid = {
  create: (options: {
    token: string;
    onSuccess: (publicToken: string) => void;
    onExit: () => void
  }) => PlaidHandler
};

declare global {
  interface Window {
    Plaid?: Plaid
  }
}

export {};
