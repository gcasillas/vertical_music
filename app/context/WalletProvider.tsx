"use client"

import { createContext, useContext, useState } from "react"
import * as freighter from "@stellar/freighter-api"


type WalletContextType = {
  address: string | null
  connect: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)

async function connect() {
  try {
    const allowed = await freighter.isAllowed()
    if (!allowed) {
      await freighter.requestAccess()
    }

    const result = await freighter.getAddress()

    if (result && result.address) {
      setAddress(result.address)
    }
  } catch (err) {
    console.error("Wallet connection failed:", err)
  }
}



  return (
    <WalletContext.Provider value={{ address, connect }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) throw new Error("useWallet must be used inside WalletProvider")
  return context
}
