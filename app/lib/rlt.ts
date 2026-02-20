import { Address, xdr, nativeToScVal } from "@stellar/stellar-sdk"
import { invokeContract } from "./soroban"


// --- 1. Define all your IDs at the top ---
const RLT_TOKEN_ID = "CDWXMXFIAC5VLA744OGHOQDXDLXLQE2WQCUWUWYJQI2S4O46NEMJXWIC"
const ROYALTY_CORE_ID = "CB3QTLZHBKZEXJ2JIVHGBJ5VVONNMZBYTB7EU44D77M6A2IWMVZC2SML"
const ROUTER_ID = "CABKGM4RZOOMQVQBVVCDWN6QWZ66OF4BFL6SNW7IN5MZQUU4TXGRQGBW"


// --- 2. The Approval Function (The "Permission") ---
export async function approveRLT(
 userAddress: string,
 amount: number
) {
 const args = [
   Address.fromString(userAddress).toScVal(),
   Address.fromString(ROYALTY_CORE_ID).toScVal(),
   nativeToScVal(amount, { type: "i128" }),
   xdr.ScVal.scvU32(3_000_000),
 ]


 return invokeContract(
   RLT_TOKEN_ID,
   "approve",
   args,
   userAddress
 )
}


// --- 3. The Purchase Function (The "Action") ---
export async function purchaseListing(
 userAddress: string,
 listingId: number
) {
 const args = [
   xdr.ScVal.scvU32(listingId),                 // Which item?
   Address.fromString(userAddress).toScVal(),   // Who is buying?
   Address.fromString(ROYALTY_CORE_ID).toScVal(),// Where is the royalty logic?
 ]


 return invokeContract(
   ROUTER_ID,      // Calling the Router contract
   "purchase",     // The method name
   args,
   userAddress
 )
}
