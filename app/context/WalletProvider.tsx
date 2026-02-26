"use client"

import { createContext, useContext, useState } from "react"
import * as freighter from "@stellar/freighter-api"


type WalletContextType = {
  address: string | null
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)

  function disconnect() {
  setAddress(null)
}

async function connect() {
  try {
    await freighter.setAllowed()

    const { address } = await freighter.getAddress()

    if (address) {
      setAddress(address)
    }
  } catch (err) {
    console.error("Freighter connection failed:", err)
  }
}






  return (
    <WalletContext.Provider value={{ address, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) throw new Error("useWallet must be used inside WalletProvider")
  return context
}
