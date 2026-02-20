"use client"

import Image from "next/image"
import { useWallet } from "./context/WalletProvider"
import { approveRLT, purchaseListing } from "./lib/rlt"

export default function Home() {
  const { address, connect } = useWallet()

  // --- New Purchase Logic ---
  async function handleBuy() {
    if (!address) return

    try {
      const PRICE = 50_000_000

      console.log("Approving RLT...")
      await approveRLT(address, PRICE)

      console.log("Purchasing listing...")
      const result = await purchaseListing(address, 4)

      console.log("Purchase result:", result)
      alert("Purchase Successful! Check the console for details.")
    } catch (error: any) {
  console.error(error)
  alert(error?.message || "Transaction error")
}
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />

        <h1 className="mt-8 text-3xl font-semibold text-black dark:text-white">
          Vertical Music Dashboard!
        </h1>

        {/* --- Wallet Connect Button --- */}
        <button
          onClick={() => connect()}
          className="mt-8 px-6 py-3 bg-black text-white rounded-xl hover:bg-zinc-800 transition-colors"
        >
          {address
            ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`
            : "Connect Wallet"}
        </button>

        {/* --- Buy Asset Button (Only shows if connected) --- */}
        {address && (
          <button
            onClick={handleBuy}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold"
          >
            Buy Asset #3
          </button>
        )}
        
      </main>
    </div>
  )
}