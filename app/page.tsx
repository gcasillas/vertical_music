"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Image from "next/image"
import { useWallet } from "./context/WalletProvider"
import { approveRLT, purchaseListing, safeGetListing } from "./lib/rlt"

// helpers for event parsing
import { xdr, StrKey } from "@stellar/stellar-sdk"
import { Buffer } from "buffer"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js"
import { Line } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
)

function useAnimatedNumber(value: number, duration = 800) {
  const [display, setDisplay] = useState(value)
  useEffect(() => {
    let start = display
    let end = value
    let startTime: number | null = null
    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp
      const progress = timestamp - startTime
      const percent = Math.min(progress / duration, 1)
      const current = start + (end - start) * percent
      setDisplay(Number(current.toFixed(2)))
      if (percent < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value])
  return display
}

export default function Home() {
  // 🚨 Issue 3: Added disconnect to the wallet hook
  const { address, connect, disconnect } = useWallet()

  const [listings, setListings] = useState<any[]>([])
  const LISTINGS_PER_PAGE = 12
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const [balance, setBalance] = useState("0.00")
  const [loading, setLoading] = useState(false)
  const [activityFeed, setActivityFeed] = useState<any[]>([])

  const PRICE_PER_ASSET = 5
  const PLATFORM_FEE_PERCENT = 0.10 
  
  // 🎯 Update Your Counters: Using the new .status property
  const totalActive = listings.filter(l => l.status === "active").length
  const totalSold = listings.filter(l => l.status === "sold").length
  
  const rawVolume = totalSold * PRICE_PER_ASSET || 0  
  const rawRoyalties = rawVolume * (1 - PLATFORM_FEE_PERCENT)
  const rawPlatformRevenue = rawVolume * PLATFORM_FEE_PERCENT
  const rollingVolume = rawVolume

  const animatedVolume = useAnimatedNumber(rawVolume || 0)
  const animatedRoyalties = useAnimatedNumber(rawRoyalties)
  const animatedPlatformRevenue = useAnimatedNumber(rawPlatformRevenue)
  
  const transactionsPerMinute =
  activityFeed.length > 0 ? (activityFeed.length / 5).toFixed(2) : "0.00"

  const chartData = useMemo(() => {
    const royaltyEvents = [...activityFeed]
      .filter(e => e.type === "royalty")
      .reverse();

    if (royaltyEvents.length === 0) {
      return {
        labels: ["No Activity Yet"],
        datasets: [{
          label: "Royalty Flow",
          data: [0],
          borderColor: "#22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.05)",
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        }]
      }
    }

    return {
      labels: royaltyEvents.map((_, i) => `Tx ${i + 1}`),
      datasets: [
        {
          label: "Royalty Flow (RLT)",
          data: royaltyEvents.map(e => Number(e.amount)),
          borderColor: "#22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          borderWidth: 2,
          pointBackgroundColor: "#22c55e",
          tension: 0.4,
          fill: true,
        }
      ]
    };
  }, [activityFeed]);

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: "#27272a" }, ticks: { color: "#71717a" } },
      x: { grid: { display: false }, ticks: { color: "#71717a" } }
    }
  };

  function shortAddress(addr: string) {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`
  }

  function stroopsToRLT(amount: string) {
    return (Number(amount) / 10_000_000).toFixed(2)
  }

const fetchEvents = useCallback(async () => {
  try {
    // 1. grab a ledger so we can compute a positive startLedger
    const ledgerResp = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getLatestLedger",
        params: {}
      })
    });
    const ledgerData = await ledgerResp.json();
    if (ledgerData.error) {
      console.error("Latest ledger RPC error", ledgerData.error);
      return;
    }
    const latestLedger = ledgerData.result?.sequence || 0;
    const startLedger = Math.max(latestLedger - 50, 1);    // >0

    // 2. fetch events with properly‑shaped params
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "getEvents",
        params: {
          startLedger,
          filters: [{
            contractIds: [
              "CDWXMXFIAC5VLA744OGHOQDXDLXLQE2WQCUWUWYJQI2S4O46NEMJXWIC"
            ]
          }],
          limit: 50
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      console.error("Events RPC error:", data.error);
      return;
    }
    console.log("RAW EVENTS FULL:", data.result?.events);

    // build feed items from raw events
    if (data.result?.events) {
      const rawEvents = data.result.events;

      const base64ToBytes = (b64: string) => {
        const bin = atob(b64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
          arr[i] = bin.charCodeAt(i);
        }
        return arr;
      };

      const parseAddressFromTopic = (topic: string) => {
        if (!topic) return "";
        try {
          const ascii = new TextDecoder().decode(base64ToBytes(topic));
          if (ascii.includes(":")) {
            return ascii.split(":")[1];
          }
        } catch {}
        try {
          const buf = base64ToBytes(topic);
          if (buf.length >= 32) {
            const slice = buf.slice(buf.length - 32);
            return StrKey.encodeEd25519PublicKey(Buffer.from(slice));
          }
        } catch {}
        return "";
      };

      const parseAmountVector = (valBase64: string) => {
        const sc = xdr.ScVal.fromXDR(Buffer.from(base64ToBytes(valBase64)));
        const vec = sc.vec() || [];
        return vec.map((el: any) => {
          const sw = el.switch().name;
          if (sw === "scvI128") {
            const v = el.i128();
            const hi = BigInt(v.hi().toString());
            const lo = BigInt(v.lo().toString());
            return (hi << BigInt(64)) + lo;
          }
          if (sw === "scvU32") {
            return BigInt(el.u32());
          }
          return BigInt(0);
        });
      };

      const parsed: any[] = [];
      rawEvents.forEach((ev: any) => {
        const [royaltyAmt = BigInt(0), platformAmt = BigInt(0)] =
          parseAmountVector(ev.value);
        const toAddr =
          parseAddressFromTopic(ev.topic?.[2] || ev.topic?.[3] || "");
        const ts = ev.ledgerClosedAt;

        if (royaltyAmt > BigInt(0)) {
          parsed.push({
            type: "royalty",
            amount: Number(royaltyAmt) / 10_000_000,
            to: toAddr,
            timestamp: ts,
          });
        }
        if (platformAmt > BigInt(0)) {
          parsed.push({
            type: "platform",
            amount: Number(platformAmt) / 10_000_000,
            to: toAddr,
            timestamp: ts,
          });
        }
      });

      setActivityFeed(parsed);
    }
  } catch (err) {
    console.error("Event fetch failed:", err);
  }
}, [])

  const loadListings = useCallback(async (pageToLoad = 0) => {
    try {
      const startId = pageToLoad * LISTINGS_PER_PAGE + 1
      const idsToCheck = Array.from({ length: LISTINGS_PER_PAGE }, (_, i) => startId + i)

      // 🚨 Issue 4: We no longer pass 'address' to safeGetListing because listings are global
      const results = await Promise.all(
        idsToCheck.map((id) => safeGetListing(id, address ?? undefined))
      )

      if (results.length < LISTINGS_PER_PAGE) setHasMore(false)

      if (pageToLoad === 0) {
        setListings(results)
      } else {
        setListings(prev => [...prev, ...results])
      }
    } catch (err) { 
      console.error("Error loading listings:", err) 
    }
    // -------------
  }, [])

  useEffect(() => {
    // We load listings regardless of address now because they are global
    if (!address) return

    setPage(0)
    setLoading(true)
    loadListings(0).finally(() => setLoading(false))
  }, [address])

useEffect(() => {
  fetchEvents() // run immediately
  const interval = setInterval(() => { fetchEvents() }, 5000)
  return () => clearInterval(interval)
}, [])

  async function handleBuy(id: number) {
    if (!address) return
    try {
      setLoading(true)
      await approveRLT(address, 50_000_000)
      await purchaseListing(address, id)
      setListings(prev =>
  prev.map(l =>
    l.id === id
      ? { ...l, status: "sold" }
      : l
        )
      )
      alert(`Success! Asset #${id} purchased.`)
     fetchEvents();
    } catch (error: any) {
      alert(error?.message || "Transaction error")
    } finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-black text-white font-sans p-8">
      
      {/* HEADER WITH LOGOUT */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-12">
        <Image src="/next.svg" alt="Logo" width={100} height={20} className="invert" />
        {address ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400 font-mono bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
              {shortAddress(address)}
            </span>
            <button 
              onClick={() => disconnect()} 
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-xs font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <button onClick={() => connect()} className="px-6 py-2 bg-blue-600 rounded-full text-sm font-medium hover:bg-blue-700 transition-all">
            Connect Wallet
          </button>
        )}
      </header>

      <main className="w-full max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold italic">Vertical Music Marketplace</h1>
          <p className="text-zinc-400 mt-2 text-lg">Automated Royalty Settlements via Soroban</p>
        </div>

        {/* TOP STATS */}
        {address && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-500 text-xs uppercase font-bold">Active</p>
              <p className="text-3xl font-bold mt-2 text-green-400">{totalActive}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-500 text-xs uppercase font-bold">Sold</p>
              <p className="text-3xl font-bold mt-2 text-red-400">{totalSold}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-500 text-xs uppercase font-bold">Total Volume</p>
              <p className="text-3xl font-bold mt-2 text-blue-400">{animatedVolume} RLT</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-white">
              <p className="text-zinc-500 text-xs uppercase font-bold">Royalties</p>
              <p className="text-3xl font-bold mt-2">{animatedRoyalties} RLT</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-500 text-xs uppercase font-bold">Platform Rev</p>
              <p className="text-3xl font-bold mt-2 text-pink-400 animate-pulse">{animatedPlatformRevenue} RLT</p>
            </div>
          </div>
        )}

        {/* MARKETPLACE GRID */}
        {!address ? (
          <div className="text-center py-20 bg-zinc-900 rounded-3xl border border-zinc-800 text-zinc-500">
            Connect wallet to view marketplace.
          </div>
        ) : (
          <>
            {listings.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900 rounded-3xl border border-zinc-800">
                <p className="text-zinc-400 italic">No assets have been listed yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {listings.map((listing) => (
                  <div key={listing.id} className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 group overflow-hidden">
                    <h2 className="text-xl font-bold italic group-hover:text-blue-400 transition-colors">Asset #{listing.id}</h2>
                    <p className="text-zinc-400 mt-2 font-mono">{PRICE_PER_ASSET}.00 RLT</p>
                    
                    {/* 🚨 Issue 2: Refined status-based rendering */}
                    {listing.status === "active" && (
                      <button onClick={() => handleBuy(listing.id)} className="mt-6 w-full bg-blue-600 rounded-xl py-3 font-bold hover:bg-blue-700 transition-all">
                        Buy & Settle
                      </button>
                    )}

                    {listing.status === "sold" && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                         <span className="text-red-600 text-2xl font-black rotate-12 border-2 border-red-600 px-4">SOLD OUT</span>
                      </div>
                    )}

                    {listing.status === "empty" && (
                      <div className="mt-6 w-full bg-zinc-800/50 text-zinc-600 rounded-xl py-3 font-bold text-center border border-zinc-700/30">
                        Not Listed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => {
                    const nextPage = page + 1
                    setPage(nextPage)
                    loadListings(nextPage)
                  }}
                  className="px-8 py-3 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition font-bold"
                >
                  Load More Listings
                </button>
              </div>
            )}
          </>
        )}

        {/* ANALYTICS SECTION */}
        {address && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-24">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-500 text-xs uppercase tracking-widest">Tx / Minute</p>
              <p className="text-3xl font-bold mt-2 text-yellow-400">{transactionsPerMinute}</p>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-500 text-xs uppercase tracking-widest">24h Volume</p>
              <p className="text-3xl font-bold mt-2 text-cyan-400">{rollingVolume} RLT</p>
            </div>

            {/* Activity Feed */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
                <h2 className="text-lg font-bold uppercase tracking-widest text-white">Live Settlement Activity</h2>
              </div>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                {activityFeed.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 text-sm">
                    No settlements yet.
                    <div className="text-xs mt-1">Activity will appear here once purchases occur.</div>
                  </div>
                ) : (
                  activityFeed.map((event, index) => (
                    <div key={index} className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm transition-all hover:border-zinc-600">
                      {event.type === "royalty" ? (
                        <div>
                          <span className="text-green-400">💰 Payout of {event.amount} RLT sent to Artist ({shortAddress(event.to)})</span>
                          <div className="text-xs text-zinc-500 mt-1">{event.timestamp}</div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-purple-400">🏛️ Platform Fee of {event.amount} RLT collected ({shortAddress(event.to)})</span>
                          <div className="text-xs text-zinc-500 mt-1">{event.timestamp}</div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Revenue Graph */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-lg font-bold mb-6 uppercase tracking-widest text-white">Royalty Flow Trend</h2>
              <div className="h-64">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}