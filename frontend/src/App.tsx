import { useCallback, useEffect, useMemo, useState } from "react";

type Transaction = {
  id: number;
  date: string;
  name: string;
  amount: number;
  user_category: string | null
};

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
const categories = [
  "Food and Drink",
  "Transportation",
  "Rent and Utilities",
  "Shopping",
  "Entertainment",
  "Income",
  "Other"
];

async function request(path: string, options?: RequestInit) {
  const response = await fetch(`${apiUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

function loadPlaidScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.Plaid) return resolve();
    const script = document.createElement("script");
    script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Plaid Link could not load."));
    document.head.appendChild(script);
  });
}

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

function formatMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [status, setStatus] = useState("Loading transactions…");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const loadTransactions = useCallback(async () => {
    try {
      const data = await request("/transactions");
      setTransactions(data.transactions ?? []);
      setStatus("");
    } catch {
      setStatus("Start the backend API to load transactions.");
    }
  }, []);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const months = useMemo(
    () =>
      Array.from(
        new Set(transactions.map(transaction => getMonthKey(transaction.date)))
      ).sort().reverse(),
    [transactions]
  );

  useEffect(() => {
    if (months.length === 0) {
      setSelectedMonth("");
    } else if (!months.includes(selectedMonth)) {
      setSelectedMonth(months[0]);
    }
  }, [months, selectedMonth]);

  async function connectBank() {
    setBusy(true);
    setError("");
    try {
      await loadPlaidScript();
      const { linkToken } = await request("/plaid/link-token", {
        method: "POST"
      });
      const handler = window.Plaid!.create({
        token: linkToken,
        onSuccess: async (publicToken: string) => {
          try {
            await request("/plaid/exchange-public-token", {
              method: "POST",
              body: JSON.stringify({ publicToken })
            });
            await request("/plaid/sync", { method: "POST" });
            await loadTransactions();
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Could not sync the connected bank."
            );
          } finally {
            setBusy(false);
          }
        },
        onExit: () => setBusy(false)
      });
      handler.open();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start Plaid Link."
      );
      setBusy(false);
    }
  }

  async function syncTransactions() {
    setBusy(true);
    setError("");
    try {
      await request("/plaid/sync", { method: "POST" });
      await loadTransactions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not sync transactions."
      );
    } finally {
      setBusy(false);
    }
  }

  async function updateCategory(id: number, category: string) {
    try {
      await request(`/transactions/${id}/category`, {
        method: "PATCH",
        body: JSON.stringify({ category: category || null })
      });
      setTransactions(rows =>
        rows.map(row =>
          row.id === id ? { ...row, user_category: category || null } : row
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update category."
      );
    }
  }

  const monthlyTransactions = selectedMonth
    ? transactions.filter(
        transaction => getMonthKey(transaction.date) === selectedMonth
      )
    : transactions;

  const spending = monthlyTransactions.reduce(
    (sum, transaction) =>
      transaction.amount > 0 ? sum + transaction.amount : sum,
    0
  );
  const earnings = monthlyTransactions.reduce(
    (sum, transaction) =>
      transaction.amount < 0 ? sum + Math.abs(transaction.amount) : sum,
    0
  );
  const netGain = earnings - spending;

  return <main className="shell">
    <header>
      <div>
        <p className="eyebrow">SANDBOX FINANCE</p>
        <h1>Expense Tracker</h1>
        <p className="muted">
          Connect a test bank account and understand where your money goes.
        </p>
      </div>
      <div className="actions">
        <button onClick={() => void connectBank()} disabled={busy}>
          {busy ? "Connecting…" : "Connect bank"}
        </button>
        <button
          className="secondary"
          onClick={() => void syncTransactions()}
          disabled={busy}
        >
          Sync
        </button>
      </div>
    </header>
    {error && <p className="error">{error}</p>}
    <section className="summary">
      <div>
        <span>Total spending</span>
        <strong>${spending.toFixed(2)}</strong>
      </div>
      <div>
        <span>Total earnings</span>
        <strong>${earnings.toFixed(2)}</strong>
      </div>
      <div>
        <span>Net gain</span>
        <strong>${netGain.toFixed(2)}</strong>
      </div>
      <div>
        <span>Transactions</span>
        <strong>{monthlyTransactions.length}</strong>
      </div>
      <div>
        <span>Uncategorized</span>
        <strong>{monthlyTransactions.filter(t => !t.user_category).length}</strong>
      </div>
    </section>
    <section className="card">
      <div className="card-heading">
        <div>
          <h2>Transactions</h2>
          <p className="muted">
            {selectedMonth
              ? `Showing activity for ${formatMonth(selectedMonth)}.`
              : "Your synced activity will appear here."}
          </p>
        </div>
        {months.length > 0 &&
          <label className="month-filter">
            <span>View month</span>
            <select
              aria-label="View transactions by month"
              value={selectedMonth}
              onChange={event => setSelectedMonth(event.target.value)}
            >
              {months.map(month =>
                <option key={month} value={month}>
                  {formatMonth(month)}
                </option>
              )}
            </select>
          </label>}
      </div>
      {status ?
        <p className="empty">{status}</p>
      : transactions.length === 0 ?
        <p className="empty">
          No transactions yet. Connect a Sandbox institution to get started.
        </p>
      : monthlyTransactions.length === 0 ?
        <p className="empty">No transactions for this month.</p>
      :
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {monthlyTransactions.map(t =>
              <tr key={t.id}>
                <td>{t.date}</td>
                <td>{t.name}</td>
                <td>
                  <select
                    value={t.user_category ?? ""}
                    onChange={event =>
                      void updateCategory(t.id, event.target.value)
                    }
                  >
                    <option value="">Uncategorized</option>
                    {categories.map(category =>
                      <option key={category}>{category}</option>
                    )}
                  </select>
                </td>
                <td>${t.amount.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      }
    </section>
  </main>;
}
