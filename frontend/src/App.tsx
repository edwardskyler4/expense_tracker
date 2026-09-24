import { useEffect, useState } from "react";

type Transaction = { id: number; date: string; name: string; amount: number; user_category: string | null };
const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

export function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [status, setStatus] = useState("Loading transactions…");
  useEffect(() => { fetch(`${apiUrl}/transactions`).then(r => r.json()).then(data => { setTransactions(data.transactions ?? []); setStatus(""); }).catch(() => setStatus("Start the backend API to load transactions.")); }, []);
  return <main className="shell">
    <header><div><p className="eyebrow">SANDBOX FINANCE</p><h1>Expense Tracker</h1><p className="muted">Connect a test bank account and understand where your money goes.</p></div><button>Connect bank</button></header>
    <section className="summary"><div><span>Total spending</span><strong>$0.00</strong></div><div><span>Transactions</span><strong>{transactions.length}</strong></div><div><span>Uncategorized</span><strong>{transactions.filter(t => !t.user_category).length}</strong></div></section>
    <section className="card"><div className="card-heading"><div><h2>Transactions</h2><p className="muted">Your synced activity will appear here.</p></div><select defaultValue=""><option value="">All categories</option></select></div>{status ? <p className="empty">{status}</p> : transactions.length === 0 ? <p className="empty">No transactions yet. Connect a Sandbox institution to get started.</p> : <table><tbody>{transactions.map(t => <tr key={t.id}><td>{t.date}</td><td>{t.name}</td><td>{t.user_category ?? "Uncategorized"}</td><td>${t.amount.toFixed(2)}</td></tr>)}</tbody></table>}</section>
  </main>;
}
