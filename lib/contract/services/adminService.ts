import {
  encodePacked,
  formatUnits,
  isAddress,
  keccak256,
  parseUnits,
  recoverMessageAddress,
  type Address,
  type Hex,
} from "viem";
import { config } from "../config/env";
import { getWalletClient } from "../core/client";
import { readProtocol, readStore, readTeamDao, readToken } from "../core/contracts";

export const RANK_NAMES = [
  "No Rank",
  "Spark",
  "Rise",
  "Prime",
  "Elite",
  "Legend",
  "Titan",
  "Crown",
  "Royal",
  "Emperor",
];

export const PROTOCOL_RANK_REWARDS: {
  rankId: number;
  storeRank: number;
  name: string;
  selfStakedUsd: number;
  matchingUsd: number;
  directsRequired: number;
  rewardUsd: number;
  incentiveBps: number;
}[] = [
  { rankId: 0, storeRank: 1, name: "Spark",   selfStakedUsd: 100,  matchingUsd: 5_000,     directsRequired: 3,  rewardUsd: 0,     incentiveBps: 800 },
  { rankId: 1, storeRank: 2, name: "Rise",    selfStakedUsd: 200,  matchingUsd: 10_000,    directsRequired: 5,  rewardUsd: 0,     incentiveBps: 1000 },
  { rankId: 2, storeRank: 3, name: "Prime",   selfStakedUsd: 300,  matchingUsd: 25_000,    directsRequired: 7,  rewardUsd: 500,   incentiveBps: 1200 },
  { rankId: 3, storeRank: 4, name: "Elite",   selfStakedUsd: 400,  matchingUsd: 50_000,    directsRequired: 9,  rewardUsd: 750,   incentiveBps: 1500 },
  { rankId: 4, storeRank: 5, name: "Legend",  selfStakedUsd: 500,  matchingUsd: 100_000,   directsRequired: 11, rewardUsd: 1750,  incentiveBps: 1800 },
  { rankId: 5, storeRank: 6, name: "Titan",   selfStakedUsd: 600,  matchingUsd: 250_000,   directsRequired: 12, rewardUsd: 5750,  incentiveBps: 2000 },
  { rankId: 6, storeRank: 7, name: "Crown",   selfStakedUsd: 700,  matchingUsd: 500_000,   directsRequired: 13, rewardUsd: 11250, incentiveBps: 2500 },
  { rankId: 7, storeRank: 8, name: "Royal",   selfStakedUsd: 800,  matchingUsd: 1_000_000, directsRequired: 14, rewardUsd: 25000, incentiveBps: 3000 },
  { rankId: 8, storeRank: 9, name: "Emperor", selfStakedUsd: 1000, matchingUsd: 2_500_000, directsRequired: 15, rewardUsd: 80000, incentiveBps: 3500 },
];

export type RoleMatrix = {
  isProtocolAdmin: boolean;
  isChainKeeper: boolean;
  isAdminSigner: boolean;
  isTokenOwner: boolean;
};

export type AdminOverviewData = {
  protocol: {
    address: Address;
    admin: Address;
    chainKeeper: Address;
    dataStore: Address;
    rootUser: Address;
    storeRootInit: boolean;
    usdt: Address;
    aritoham: Address;
    tokenOwner: Address;
    paused: boolean;
    adminSigners: Address[];
    minAdminSignatures: number;
    adminSigNonce: bigint;
    totalUsers: bigint;
    liquidityPool: bigint;
    totalSupply: bigint;
    totalBurnedTokens: bigint;
    currentPrice: bigint;
    contractUsdtBalance: bigint;
    contractTokenBalance: bigint;
    rankIncentiveNonce: bigint;
    daoPoolTotal: bigint;
    daoCycle: bigint;
    daoCurrentShares: bigint;
    daoLastCycleStart: bigint;
    daoPayCycle: bigint;
    daoPayCursor: bigint;
    daoPayPool: bigint;
    daoPayPerShare: bigint;
    daoEligibleCount: bigint;
  };
  store: {
    address: Address;
    nextUserId: number;
    totalUsers: bigint;
    totalDeposits: bigint;
    currentCycle: bigint;
    lastDistributedCycle: bigint;
    lifetimeHolders: bigint;
    dailyRewardPpm: bigint;
  };
  roles: RoleMatrix;
};

export type MonitoredUserRow = {
  address: Address;
  userId: number;
  userCode: string;
  referrer: Address;
  isRegistered: boolean;
  isActive: boolean;
  isBlacklisted: boolean;
  daoLifetime: boolean;
  registeredAt: number;
  activatedAt: number;
  // Rank
  protocolRankId: number; // 0..8 on protocol
  storeRank: number;      // 0..9 on store (0 = No Rank, 1..9 = Spark..Emperor)
  rankName: string;
  // Stakes & Caps
  totalInvestment: bigint;
  totalStaked: bigint;
  remainingCap: bigint;
  maxPayout: number;
  stakeCount: number;
  openLevels: number;
  // Balances & Withdrawals
  balance: bigint;        // Protocol internal withdrawable USD balance (18 dec)
  tokenBalance: bigint;   // Wallet ARITOHAM ERC-20 balance (18 dec)
  usdtBalance: bigint;    // Wallet USDT balance (18 dec)
  withdrawnUsd: bigint;   // Total USD withdrawn (from DataStore Flow)
  withdrawnAritoham: bigint;
  soldUsdt: bigint;
  // Income
  totalIncome: bigint;
  directIncome: bigint;
  generationIncome: bigint;
  roiAccrued: bigint;
  daoIncome: bigint;
  rewardIncome: bigint;
  rankIncentive: bigint;
  // Team & Business
  directCount: number;
  activeDirects: number;
  qualifiedDirects: number;
  teamCount: number;
  contributingCount: number;
  directBusiness: bigint;
  teamBusiness: bigint;
  matchingBusiness: bigint;
  weeklyMatching: bigint;
  dailyMatching: bigint;
  windowDirect: bigint;
  windowMatching: bigint;
  currentCycleDaoShares: bigint;
  // Computed Qualification & Batch Auto-Fill Telemetry
  qualifiedStoreRank: number;
  qualifiedProtocolRankId: number;
  qualifiedRankName: string;
  qualifiedRankRewardUsd: number;
  isRankUpgradeReady: boolean;
  rankIncentiveBps: number;
  dailyRewardPpm: number;
  currentRankMatchingUsd: bigint;
  suggestedIncentiveRankMatchingPpmUsd: bigint;
  suggestedIncentiveUserMatchingPpmUsd: bigint;
  suggestedIncentiveDailyPpmUsd: bigint;
  suggestedIncentiveRankMatchingUsd: bigint;
  suggestedIncentiveDailyUsd: bigint;
  suggestedIncentiveWeeklyUsd: bigint;
  daoQualifiedByWindow: boolean;
  isDaoEligibleCandidate: boolean;
  suggestedDaoShares: bigint;
};

export type GlobalStakeRow = {
  userAddress: Address;
  userId: number;
  userCode: string;
  userRankName: string;
  stakeIndex: number;
  totalInvestment: bigint;
  ecosystemFee: bigint;
  tokenPrice: bigint;
  mintedTokens: bigint;
  tokenUsdValue: bigint;
  dailyRoi: bigint;
  totalRoi: bigint;
  totalDays: number;
  claimedRoi: bigint;
  startTime: number;
  lastClaimTime: number;
  completed: boolean;
};

export type TeamMemberRow = {
  wallet: Address;
  id: number;
  userCode: string;
  level: number;
  rank: number;
  rankName: string;
  joinedAt: number;
  selfStaked: bigint;
  directBusiness: bigint;
  teamBusiness: bigint;
  directCount: number;
  teamCount: number;
  daoPartner: boolean;
};

const sameAddr = (a?: string | null, b?: string | null) =>
  Boolean(a && b && a.toLowerCase() === b.toLowerCase());

async function safe<T>(fn: () => Promise<T>, fallbackVal: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallbackVal;
  }
}

const ZERO_ADDR = "0x0000000000000000000000000000000000000000" as Address;

export async function fetchAdminOverview(connectedWallet?: string | null): Promise<AdminOverviewData> {
  const addrs = config.addresses;

  const [
    pAdmin,
    pKeeper,
    pStore,
    pRoot,
    pStoreRootInit,
    pUsdt,
    pAritoham,
    tOwner,
    pPaused,
    signer0,
    signer1,
    minSigs,
    sigNonce,
    pTotalUsers,
    sysInfo,
    daoInfo,
    daoPayPool,
    daoPayPerShare,
    rankNonce,
    pTokenBal,
    sNextUserId,
    sTotalUsers,
    sTotalDeposits,
    sCurrentCycle,
    sLastDistCycle,
    sLifetimeHolders,
    sDailyRewardPpm,
  ] = await Promise.all([
    safe(() => readProtocol("admin"), ZERO_ADDR),
    safe(() => readProtocol("chainKeeper"), ZERO_ADDR),
    safe(() => readProtocol("dataStore"), ZERO_ADDR),
    safe(() => readProtocol("rootUser"), ZERO_ADDR),
    safe(() => readProtocol("storeRootInit"), false),
    safe(() => readProtocol("usdt"), addrs.usdt),
    safe(() => readProtocol("aritoham"), addrs.aritoham),
    safe(() => readToken("owner"), ZERO_ADDR),
    safe(() => readProtocol("paused"), false),
    safe(() => readProtocol("adminSigners", [0n]), ZERO_ADDR),
    safe(() => readProtocol("adminSigners", [1n]), ZERO_ADDR),
    safe(() => readProtocol("minAdminSignatures"), 2n),
    safe(() => readProtocol("adminSigNonce"), 0n),
    safe(() => readProtocol("totalUsers"), 0n),
    safe(() => readProtocol("getSystemInfo"), [0n, 0n, 0n, 0n, 0n] as const),
    safe(() => readProtocol("getDaoInfo"), [0n, 1n, 0n, 0n, 0n, 0n] as const),
    safe(() => readProtocol("daoPayPool"), 0n),
    safe(() => readProtocol("daoPayPerShare"), 0n),
    safe(() => readProtocol("rankIncentiveNonce"), 0n),
    safe(() => readToken("balanceOf", [addrs.protocol]), 0n),
    safe(() => readStore("nextUserId"), 1000001),
    safe(() => readStore("totalUsers"), 0n),
    safe(() => readStore("totalDeposits"), 0n),
    safe(() => readStore("currentCycle"), 1n),
    safe(() => readStore("lastDistributedCycle"), 0n),
    safe(() => readStore("lifetimeHolders"), 0n),
    safe(() => readStore("dailyRewardPpm"), 12530n),
  ]);

  const daoCycle = daoInfo[1] ?? 1n;
  const daoEligibleCount = await safe(() => readProtocol("daoEligibleCount", [daoCycle]), 0n);

  const signers = [signer0, signer1].filter((s) => s && s !== ZERO_ADDR);
  const isSigner = connectedWallet
    ? signers.some((s) => sameAddr(s, connectedWallet))
    : false;

  return {
    protocol: {
      address: addrs.protocol,
      admin: pAdmin,
      chainKeeper: pKeeper,
      dataStore: pStore,
      rootUser: pRoot,
      storeRootInit: Boolean(pStoreRootInit),
      usdt: pUsdt,
      aritoham: pAritoham,
      tokenOwner: tOwner,
      paused: Boolean(pPaused),
      adminSigners: signers,
      minAdminSignatures: Number(minSigs),
      adminSigNonce: BigInt(sigNonce),
      totalUsers: BigInt(pTotalUsers),
      liquidityPool: BigInt(sysInfo[0] ?? 0n),
      totalSupply: BigInt(sysInfo[1] ?? 0n),
      totalBurnedTokens: BigInt(sysInfo[2] ?? 0n),
      currentPrice: BigInt(sysInfo[3] ?? 0n),
      contractUsdtBalance: BigInt(sysInfo[4] ?? 0n),
      contractTokenBalance: BigInt(pTokenBal),
      rankIncentiveNonce: BigInt(rankNonce),
      daoPoolTotal: BigInt(daoInfo[0] ?? 0n),
      daoCycle: BigInt(daoCycle),
      daoCurrentShares: BigInt(daoInfo[2] ?? 0n),
      daoLastCycleStart: BigInt(daoInfo[3] ?? 0n),
      daoPayCycle: BigInt(daoInfo[4] ?? 0n),
      daoPayCursor: BigInt(daoInfo[5] ?? 0n),
      daoPayPool: BigInt(daoPayPool),
      daoPayPerShare: BigInt(daoPayPerShare),
      daoEligibleCount: BigInt(daoEligibleCount),
    },
    store: {
      address: addrs.dataStore,
      nextUserId: Number(sNextUserId),
      totalUsers: BigInt(sTotalUsers),
      totalDeposits: BigInt(sTotalDeposits),
      currentCycle: BigInt(sCurrentCycle),
      lastDistributedCycle: BigInt(sLastDistCycle),
      lifetimeHolders: BigInt(sLifetimeHolders),
      dailyRewardPpm: BigInt(sDailyRewardPpm ?? 12530n),
    },
    roles: {
      isProtocolAdmin: sameAddr(connectedWallet, pAdmin),
      isChainKeeper: sameAddr(connectedWallet, pKeeper),
      isAdminSigner: isSigner,
      isTokenOwner: sameAddr(connectedWallet, tOwner),
    },
  };
}

/* ─────────────────────────── Fetch Monitored User Row ─────────────────────────── */

export async function fetchMonitoredUser(
  address: Address,
  currentDaoCycle = 1n,
  dailyRewardPpm = 12530
): Promise<MonitoredUserRow> {
  const addrs = config.addresses;
  const [fullInfo, storeUser, storeFlow, isBl, tokenBal, usdtBal, weeklyMatch, dailyMatch, daoShares] = await Promise.all([
    safe(() => readProtocol("getUserFullInfo", [address]), null),
    safe(() => readStore("getUser", [address]), null),
    safe(() => readStore("getFlow", [address]), null),
    safe(() => readProtocol("isBlacklisted", [address]), false),
    safe(() => readToken("balanceOf", [address]), 0n),
    safe(() => readToken("balanceOf", [address], addrs.usdt), 0n),
    safe(() => readStore("weeklyMatching", [address]), 0n),
    safe(() => readStore("dailyMatching", [address]), 0n),
    safe(() => readProtocol("daoShares", [currentDaoCycle, address]), 0n),
  ]);

  const pu = fullInfo ? fullInfo[0] : null;
  const openLevels = fullInfo ? Number(fullInfo[1] ?? 0n) : 0;
  const stakeCount = fullInfo ? Number(fullInfo[2] ?? 0n) : 0;

  const storeRank = Number(storeUser?.rank ?? 0);
  const protocolRankId = Number(pu?.currentRank ?? 0n);
  // If user was promoted on protocol, storeRank is 1..9; if storeRank is 0 but protocolRankId > 0, map it
  const effectiveStoreRank = storeRank > 0 ? storeRank : protocolRankId > 0 ? protocolRankId + 1 : 0;
  const userId = Number(storeUser?.id ?? 0);

  const totalStaked = BigInt(pu?.totalStaked ?? storeUser?.selfStaked ?? 0n);
  const matchingBusiness = BigInt(storeUser?.matchingBusiness ?? 0n);
  const teamBusiness = BigInt(storeUser?.teamBusiness ?? 0n);
  const effectiveMatching = matchingBusiness > 0n ? matchingBusiness : teamBusiness;
  const directCount = Number(pu?.totalReferralCount ?? storeUser?.directCount ?? 0);
  const activeDirects = Number(pu?.activeReferralCount ?? storeUser?.activeDirects ?? 0);
  const effectiveDirectsForRank = Math.max(activeDirects, directCount);

  // Determine highest rank where user meets on-chain conditions (selfStaked, matchingBusiness, directs)
  let qualifiedStoreRank = 0;
  let qualifiedProtocolRankId = 0;
  let qualifiedRankRewardUsd = 0;
  for (const tier of PROTOCOL_RANK_REWARDS) {
    const reqSelf = parseUnits(String(tier.selfStakedUsd), 18);
    const reqMatch = parseUnits(String(tier.matchingUsd), 18);
    if (
      totalStaked >= reqSelf &&
      effectiveMatching >= reqMatch &&
      effectiveDirectsForRank >= tier.directsRequired
    ) {
      qualifiedStoreRank = tier.storeRank;
      qualifiedProtocolRankId = tier.rankId;
      qualifiedRankRewardUsd = tier.rewardUsd;
    }
  }

  // Use stored rank if > 0; otherwise fall back to qualifiedStoreRank so incentives can also be previewed/auto-filled
  const activeRankForIncentive = effectiveStoreRank > 0 ? effectiveStoreRank : qualifiedStoreRank;
  const currentTierCfg = PROTOCOL_RANK_REWARDS.find((t) => t.storeRank === activeRankForIncentive);
  const rankIncentiveBps = currentTierCfg?.incentiveBps ?? 0;
  const currentRankMatchingUsd = currentTierCfg
    ? parseUnits(String(currentTierCfg.matchingUsd), 18)
    : 0n;
  const ppmBig = BigInt(dailyRewardPpm > 0 ? dailyRewardPpm : 12530);
  const bpsBig = BigInt(rankIncentiveBps);
  const weeklyMatchingBig = BigInt(weeklyMatch);
  const dailyMatchingBig = BigInt(dailyMatch);

  // Formula 1: Current Rank Matching Business × Rank Incentive % × dailyRewardPpm (1.2530%)
  const suggestedIncentiveRankMatchingPpmUsd =
    bpsBig > 0n ? (currentRankMatchingUsd * bpsBig * ppmBig) / (10000n * 1000000n) : 0n;

  // Formula 2: User's Actual Matching Business × Rank Incentive % × dailyRewardPpm (1.2530%)
  const suggestedIncentiveUserMatchingPpmUsd =
    bpsBig > 0n ? (effectiveMatching * bpsBig * ppmBig) / (10000n * 1000000n) : 0n;

  // Formula 3: Daily Matching × Rank Incentive % × dailyRewardPpm (1.2530%)
  const suggestedIncentiveDailyPpmUsd =
    bpsBig > 0n ? (dailyMatchingBig * bpsBig * ppmBig) / (10000n * 1000000n) : 0n;

  // Formula 4: Current Rank Matching Business × Rank Incentive %
  const suggestedIncentiveRankMatchingUsd =
    bpsBig > 0n ? (currentRankMatchingUsd * bpsBig) / 10000n : 0n;

  // Formula 5 & 6: Daily / Weekly Matching × Rank Incentive %
  const suggestedIncentiveDailyUsd =
    bpsBig > 0n ? (dailyMatchingBig * bpsBig) / 10000n : 0n;
  const suggestedIncentiveWeeklyUsd =
    bpsBig > 0n ? (weeklyMatchingBig * bpsBig) / 10000n : 0n;

  const windowDirect = BigInt(storeUser?.windowDirect ?? 0n);
  const windowMatching = BigInt(storeUser?.windowMatching ?? 0n);
  const daoLifetime = Boolean(storeUser?.daoLifetime);
  const daoQualifiedByWindow =
    windowDirect >= parseUnits("3000", 18) || windowMatching >= parseUnits("10000", 18);
  const isDaoEligibleCandidate = daoLifetime || daoQualifiedByWindow;
  const shareStep = parseUnits("2500", 18);
  const calcShares = weeklyMatchingBig / shareStep;
  const suggestedDaoShares = calcShares > 0n ? calcShares : 1n;

  return {
    address,
    userId,
    userCode: userId > 0 ? `${config.userPrefix}${userId}` : "ROOT/UNINDEXED",
    referrer: (pu?.referrer || storeUser?.referrer || ZERO_ADDR) as Address,
    isRegistered: Boolean(pu?.isRegistered || userId > 0),
    isActive: Boolean(pu?.isActive),
    isBlacklisted: Boolean(isBl),
    daoLifetime,
    registeredAt: Number(storeUser?.registeredAt ?? 0),
    activatedAt: Number(storeUser?.activatedAt ?? 0),
    protocolRankId,
    storeRank: effectiveStoreRank,
    rankName: RANK_NAMES[effectiveStoreRank] || "No Rank",
    totalInvestment: BigInt(pu?.totalInvestment ?? 0n),
    totalStaked,
    remainingCap: BigInt(pu?.remainingCap ?? 0n),
    maxPayout: Number(pu?.maxPayout ?? 2n),
    stakeCount: stakeCount || Number(storeUser?.stakeCount ?? 0),
    openLevels,
    balance: BigInt(pu?.balance ?? 0n),
    tokenBalance: BigInt(tokenBal),
    usdtBalance: BigInt(usdtBal),
    withdrawnUsd: BigInt(storeFlow?.withdrawnUsd ?? 0n),
    withdrawnAritoham: BigInt(storeFlow?.withdrawnAritoham ?? 0n),
    soldUsdt: BigInt(storeFlow?.soldUsdt ?? 0n),
    totalIncome: BigInt(pu?.totalIncome ?? 0n),
    directIncome: BigInt(pu?.directIncome ?? 0n),
    generationIncome: BigInt(pu?.generationIncome ?? 0n),
    roiAccrued: BigInt(pu?.roiAccrued ?? 0n),
    daoIncome: BigInt(pu?.daoIncome ?? 0n),
    rewardIncome: BigInt(pu?.rewardIncome ?? 0n),
    rankIncentive: BigInt(pu?.rankIncentive ?? 0n),
    directCount,
    activeDirects,
    qualifiedDirects: Number(pu?.qualifiedReferralCount ?? 0),
    teamCount: Number(storeUser?.teamCount ?? 0),
    contributingCount: Number(storeUser?.contributingCount ?? 0),
    directBusiness: BigInt(storeUser?.directBusiness ?? 0n),
    teamBusiness,
    matchingBusiness,
    weeklyMatching: weeklyMatchingBig,
    dailyMatching: dailyMatchingBig,
    windowDirect,
    windowMatching,
    currentCycleDaoShares: BigInt(daoShares),
    qualifiedStoreRank,
    qualifiedProtocolRankId,
    qualifiedRankName: RANK_NAMES[qualifiedStoreRank] || "No Rank",
    qualifiedRankRewardUsd,
    isRankUpgradeReady: qualifiedStoreRank > effectiveStoreRank,
    rankIncentiveBps,
    dailyRewardPpm,
    currentRankMatchingUsd,
    suggestedIncentiveRankMatchingPpmUsd,
    suggestedIncentiveUserMatchingPpmUsd,
    suggestedIncentiveDailyPpmUsd,
    suggestedIncentiveRankMatchingUsd,
    suggestedIncentiveDailyUsd,
    suggestedIncentiveWeeklyUsd,
    daoQualifiedByWindow,
    isDaoEligibleCandidate,
    suggestedDaoShares,
  };
}

/**
 * Fetches all individual stakes across all monitored users (for Page 2: All Users Stakes)
 */
export async function fetchAllUserStakes(users: MonitoredUserRow[]): Promise<GlobalStakeRow[]> {
  const rows: GlobalStakeRow[] = [];
  const stakers = users.filter((u) => u.stakeCount > 0);
  await Promise.all(
    stakers.map(async (u) => {
      const maxS = Math.min(u.stakeCount, 30);
      const rawList = await Promise.all(
        Array.from({ length: maxS }, (_, i) =>
          safe(() => readProtocol("userStakes", [u.address, BigInt(i)]), null)
        )
      );
      rawList.forEach((st, idx) => {
        if (st) {
          rows.push({
            userAddress: u.address,
            userId: u.userId,
            userCode: u.userCode,
            userRankName: u.rankName,
            stakeIndex: idx,
            totalInvestment: BigInt(st[0] ?? 0n),
            ecosystemFee: BigInt(st[1] ?? 0n),
            tokenPrice: BigInt(st[2] ?? 0n),
            mintedTokens: BigInt(st[3] ?? 0n),
            tokenUsdValue: BigInt(st[4] ?? 0n),
            dailyRoi: BigInt(st[5] ?? 0n),
            totalRoi: BigInt(st[6] ?? 0n),
            totalDays: Number(st[7] ?? 0n),
            claimedRoi: BigInt(st[8] ?? 0n),
            startTime: Number(st[9] ?? 0n),
            lastClaimTime: Number(st[10] ?? 0n),
            completed: Boolean(st[11]),
          });
        }
      });
    })
  );
  return rows.sort((a, b) => b.startTime - a.startTime);
}

/**
 * Fetches downline team members for a root user (for Page 5: Team View)
 */
export async function fetchDownlineTeam(
  rootUser: Address,
  filter: { level: number; onlyInvested: boolean; daoOnly: boolean; rank: number } = {
    level: 0,
    onlyInvested: false,
    daoOnly: false,
    rank: 255,
  }
): Promise<{ items: TeamMemberRow[]; total: number }> {
  const res = await safe(
    () =>
      readTeamDao("getTeam", [
        rootUser,
        {
          level: BigInt(filter.level),
          onlyInvested: filter.onlyInvested,
          daoOnly: filter.daoOnly,
          rank: BigInt(filter.rank),
        },
        0n,
        100n,
      ]),
    null
  );
  if (!res) return { items: [], total: 0 };
  const rawPage = res[0] || [];
  const total = Number(res[1] ?? 0n);
  const items: TeamMemberRow[] = rawPage.map((m: any) => {
    const id = Number(m.id ?? 0);
    const r = Number(m.rank ?? 0);
    return {
      wallet: m.wallet as Address,
      id,
      userCode: id > 0 ? `${config.userPrefix}${id}` : "UNINDEXED",
      level: Number(m.level ?? 1),
      rank: r,
      rankName: RANK_NAMES[r] || "No Rank",
      joinedAt: Number(m.joinedAt ?? 0),
      selfStaked: BigInt(m.selfStaked ?? 0n),
      directBusiness: BigInt(m.directBusiness ?? 0n),
      teamBusiness: BigInt(m.teamBusiness ?? 0n),
      directCount: Number(m.directCount ?? 0),
      teamCount: Number(m.teamCount ?? 0),
      daoPartner: Boolean(m.daoPartner),
    };
  });
  return { items, total };
}

/**
 * Discovers all registered users on-chain via:
 * 1) DataStore IDs 1000001 .. nextUserId - 1
 * 2) Protocol rootUser (in case initStoreRoot was not called yet)
 * 3) Any extra custom addresses watched by the admin
 */
export async function fetchAllMonitoredUsers(extraAddresses: string[] = []): Promise<MonitoredUserRow[]> {
  const [nextIdRaw, rootUser, daoCycleRaw, dailyRewardPpmRaw] = await Promise.all([
    safe(() => readStore("nextUserId"), 1000001),
    safe(() => readProtocol("rootUser"), ZERO_ADDR),
    safe(() => readProtocol("daoCycle"), 1n),
    safe(() => readStore("dailyRewardPpm"), 12530n),
  ]);

  const dailyRewardPpm = Number(dailyRewardPpmRaw ?? 12530n);
  const nextId = Number(nextIdRaw);
  const startId = 1000001;
  const count = Math.max(0, Math.min(nextId - startId, 500)); // safety cap 500 users per scan

  const idPromises: Promise<Address>[] = [];
  for (let i = 0; i < count; i++) {
    const id = startId + i;
    idPromises.push(safe(() => readStore("idToUser", [id]), ZERO_ADDR));
  }

  const resolvedFromIds = await Promise.all(idPromises);

  const uniqueMap = new Map<string, Address>();
  if (rootUser && rootUser !== ZERO_ADDR) {
    uniqueMap.set(rootUser.toLowerCase(), rootUser);
  }
  for (const addr of resolvedFromIds) {
    if (addr && addr !== ZERO_ADDR) {
      uniqueMap.set(addr.toLowerCase(), addr);
    }
  }
  for (const extra of extraAddresses) {
    if (isAddress(extra) && extra !== ZERO_ADDR) {
      uniqueMap.set(extra.toLowerCase(), extra as Address);
    }
  }

  const allAddresses = Array.from(uniqueMap.values());
  const rows = await Promise.all(
    allAddresses.map((addr) =>
      fetchMonitoredUser(addr, BigInt(daoCycleRaw), dailyRewardPpm)
    )
  );

  // Sort newest userId first (rootUser with id=0 at top if no id)
  return rows.sort((a, b) => {
    if (a.userId !== b.userId) return b.userId - a.userId;
    return Number(b.totalStaked - a.totalStaked);
  });
}

/* ─────────────────────────── Multisig Helpers (setChainKeeper) ─────────────────────────── */

export function computeSetChainKeeperHash(
  protocolAddress: Address,
  chainId: bigint,
  nonce: bigint,
  newChainKeeper: Address
): Hex {
  return keccak256(
    encodePacked(
      ["address", "uint256", "uint256", "string", "address"],
      [protocolAddress, chainId, nonce, "setChainKeeper", newChainKeeper]
    )
  );
}

export async function signSetChainKeeperHash(hash: Hex): Promise<{ signature: Hex; signer: Address }> {
  const wallet = getWalletClient();
  const [account] = await wallet.requestAddresses();
  if (!account) throw new Error("Connect your wallet first.");

  const signature = await wallet.signMessage({
    account,
    message: { raw: hash },
  });

  const recovered = await recoverMessageAddress({
    message: { raw: hash },
    signature,
  });

  return { signature, signer: recovered };
}

export async function verifySignatureSigner(hash: Hex, sig: string): Promise<Address | null> {
  try {
    if (!sig || !sig.startsWith("0x") || sig.length < 130) return null;
    return await recoverMessageAddress({
      message: { raw: hash },
      signature: sig as Hex,
    });
  } catch {
    return null;
  }
}

/* ─────────────────────────── User Inspector Helper ─────────────────────────── */

export async function resolveUserQuery(query: string): Promise<Address> {
  const q = query.trim();
  if (!q) throw new Error("Enter a wallet address or User ID (e.g. 1000001 or ARI1000001).");
  if (isAddress(q)) return q as Address;

  const cleaned = q.replace(/^(ARI|HWN|#)/i, "").trim();
  const idNum = Number(cleaned);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    throw new Error("Invalid address or User ID format.");
  }
  const resolved = (await readStore("idToUser", [idNum])) as Address;
  if (!resolved || resolved === ZERO_ADDR) {
    throw new Error(`No user found for ID ${idNum}.`);
  }
  return resolved;
}

export async function inspectUserFull(query: string) {
  const address = await resolveUserQuery(query);
  const addrs = config.addresses;

  const [
    fullInfo,
    blacklistedOnProtocol,
    tokenBalance,
    usdtBalance,
    storeUser,
    storeIncome,
    storeFlow,
    storeCounts,
    weeklyMatching,
    dailyMatching,
    daoStatus,
  ] = await Promise.all([
    safe(() => readProtocol("getUserFullInfo", [address]), null),
    safe(() => readProtocol("isBlacklisted", [address]), false),
    safe(() => readToken("balanceOf", [address]), 0n),
    safe(() => readToken("balanceOf", [address], addrs.usdt), 0n),
    safe(() => readStore("getUser", [address]), null),
    safe(() => readStore("getIncome", [address]), null),
    safe(() => readStore("getFlow", [address]), null),
    safe(() => readStore("counts", [address]), null),
    safe(() => readStore("weeklyMatching", [address]), 0n),
    safe(() => readStore("dailyMatching", [address]), 0n),
    safe(() => readTeamDao("getMyDaoStatus", [address]), null),
  ]);

  const pUser = fullInfo ? fullInfo[0] : null;
  const openLevels = fullInfo ? Number(fullInfo[1] ?? 0n) : 0;
  const stakeCount = fullInfo ? Number(fullInfo[2] ?? 0n) : 0;

  // Fetch individual stakes from ARITOHAMProtocol.userStakes(address, i)
  const stakesList: any[] = [];
  const maxStakes = Math.min(stakeCount, 30);
  if (maxStakes > 0) {
    const rawStakes = await Promise.all(
      Array.from({ length: maxStakes }, (_, i) =>
        safe(() => readProtocol("userStakes", [address, BigInt(i)]), null)
      )
    );
    rawStakes.forEach((st, idx) => {
      if (st) {
        stakesList.push({
          index: idx,
          totalInvestment: BigInt(st[0] ?? 0n),
          ecosystemFee: BigInt(st[1] ?? 0n),
          tokenPrice: BigInt(st[2] ?? 0n),
          mintedTokens: BigInt(st[3] ?? 0n),
          tokenUsdValue: BigInt(st[4] ?? 0n),
          dailyRoi: BigInt(st[5] ?? 0n),
          totalRoi: BigInt(st[6] ?? 0n),
          totalDays: Number(st[7] ?? 0n),
          claimedRoi: BigInt(st[8] ?? 0n),
          startTime: Number(st[9] ?? 0n),
          lastClaimTime: Number(st[10] ?? 0n),
          completed: Boolean(st[11]),
        });
      }
    });
  }

  return {
    address,
    isBlacklisted: Boolean(blacklistedOnProtocol),
    tokenBalance: BigInt(tokenBalance),
    usdtBalance: BigInt(usdtBalance),
    protocolUser: pUser,
    openGenerationLevels: openLevels,
    protocolStakeCount: stakeCount,
    stakesList,
    storeUser,
    storeIncome,
    storeFlow,
    storeCounts,
    weeklyMatching: BigInt(weeklyMatching),
    dailyMatching: BigInt(dailyMatching),
    daoStatus,
  };
}

export function fmt18(val: bigint | undefined | null, digits = 2): string {
  if (val === undefined || val === null) return "0";
  const n = Number(formatUnits(val, 18));
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits });
}
