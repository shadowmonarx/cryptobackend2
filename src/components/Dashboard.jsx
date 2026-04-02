// src/components/Dashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { buyAsset, getMyProfile, getTradeHistory } from "../api/authApi";
import "./Dashboard.css";

// ── Supported assets ──────────────────────────────────────────────────────────
const ASSETS = [
  { symbol: "BTC", name: "Bitcoin",  icon: "₿", color: "#f7931a" },
  { symbol: "ETH", name: "Ethereum", icon: "Ξ", color: "#627eea" },
  { symbol: "SOL", name: "Solana",   icon: "◎", color: "#9945ff" },
  { symbol: "BNB", name: "BNB",      icon: "B", color: "#f3ba2f" },
  { symbol: "ADA", name: "Cardano",  icon: "₳", color: "#0033ad" },
];

// ── Live price fetcher (Binance public API) ───────────────────────────────────
async function fetchPrices() {
  const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "ADAUSDT"];
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`
    );
    const data = await res.json();
    return data.reduce((acc, item) => {
      const sym = item.symbol.replace("USDT", "");
      acc[sym] = {
        price:  parseFloat(item.lastPrice),
        change: parseFloat(item.priceChangePercent),
      };
      return acc;
    }, {});
  } catch {
    // Fallback prices if Binance is unreachable
    return {
      BTC: { price: 67000,  change: 1.2  },
      ETH: { price: 3500,   change: -0.8 },
      SOL: { price: 145,    change: 2.1  },
      BNB: { price: 580,    change: 0.5  },
      ADA: { price: 0.45,   change: -1.3 },
    };
  }
}

function fmt(n, decimals = 2) {
  if (n === undefined || n === null) return "—";
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { currentUser } = useAuth();

  const [tab, setTab]           = useState("trade");   // "trade" | "portfolio" | "history"
  const [prices, setPrices]     = useState({});
  const [pricesLoading, setPL]  = useState(true);

  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [amount, setAmount]     = useState("");
  const [buying, setBuying]     = useState(false);
  const [buyResult, setBuyResult] = useState(null);
  const [buyError, setBuyError] = useState("");

  const [backendUser, setBackendUser] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [trades, setTrades]     = useState([]);
  const [historyLoading, setHL] = useState(false);

  // ── Fetch live prices on mount + every 15s ──────────────────────────────────
  const refreshPrices = useCallback(async () => {
    const p = await fetchPrices();
    setPrices(p);
    setPL(false);
  }, []);

  useEffect(() => {
    refreshPrices();
    const id = setInterval(refreshPrices, 500); // 15s — was 100ms which hammers Binance
    return () => clearInterval(id);
  }, [refreshPrices]);

  // ── Refresh user profile (balance) ─────────────────────────────────────────
  const refreshProfile = useCallback(async () => {
    try {
      const data = await getMyProfile();
      setBackendUser(data);
      setHoldings(data.holdings || []);
    } catch (e) {
      console.error("Profile refresh failed", e);
    }
  }, []);

  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  // ── Load trade history when tab is opened ──────────────────────────────────
  useEffect(() => {
    if (tab !== "history") return;
    setHL(true);
    getTradeHistory()
      .then(setTrades)
      .catch(() => setTrades([]))
      .finally(() => setHL(false));
  }, [tab]);

  // ── Buy handler ─────────────────────────────────────────────────────────────
  async function handleBuy() {
    setBuyError("");
    setBuyResult(null);
    const usdAmount = parseFloat(amount);
    if (!amount || isNaN(usdAmount) || usdAmount <= 0) {
      return setBuyError("Enter a valid USD amount.");
    }
    setBuying(true);
    try {
      const result = await buyAsset(selectedAsset.symbol, usdAmount);
      setBuyResult(result);
      setAmount("");
      await refreshProfile();
    } catch (e) {
      setBuyError(e.message || "Trade failed.");
    } finally {
      setBuying(false);
    }
  }

  const currentPrice = prices[selectedAsset.symbol];
  const estimatedQty =
    currentPrice && amount && !isNaN(parseFloat(amount))
      ? parseFloat(amount) / currentPrice.price
      : null;

  return (
    <div className="dash-root">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-mark">CT</span>
          <span className="logo-text">CryptoTrade</span>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: "trade",     label: "Trade",     icon: "⇄" },
            { id: "portfolio", label: "Portfolio",  icon: "◈" },
            { id: "history",   label: "History",    icon: "≡" },
          ].map(item => (
            <button
              key={item.id}
              className={`nav-item ${tab === item.id ? "active" : ""}`}
              onClick={() => setTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{currentUser.email[0].toUpperCase()}</div>
          <div className="user-info">
            <p className="user-email">{currentUser.email}</p>
            <p className="user-balance">
              ${backendUser ? fmt(backendUser.balance) : "—"}
            </p>
          </div>
          <button className="signout-btn" onClick={() => signOut(auth)} title="Sign out">
            ⎋
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="dash-main">

        {/* ── TOP BAR: live price ticker ── */}
        <div className="ticker-bar">
          {ASSETS.map(a => {
            const p = prices[a.symbol];
            return (
              <div key={a.symbol} className="ticker-item">
                <span className="ticker-sym" style={{ color: a.color }}>{a.symbol}</span>
                <span className="ticker-price">
                  {pricesLoading ? "···" : `$${fmt(p?.price, a.symbol === "ADA" ? 4 : 2)}`}
                </span>
                {p && (
                  <span className={`ticker-chg ${p.change >= 0 ? "up" : "down"}`}>
                    {p.change >= 0 ? "▲" : "▼"} {Math.abs(p.change).toFixed(2)}%
                  </span>
                )}
              </div>
            );
          })}
          <div className="ticker-pulse" />
        </div>

        {/* ══════════════════════════════════════════════════════════════
            TAB: TRADE
        ══════════════════════════════════════════════════════════════ */}
        {tab === "trade" && (
          <div className="panel fade-in">
            <div className="panel-header">
              <h2>Buy Crypto</h2>
              <p className="panel-sub">Market order · instant execution</p>
            </div>

            <div className="trade-layout">
              {/* Asset selector */}
              <div className="asset-grid">
                {ASSETS.map(a => {
                  const p = prices[a.symbol];
                  return (
                    <button
                      key={a.symbol}
                      className={`asset-card ${selectedAsset.symbol === a.symbol ? "selected" : ""}`}
                      onClick={() => { setSelectedAsset(a); setBuyResult(null); setBuyError(""); }}
                      style={{ "--asset-color": a.color }}
                    >
                      <span className="asset-icon" style={{ color: a.color }}>{a.icon}</span>
                      <span className="asset-sym">{a.symbol}</span>
                      <span className="asset-name">{a.name}</span>
                      <span className="asset-price">
                        {pricesLoading ? "···" : `$${fmt(p?.price, a.symbol === "ADA" ? 4 : 2)}`}
                      </span>
                      {p && (
                        <span className={`asset-chg ${p.change >= 0 ? "up" : "down"}`}>
                          {p.change >= 0 ? "+" : ""}{p.change.toFixed(2)}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Order form */}
              <div className="order-box">
                <div className="order-header">
                  <span className="order-asset-icon" style={{ color: selectedAsset.color }}>
                    {selectedAsset.icon}
                  </span>
                  <div>
                    <div className="order-asset-name">{selectedAsset.name}</div>
                    <div className="order-asset-sym">{selectedAsset.symbol} / USDT</div>
                  </div>
                </div>

                <div className="order-price-display">
                  <span className="opd-label">Current Price</span>
                  <span className="opd-value">
                    {pricesLoading
                      ? <span className="skeleton-text">Loading…</span>
                      : `$${fmt(currentPrice?.price, selectedAsset.symbol === "ADA" ? 4 : 2)}`
                    }
                  </span>
                </div>

                <div className="input-group">
                  <label>Amount (USD)</label>
                  <div className="input-wrap">
                    <span className="input-prefix">$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={e => { setAmount(e.target.value); setBuyResult(null); setBuyError(""); }}
                      min="1"
                      step="any"
                    />
                  </div>
                  <div className="quick-amounts">
                    {[100, 500, 1000, 5000].map(v => (
                      <button key={v} className="quick-btn" onClick={() => setAmount(String(v))}>
                        ${v.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {estimatedQty !== null && (
                  <div className="estimate-row">
                    <span>You receive</span>
                    <span className="estimate-val">
                      ≈ {estimatedQty.toFixed(8)} {selectedAsset.symbol}
                    </span>
                  </div>
                )}

                {backendUser && (
                  <div className="balance-row">
                    <span>Available</span>
                    <span>${fmt(backendUser.balance)}</span>
                  </div>
                )}

                {buyError && <div className="trade-error">{buyError}</div>}

                {buyResult && (
                  <div className="trade-success">
                    <span className="ts-icon">✓</span>
                    <div>
                      <p className="ts-main">
                        Bought {parseFloat(buyResult.quantityBought).toFixed(8)} {buyResult.asset}
                      </p>
                      <p className="ts-sub">
                        @ ${fmt(buyResult.pricePerUnit)} · New balance: ${fmt(buyResult.newBalance)}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  className="buy-btn"
                  onClick={handleBuy}
                  disabled={buying || !amount}
                  style={{ "--asset-color": selectedAsset.color }}
                >
                  {buying
                    ? <span className="btn-spinner" />
                    : `Buy ${selectedAsset.symbol}`
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB: PORTFOLIO
        ══════════════════════════════════════════════════════════════ */}
        {tab === "portfolio" && (
          <div className="panel fade-in">
            <div className="panel-header">
              <h2>Portfolio</h2>
              <p className="panel-sub">Your current holdings</p>
            </div>

            <div className="portfolio-stats">
              <div className="stat-card">
                <span className="stat-label">Cash Balance</span>
                <span className="stat-val">${backendUser ? fmt(backendUser.balance) : "—"}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Assets Held</span>
                <span className="stat-val">{holdings.length}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Holdings Value</span>
                <span className="stat-val">
                  {holdings.length === 0 || pricesLoading ? "—" : (() => {
                    const total = holdings.reduce((sum, h) => {
                      const p = prices[h.asset]?.price || 0;
                      return sum + parseFloat(h.quantity) * p;
                    }, 0);
                    return `$${fmt(total)}`;
                  })()}
                </span>
              </div>
            </div>

            {holdings.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">◈</span>
                <p>No holdings yet. Make your first trade!</p>
                <button className="link-btn" onClick={() => setTab("trade")}>Go to Trade →</button>
              </div>
            ) : (
              <div className="holdings-table">
                <div className="ht-head">
                  <span>Asset</span>
                  <span>Quantity</span>
                  <span>Price</span>
                  <span>Value</span>
                  <span>24h</span>
                </div>
                {holdings.map(h => {
                  const asset = ASSETS.find(a => a.symbol === h.asset);
                  const p     = prices[h.asset];
                  const value = p ? parseFloat(h.quantity) * p.price : null;
                  return (
                    <div className="ht-row" key={h.asset}>
                      <span className="ht-asset">
                        <span className="ht-icon" style={{ color: asset?.color }}>
                          {asset?.icon || h.asset[0]}
                        </span>
                        <span>
                          <span className="ht-sym">{h.asset}</span>
                          <span className="ht-full">{asset?.name}</span>
                        </span>
                      </span>
                      <span className="ht-qty">{parseFloat(h.quantity).toFixed(8)}</span>
                      <span className="ht-price">
                        {p ? `$${fmt(p.price, h.asset === "ADA" ? 4 : 2)}` : "—"}
                      </span>
                      <span className="ht-value">{value ? `$${fmt(value)}` : "—"}</span>
                      <span className={`ht-chg ${p?.change >= 0 ? "up" : "down"}`}>
                        {p ? `${p.change >= 0 ? "+" : ""}${p.change.toFixed(2)}%` : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB: HISTORY
        ══════════════════════════════════════════════════════════════ */}
        {tab === "history" && (
          <div className="panel fade-in">
            <div className="panel-header">
              <h2>Trade History</h2>
              <p className="panel-sub">All your executed orders</p>
            </div>

            {historyLoading ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Loading history…</p>
              </div>
            ) : trades.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">≡</span>
                <p>No trades yet.</p>
                <button className="link-btn" onClick={() => setTab("trade")}>Make your first trade →</button>
              </div>
            ) : (
              <div className="history-table">
                <div className="hist-head">
                  <span>Type</span>
                  <span>Asset</span>
                  <span>Quantity</span>
                  <span>Price</span>
                  <span>Total</span>
                  <span>Date</span>
                </div>
                {trades.map(t => {
                  const asset = ASSETS.find(a => a.symbol === t.asset);
                  return (
                    <div className="hist-row" key={t.id}>
                      <span className={`hist-type ${t.type === "BUY" ? "buy" : "sell"}`}>
                        {t.type}
                      </span>
                      <span className="hist-asset">
                        <span style={{ color: asset?.color }}>{asset?.icon || t.asset[0]}</span>
                        {" "}{t.asset}
                      </span>
                      <span className="hist-qty">{parseFloat(t.quantity).toFixed(8)}</span>
                      <span className="hist-price">${fmt(t.price)}</span>
                      <span className="hist-total">${fmt(t.total)}</span>
                      <span className="hist-date">
                        {new Date(t.timestamp).toLocaleDateString("en-US", {
                          month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
