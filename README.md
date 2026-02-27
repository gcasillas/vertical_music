🚀 Vertical Music Marketplace — SaaS Edition

Automated Royalty Settlement Engine via Stellar / Soroban

Vertical Music Marketplace is a production-ready Web3 SaaS template that demonstrates fully automated on-chain royalty settlement using Stellar’s Soroban smart contract platform.

This system is designed as reusable “royalty infrastructure” that can be integrated into digital marketplaces, NFT platforms, music apps, or asset trading systems.

💎 Key Business Features
🔒 Immutable Settlements

All royalty and platform fee distributions occur 100% on-chain via Soroban smart contracts.
No manual reconciliation. No backend accounting database required.

⚡ Automated Split Payments

Each sale triggers an automatic royalty split:

Artist receives configured royalty percentage

Platform treasury receives automated fee

Settlement occurs instantly in the same transaction

📊 Live Revenue Analytics

Real-time event polling directly from the Stellar ledger:

Live settlement activity feed

Historical timestamp alignment

On-chain revenue transparency

📈 Investor-Ready Dashboard

Includes:

Total volume tracking

Royalty accumulation metrics

Platform revenue visualization

Transactions-per-minute indicator

Royalty flow trend graph (Chart.js)

🧠 Scalable Listing Architecture

Chunk-based pagination supports 1,000+ listings without UI performance degradation.

📊 Revenue Model (Configurable)
Component	Default Value
Artist Payout	90% per sale
Platform Fee	10% per sale
Asset Price	5.00 RLT

All parameters are configurable at the contract and UI level.

🛠 Technical Architecture
Frontend

Next.js 14 (App Router)

TypeScript

Tailwind CSS (Dark Mode Optimized)

Chart.js (Real-time graph rendering)

Blockchain Layer

Stellar Futurenet

Soroban Smart Contracts

RLT Token Contract (ERC20-style approval + transfer model)

Wallet Integration

Freighter Wallet

Transaction simulation before execution

Allowance-based token approval flow

Event Infrastructure

RPC proxy via /api/events

Ledger window calculation

XDR decoding (ScVal vector parsing)

i128 BigInt reconstruction

Address extraction via StrKey

Event-to-UI state synchronization

🧱 System Flow

Freighter Wallet
↓
Next.js UI
↓
API Proxy (/api/events)
↓
Stellar RPC
↓
Soroban Smart Contract
↓
Token Transfer + Event Emission
↓
XDR Parsing Layer
↓
Live Analytics Dashboard

All analytics are derived directly from on-chain events.

🚀 Vertical Music Marketplace — SaaS Edition

Automated Royalty Settlement Engine via Stellar / Soroban

Vertical Music Marketplace is a production-ready Web3 SaaS template that demonstrates fully automated on-chain royalty settlement using Stellar’s Soroban smart contract platform.

This system is designed as reusable “royalty infrastructure” that can be integrated into digital marketplaces, NFT platforms, music apps, or asset trading systems.

💎 Key Business Features
🔒 Immutable Settlements

All royalty and platform fee distributions occur 100% on-chain via Soroban smart contracts.
No manual reconciliation. No backend accounting database required.

⚡ Automated Split Payments

Each sale triggers an automatic royalty split:

Artist receives configured royalty percentage

Platform treasury receives automated fee

Settlement occurs instantly in the same transaction

📊 Live Revenue Analytics

Real-time event polling directly from the Stellar ledger:

Live settlement activity feed

Historical timestamp alignment

On-chain revenue transparency

📈 Investor-Ready Dashboard

Includes:

Total volume tracking

Royalty accumulation metrics

Platform revenue visualization

Transactions-per-minute indicator

Royalty flow trend graph (Chart.js)

🧠 Scalable Listing Architecture

Chunk-based pagination supports 1,000+ listings without UI performance degradation.

📊 Revenue Model (Configurable)
Component	Default Value
Artist Payout	90% per sale
Platform Fee	10% per sale
Asset Price	5.00 RLT

All parameters are configurable at the contract and UI level.

🛠 Technical Architecture
Frontend

Next.js 14 (App Router)

TypeScript

Tailwind CSS (Dark Mode Optimized)

Chart.js (Real-time graph rendering)

Blockchain Layer

Stellar Futurenet

Soroban Smart Contracts

RLT Token Contract (ERC20-style approval + transfer model)

Wallet Integration

Freighter Wallet

Transaction simulation before execution

Allowance-based token approval flow

Event Infrastructure

RPC proxy via /api/events

Ledger window calculation

XDR decoding (ScVal vector parsing)

i128 BigInt reconstruction

Address extraction via StrKey

Event-to-UI state synchronization

🧱 System Flow

Freighter Wallet
↓
Next.js UI
↓
API Proxy (/api/events)
↓
Stellar RPC
↓
Soroban Smart Contract
↓
Token Transfer + Event Emission
↓
XDR Parsing Layer
↓
Live Analytics Dashboard

All analytics are derived directly from on-chain events.

🚀 Getting Started
1️⃣ Install Dependencies
npm install
2️⃣ Run Development Server
npm run dev

Visit:

http://localhost:3000
3️⃣ Build for Production
npm run build
🌐 Deployment

This project is optimized for Vercel deployment.

Deploy via Git Push
git push origin main

Vercel will automatically build and deploy.

To force redeploy:

git commit --allow-empty -m "Force redeploy"
git push



🔐 Smart Contract Overview

Core contract functions:

list_asset

purchaseListing

get_listing

Royalty split is enforced inside contract execution logic.

All payments are atomic and settled within the same transaction.

🧩 Environment Configuration (Optional)

You may configure:

NEXT_PUBLIC_CONTRACT_ID=
NEXT_PUBLIC_NETWORK=
ROYALTY_PERCENT=
⚠️ Disclaimer

This project is a technical template demonstrating automated royalty settlement infrastructure.

Before production deployment:

Conduct a smart contract audit

Validate economic parameters

Deploy to Stellar Mainnet

Configure treasury custody policies

📌 License

Specify your license here (MIT / Commercial / Extended License).

🎯 Intended Use Cases

Music royalty platforms

NFT resale royalty engines

Creator monetization platforms

Digital licensing marketplaces

Web3 SaaS royalty modules

🏁 Project Status

Production-ready MVP
Suitable for SaaS template resale
Upgradeable to SDK-based royalty engine