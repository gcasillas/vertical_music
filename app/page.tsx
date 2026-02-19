"use client"

import Image from "next/image"
import { useWallet } from "./context/WalletProvider"



export default function Home() {
  const { address, connect } = useWallet()

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
          Vertical Music Dashboard
        </h1>

        <button
          onClick={connect}
          className="mt-8 px-6 py-3 bg-black text-white rounded-xl"
        >
          {address
            ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`
            : "Connect Wallet"}
        </button>
      </main>
    </div>
  )
}
