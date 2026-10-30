import { parseAbi } from "viem";

/**
 * Full ABI of ARITOHAMProtocol (main protocol contract), including all
 * read views, onlyAdmin, onlyChainKeeper, 2-of-2 multisig, user actions,
 * events, and custom errors.
 */
export const protocolAbi = parseAbi([
  // Structs
  "struct User { address referrer; bool isRegistered; bool isActive; uint256 totalInvestment; uint256 totalStaked; uint256 totalIncome; uint256 balance; uint256 remainingCap; uint256 totalReferralCount; uint256 activeReferralCount; uint256 qualifiedReferralCount; uint256 maxPayout; uint256 directIncome; uint256 generationIncome; uint256 daoIncome; uint256 currentRank; uint256 rewardIncome; uint256 rankIncentive; uint256 roiAccrued; uint256 totalStakeRoi; uint256 lastRoiUpdate; }",
  "struct Stake { uint256 totalInvestment; uint256 ecosystemFee; uint256 tokenPrice; uint256 mintedTokens; uint256 tokenUsdValue; uint256 dailyRoi; uint256 totalRoi; uint256 totalDays; uint256 claimedRoi; uint256 startTime; uint256 lastClaimTime; bool completed; }",

  // Roles & Core State
  "function admin() view returns (address)",
  "function chainKeeper() view returns (address)",
  "function dataStore() view returns (address)",
  "function rootUser() view returns (address)",
  "function storeRootInit() view returns (bool)",
  "function usdt() view returns (address)",
  "function aritoham() view returns (address)",
  "function paused() view returns (bool)",

  // Multisig Signer State
  "function isAdminSigner(address signer) view returns (bool)",
  "function adminSigners(uint256 index) view returns (address)",
  "function minAdminSignatures() view returns (uint256)",
  "function adminSigNonce() view returns (uint256)",

  // System Metrics
  "function totalUsers() view returns (uint256)",
  "function liquidityPool() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function totalBurnedTokens() view returns (uint256)",
  "function currentPrice() view returns (uint256)",
  "function getPrice() view returns (uint256)",
  "function rankIncentiveNonce() view returns (uint256)",
  "function timeUnit() view returns (uint256)",
  "function getSystemInfo() view returns (uint256 liquidityPool, uint256 totalSupply, uint256 totalBurnedTokens, uint256 currentPrice, uint256 contractUsdtBalance)",

  // DAO State & Views
  "function daoPoolTotal() view returns (uint256)",
  "function daoCycle() view returns (uint256)",
  "function daoLastCycleStart() view returns (uint256)",
  "function daoTotalShares(uint256 cycle) view returns (uint256)",
  "function daoShares(uint256 cycle, address wallet) view returns (uint256)",
  "function daoPayCycle() view returns (uint256)",
  "function daoPayPool() view returns (uint256)",
  "function daoPayPerShare() view returns (uint256)",
  "function daoPayCursor() view returns (uint256)",
  "function daoEligibleCount(uint256 cycle) view returns (uint256)",
  "function getDaoEligible(uint256 cycle) view returns (address[] wallets, uint256[] shares)",
  "function getDaoInfo() view returns (uint256 poolTotal, uint256 cycle, uint256 currentShares, uint256 lastCycleStart, uint256 payCycle, uint256 payCursor)",

  // User Views
  "function getUser(address user) view returns (User)",
  "function getUserFullInfo(address user) view returns (User user, uint256 openGenerationLevels, uint256 stakeCount)",
  "function getUserInfo(address user) view returns (uint256 totalInvestment, uint256 totalIncome, uint256 balance, uint256 roiAccrued, uint256 stakeCount, bool isActive)",
  "function userStakes(address user, uint256 index) view returns (uint256 totalInvestment, uint256 ecosystemFee, uint256 tokenPrice, uint256 mintedTokens, uint256 tokenUsdValue, uint256 dailyRoi, uint256 totalRoi, uint256 totalDays, uint256 claimedRoi, uint256 startTime, uint256 lastClaimTime, bool completed)",
  "function dailySellTotal(address user) view returns (uint256)",
  "function sellWindowStart(address user) view returns (uint256)",
  "function openLevels(address user) view returns (uint256)",
  "function isUserRegistered(address user) view returns (bool)",
  "function isUserActive(address user) view returns (bool)",
  "function getReferralCount(address user) view returns (uint256)",
  "function isBlacklisted(address user) view returns (bool)",
  "function getRewardAmount(uint256 rank_id) view returns (uint256)",

  // Constants
  "function PRICE_PRECISION() view returns (uint256)",
  "function BASE_PRICE() view returns (uint256)",
  "function TIME_UNIT() view returns (uint256)",
  "function DEFAULT_MAX_PAYOUT_MULTIPLIER() view returns (uint256)",
  "function REFERRAL_MAX_PAYOUT_MULTIPLIER() view returns (uint256)",
  "function MIN_BUY() view returns (uint256)",
  "function MAX_BUY() view returns (uint256)",
  "function BUY_STEP() view returns (uint256)",
  "function MIN_WITHDRAW() view returns (uint256)",
  "function MAX_WITHDRAW() view returns (uint256)",
  "function ECOSYSTEM_FEE_PCT() view returns (uint256)",
  "function MINT_PCT() view returns (uint256)",
  "function SELL_PAYOUT_PCT() view returns (uint256)",
  "function DAILY_SELL_LIMIT() view returns (uint256)",
  "function DIRECT_INCOME_PCT() view returns (uint256)",
  "function GENERATION_LEVELS() view returns (uint256)",
  "function LEVELS_PER_ACTIVE_DIRECT() view returns (uint256)",
  "function GEN_MIN_STAKE() view returns (uint256)",
  "function DAO_PCT() view returns (uint256)",

  // ───────── onlyAdmin Functions ─────────
  "function setDataStore(address _dataStore)",
  "function initStoreRoot()",
  "function renounceOwnership()",

  // ───────── 2-of-2 Admin Multisig Function ─────────
  "function setChainKeeper(address _newChainKeeper, bytes[] sigs)",

  // ───────── onlyChainKeeper Functions ─────────
  "function updateRewardIncome(address user, uint256 rank_id)",
  "function updateRankIncentive(address user, uint256 amount)",
  "function setDaoEligible(address[] wallets, uint256[] shares)",
  "function distributeDao(uint256 count)",
  "function setBlacklist(address user, bool status)",
  "function setBlacklistBatch(address[] users_, bool status)",
  "function resetRankBusinessDao(address user)",
  "function burnFrom(address from, uint256 amount)",

  // ───────── User Write Functions ─────────
  "function register(address _referrer)",
  "function stakeTokens(uint256 usdtAmount, uint256 minTokensOut)",
  "function sellTokens(uint256 tokenAmount)",
  "function claimRoi()",
  "function withdraw(uint256 amount)",

  // Events
  "event UserRegistered(address indexed user, address indexed referrer)",
  "event ChainKeeperUpdated(address indexed previousChainKeeper, address indexed newChainKeeper)",
  "event DataStoreUpdated(address indexed previousStore, address indexed newStore)",
  "event TokensPurchased(address indexed user, uint256 usdtAmount, uint256 tokens, uint256 price)",
  "event TokensSold(address indexed user, uint256 tokens, uint256 usdtPayout, uint256 price)",
  "event StakeCreated(address indexed user, uint256 amount, uint256 tokens, uint256 index)",
  "event stakeRewardUpdated(address indexed user, uint256 amount)",
  "event StakeRoiClaimed(address indexed user, uint256 indexed stakeIndex, uint256 stakeAmount, uint256 roiReward, uint256 forPeriods)",
  "event RankIncentiveUpdated(bytes32 indexed id, address indexed user, uint256 amount, uint256 rank, uint256 timestamp)",
  "event RunningStakesFrozen(address indexed user, uint256 count)",
  "event Withdraw(address user, uint256 amount, uint256 tokens, uint256 fee, uint256 price)",
  "event PriceUpdated(uint256 newPrice, uint256 liquidityPool, uint256 totalSupply)",
  "event DirectIncomeDistributed(address indexed from, address indexed to, uint256 amount)",
  "event GenerationIncomeDistributed(address indexed from, address indexed to, uint256 level, uint256 amount)",
  "event RewardIncomeUpdated(address user, uint256 amount, uint256 rank)",
  "event DaoEligibleSet(uint256 indexed cycle, uint256 count, uint256 sharesAdded)",
  "event DaoDistributed(uint256 indexed cycle, uint256 pool, uint256 walletCount)",
  "event DaoRewardCredited(address indexed user, uint256 amount)",
  "event AdminSignersUpdated(address[] signers, uint256 minSignatures)",
  "event OwnershipRenounced(address indexed previousAdmin)",
  "event UserSystemsReset(address indexed user)",
  "event TokensBurnedByKeeper(address indexed from, uint256 amount)",

  // Custom Errors
  "error AlreadyRegistered()",
  "error ReferrerNotRegistered()",
  "error ReferrerNotActive()",
  "error NotRegistered()",
  "error NotActive()",
  "error NotAdmin()",
  "error NotChainKeeper()",
  "error ZeroAddress()",
  "error InvalidAmount()",
  "error InsufficientTokens()",
  "error InsufficientLiquidity()",
  "error NothingToWithdraw()",
  "error MaxPayoutReached()",
  "error LiquidityInvariantBroken()",
  "error DailySellLimitExceeded()",
  "error SlippageExceeded()",
  "error InsufficientBalance()",
  "error EnforcedPause()",
  "error ExpectedPause()",
  "error ReentrancyGuardReentrantCall()",
]);

/**
 * Full ABI of ARITOHAM token (Aritoham.sol) + standard ERC-20 (USDT).
 * Covers onlyOwner, onlyMinter, onlyBlacklistManager, and ERC20Burnable.
 */
export const erc20Abi = parseAbi([
  // Read functions
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function owner() view returns (address)",
  "function minter() view returns (address)",
  "function blacklistManager() view returns (address)",
  "function isBlacklisted(address account) view returns (bool)",

  // Standard ERC-20 write functions
  "function approve(address spender, uint256 value) returns (bool)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",

  // onlyOwner functions (Aritoham.sol)
  "function setMinter(address _minter)",
  "function setBlacklistManager(address _manager)",
  "function transferOwnership(address newOwner)",
  "function renounceOwnership()",

  // onlyMinter functions (Aritoham.sol)
  "function mint(address to, uint256 amount)",
  "function burn(address from, uint256 amount)",

  // Public self-burn (ERC20Burnable)
  "function burn(uint256 value)",

  // onlyBlacklistManager functions (Aritoham.sol)
  "function setBlacklisted(address account, bool status)",
  "function burnFrom(address account, uint256 value)",

  // Events & Errors
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "event MinterUpdated(address indexed previousMinter, address indexed newMinter)",
  "event BlacklistManagerUpdated(address indexed previousManager, address indexed newManager)",
  "event BlacklistUpdated(address indexed account, bool blacklisted)",
  "error Unauthorized()",
  "error ZeroAddress()",
  "error Blacklisted(address account)",
  "error CannotBlacklist(address account)",
  "error OwnableUnauthorizedAccount(address account)",
  "error OwnableInvalidOwner(address owner)",
]);

/**
 * Full ABI of AritohamDataStore (AritohamDataStore.sol).
 * Covers all views, onlyOwner config functions, and all 14 onlyCore record functions.
 */
export const dataStoreAbi = parseAbi([
  // Structs
  "struct User { address referrer; uint40 registeredAt; uint40 activatedAt; uint8 rank; bool daoLifetime; uint32 id; uint32 directCount; uint32 activeDirects; uint32 teamCount; uint32 contributingCount; uint32 stakeCount; uint128 directBusiness; uint128 teamBusiness; uint128 matchingBusiness; uint128 selfStaked; uint128 windowDirect; uint128 windowMatching; }",
  "struct Income { uint128 direct; uint128 generation; uint128 roi; uint128 dao; uint128 rankReward; uint128 rankIncentive; }",
  "struct Flow { uint128 withdrawnUsd; uint128 withdrawnAritoham; uint128 soldAritoham; uint128 soldUsdt; uint128 wInWindow; uint128 sInWindow; uint40 wStart; uint40 sStart; }",
  "struct RankCfg { uint128 selfMinted; uint128 matching; uint128 reward; uint32 directs; uint16 incentiveBps; }",
  "struct DaoCycle { uint40 time; bool paid; uint32 members; uint32 totalShares; uint128 pool; }",

  // Access & Config Views
  "function owner() view returns (address)",
  "function core() view returns (address)",
  "function LEVELS() view returns (uint256)",
  "function WINDOW() view returns (uint256)",
  "function SHARE_STEP() view returns (uint256)",
  "function MAX_RANK() view returns (uint256)",
  "function maxTeamDepth() view returns (uint256)",
  "function activeDirectMin() view returns (uint256)",
  "function dailyLimit() view returns (uint256)",
  "function daoBps() view returns (uint256)",
  "function dailyRewardPpm() view returns (uint256)",

  // Global & Cycle Views
  "function idToUser(uint32 id) view returns (address)",
  "function nextUserId() view returns (uint32)",
  "function totalUsers() view returns (uint256)",
  "function totalDeposits() view returns (uint256)",
  "function currentCycle() view returns (uint256)",
  "function lastDistributedCycle() view returns (uint256)",
  "function lifetimeHolders() view returns (uint256)",
  "function cycleDeposit(uint256 cycle) view returns (uint256)",
  "function eligibleWallets(uint256 cycle, uint256 index) view returns (address)",
  "function eligibleAdded(uint256 cycle) view returns (uint256)",
  "function eligibleLength(uint256 cycle) view returns (uint256)",
  "function cyclePayoutsLength(uint256 cycle) view returns (uint256)",
  "function latestPrice() view returns (uint128)",
  "function pricePointsLength() view returns (uint256)",
  "function pricePoints(uint256 index) view returns (uint40 time, uint128 price)",

  // Struct & User Views
  "function getUser(address a) view returns (User)",
  "function getIncome(address a) view returns (Income)",
  "function getFlow(address a) view returns (Flow)",
  "function getRankCfg(uint256 r) view returns (RankCfg)",
  "function getDaoCycle(uint256 c) view returns (DaoCycle)",
  "function getDirects(address a) view returns (address[])",
  "function counts(address a) view returns (uint256[11])",
  "function weeklyMatching(address a) view returns (uint256)",
  "function dailyMatching(address a) view returns (uint256)",

  // ───────── onlyOwner Admin Functions ─────────
  "function setCore(address c)",
  "function transferOwnership(address o)",
  "function setMaxTeamDepth(uint256 v)",
  "function setActiveDirectMin(uint256 v)",
  "function setDailyLimit(uint256 v)",
  "function setDaoBps(uint256 v)",
  "function setDailyRewardPpm(uint256 v)",
  "function setRank(uint256 r, uint256 self_, uint256 matching, uint256 reward, uint256 directs_, uint256 bps)",

  // ───────── onlyCore Write Functions ─────────
  "function recordRegistration(address user, address referrer)",
  "function recordStake(address user, uint256 usdt, uint256 tokens, uint256 stakeIndex)",
  "function recordPurchase(address user, uint256 usdt, uint256 tokens, uint256 price)",
  "function recordSell(address user, uint256 tokenAmount, uint256 payout, uint256 price)",
  "function recordDirectIncome(address user, address referrer, uint256 reward, uint256 minted)",
  "function recordRoiClaim(address user, uint256 stakeIndex, uint256 totalInvestment, uint256 earned, uint256 periodsPassed)",
  "function recordGenerationIncome(address claimer, address receiver, uint256 level, uint256 reward, uint256 base)",
  "function recordRewardIncome(address user, uint256 amount, uint256 rank)",
  "function recordRankIncentive(uint256 id, address user, uint256 amount, uint256 rank, uint256 ts)",
  "function recordDaoEligible(uint256 cycle, address[] wallets, uint256 added)",
  "function recordDaoDistributed(uint256 cycle, uint256 pool, uint256 count)",
  "function recordDaoReward(address wallet, uint256 reward, uint256 shares)",
  "function recordWithdraw(address user, uint256 amount, uint256 tokens, uint256 fee, uint256 price)",
  "function resetRankBusinessDao(address user)",

  // Errors
  "error NotOwner()",
  "error NotCore()",
  "error AlreadyRegistered()",
  "error BadStakeIndex()",
  "error TooLarge()",
]);
