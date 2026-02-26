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

/**
 * NEW: simulateReadOnly
 * Used for "Getter" functions to fetch state without signing a transaction.
 */
export async function simulateReadOnly(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  sourceAddress: string
) {
  // 1. Load the account to get the current sequence number
  const account = await server.getAccount(sourceAddress)
  const contract = new Contract(contractId)

  // 2. Build the transaction (will not be submitted)
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.FUTURENET,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build()

  // 3. Simulate it on the RPC
  const simulation = await server.simulateTransaction(tx)

  // 4. Check for errors and return the result
  if (rpc.Api.isSimulationError(simulation)) {
    console.error("Simulation Error Details:", simulation.error);
    throw new Error(`Simulation failed: ${simulation.error}`);
  }

  return simulation
}

/**
 * EXISTING: invokeContract
 * Used for "Setter" functions that change on-chain state (Buy, List, Approve).
 */
export async function invokeContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  userAddress: string
) {
  try {
    const account = await server.getAccount(userAddress)
    const contract = new Contract(contractId)

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.FUTURENET,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build()

    const simulation = await server.simulateTransaction(tx)

    if (rpc.Api.isSimulationError(simulation)) {
      // Improved error logging to catch logic traps
      console.error("Invoke Simulation Error:", simulation.error);
      throw new Error("Simulation failed - Check contract logic or allowance");
    }

    const preparedBuilder = rpc.assembleTransaction(tx, simulation)
    const preparedTx = preparedBuilder.build()

    const signed = await freighter.signTransaction(
      preparedTx.toXDR(),
      { networkPassphrase: Networks.FUTURENET }
    )

    if (signed.error) {
      throw new Error(signed.error)
    }

    const signedTx = TransactionBuilder.fromXDR(
      signed.signedTxXdr,
      Networks.FUTURENET
    )

    const sendResponse = await server.sendTransaction(signedTx)

    if (sendResponse.status === "ERROR") {
      throw new Error("Transaction submission failed")
    }

    let txResponse = await server.getTransaction(sendResponse.hash)

    while (txResponse.status === "NOT_FOUND") {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      txResponse = await server.getTransaction(sendResponse.hash)
    }

    if (txResponse.status === "FAILED") {
      console.error(txResponse)
      throw new Error("Transaction failed on-chain")
    }

    return txResponse

  } catch (err) {
    console.error("Invoke error:", err)
    throw err
  }
}