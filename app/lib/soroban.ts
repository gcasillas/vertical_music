import {
  Contract,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  rpc,
  xdr,
} from "@stellar/stellar-sdk"

import * as freighter from "@stellar/freighter-api"

const server = new rpc.Server("https://rpc-futurenet.stellar.org")

export async function invokeContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  userAddress: string
) {
  try {
    // 1️⃣ Load account
    const account = await server.getAccount(userAddress)

    // 2️⃣ Create contract instance
    const contract = new Contract(contractId)

    // 3️⃣ Build base transaction
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.FUTURENET,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build()

    // 4️⃣ Simulate transaction
    const simulation = await server.simulateTransaction(tx)

    if (rpc.Api.isSimulationError(simulation)) {
      throw new Error("Simulation failed")
    }

    // 5️⃣ Assemble transaction with footprint
    const preparedBuilder = rpc.assembleTransaction(tx, simulation)
    const preparedTx = preparedBuilder.build()

    // 6️⃣ Sign with Freighter
    const signed = await freighter.signTransaction(
      preparedTx.toXDR(),
      { networkPassphrase: Networks.FUTURENET }
    )

    if (signed.error) {
      throw new Error(signed.error)
    }

    // 7️⃣ Rebuild signed transaction
    const signedTx = TransactionBuilder.fromXDR(
      signed.signedTxXdr,
      Networks.FUTURENET
    )

    // 8️⃣ Submit transaction
const sendResponse = await server.sendTransaction(signedTx)

if (sendResponse.status === "ERROR") {
  throw new Error("Transaction submission failed")
}

// Poll for ledger inclusion
let txResponse = await server.getTransaction(sendResponse.hash)

while (txResponse.status === "NOT_FOUND") {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  txResponse = await server.getTransaction(sendResponse.hash)
}

// Only throw if explicitly FAILED
if (txResponse.status === "FAILED") {
  console.error(txResponse)
  throw new Error("Transaction failed on-chain")
}

// Otherwise consider it successful
return txResponse

  } catch (err) {
    console.error("Invoke error:", err)
    throw err
  }
}