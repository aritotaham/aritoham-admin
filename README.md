# Aritoham Protocol — Admin Console

A Next.js 16 + React 19 + Viem Admin & Governance Console for **Aritoham Protocol**, styled after **aritoham.com** (dark charcoal & gold Web3 theme).

## Quick Start

```bash
cd /home/kali/Projects/aritoham-app
npm run dev
```

Open `http://localhost:3000` in your browser and connect your **MetaMask** wallet.

## Included Contract Modules & Actions

1. **Overview & Roles (`/`)**
   - Real-time on-chain telemetry (Liquidity Pool, Total Supply, Total Burned, Token Price, Registered Users, DAO Pool).
   - Automatic Role Detection Matrix for the connected wallet across all contracts.
   - Cross-Contract Wiring Health Check with 1-click fix buttons.
   - Contract Registry & Custom Contract Address Override Modal.

2. **Protocol Admin & 2-of-2 Multisig (`/protocol-admin`) — `ARITOHAMProtocol`**
   - `setDataStore(address _dataStore)` (`onlyAdmin`)
   - `initStoreRoot()` (`onlyAdmin`)
   - `renounceOwnership()` (`onlyAdmin`)
   - `setChainKeeper(address _newChainKeeper, bytes[] sigs)` — Interactive 2-of-2 EIP-191 Multisig Studio with live domain-separated hash calculation, MetaMask `personal_sign` integration, signature signer verification, and on-chain execution.

3. **Chain Keeper Console (`/chain-keeper`) — `ARITOHAMProtocol` (`onlyChainKeeper`)**
   - `updateRewardIncome(address user, uint256 rank_id)` — Promote user rank (`0..8`, Spark → Emperor) and credit one-time rank reward.
   - `updateRankIncentive(address user, uint256 amount)` — Credit recurring rank incentive (18 decimals USD).
   - `setDaoEligible(address[] wallets, uint256[] shares)` — Interactive row builder & bulk CSV/line mode for DAO cycle eligibility.
   - `distributeDao(uint256 count)` — Paginated DAO pool distribution + live cycle eligible wallet inspector.
   - `burnFrom(address from, uint256 amount)` — Burn ARITOHAM tokens straight from any wallet (works on blacklisted wallets, updates supply & price).
   - `resetRankBusinessDao(address user)` — Reset a user's rank, business counters, 7-day matching buckets, and DAO status.
   - `setBlacklist(address user, bool status)` & `setBlacklistBatch(address[] users_, bool status)` — Single and batch wallet blacklisting.

4. **Blacklist & Token Admin (`/token-blacklist`) — `ARITOHAM` (`Aritoham.sol`)**
   - Instant Wallet Blacklist & Balance Checker.
   - Protocol Blacklist (`setBlacklist`, `setBlacklistBatch` — `onlyChainKeeper`).
   - Direct Token Blacklist Manager (`setBlacklisted`, `burnFrom` — `onlyBlacklistManager`).
   - Token Owner Admin (`setMinter`, `setBlacklistManager`, `transferOwnership`, `renounceOwnership` — `onlyOwner`).
   - Token Minter (`mint(to, amount)`, `burn(from, amount)` — `onlyMinter`).

5. **DataStore & Core Records (`/datastore`) — `AritohamDataStore`**
   - DataStore Owner Config (`setCore`, `transferOwnership`, `setMaxTeamDepth`, `setActiveDirectMin`, `setDailyLimit`, `setDaoBps`, `setDailyRewardPpm` — `onlyOwner`).
   - Rank Configuration Table & Editor (`setRank` for Ranks `1..9`, Spark → Emperor — `onlyOwner`).
   - Direct Core Record Writer (`onlyCore`) — Full UI for all 14 `onlyCore` functions (`recordRegistration`, `recordStake`, `recordPurchase`, `recordSell`, `recordDirectIncome`, `recordRoiClaim`, `recordGenerationIncome`, `recordRewardIncome`, `recordRankIncentive`, `recordDaoEligible`, `recordDaoDistributed`, `recordDaoReward`, `recordWithdraw`, `resetRankBusinessDao`).

6. **User Inspector & Quick Actions (`/users`)**
   - Search any user by `0x` Wallet Address or User ID (`1000001` / `ARI1000001`).
   - Dual-contract state breakdown (`ARITOHAMProtocol` + `AritohamDataStore`) and 1-click admin/keeper actions.
