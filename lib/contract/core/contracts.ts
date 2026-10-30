import { BaseError, ContractFunctionRevertedError, type Address, type Hash } from "viem";
import { config } from "../config/env";
import { dataStoreAbi, erc20Abi, protocolAbi, readerAbi, readerTeamDaoAbi } from "../abi";
import { getActiveWalletProvider, getClient, getWalletClient } from "./client";

const ERROR_MESSAGES: Record<string, string> = {
  NotAdmin: "Caller is not the Protocol Admin (onlyAdmin).",
  NotChainKeeper: "Caller is not the Chain Keeper (onlyChainKeeper).",
  NotOwner: "Caller is not the DataStore Owner (onlyOwner).",
  NotCore: "Caller is not the authorized Core contract on DataStore (onlyCore).",
  Unauthorized: "Caller is not authorized (onlyMinter or onlyBlacklistManager on ARITOHAM token).",
  OwnableUnauthorizedAccount: "Caller is not the Token Owner (onlyOwner).",
  OwnableInvalidOwner: "New owner cannot be the zero address.",
  ZeroAddress: "Address cannot be the zero address (0x000...000).",
  InvalidAmount:
    "InvalidAmount: Check parameters (for updateRewardIncome, rank_id must be strictly greater than user's currentRank on-chain; for distributeDao, totalShares must be > 0; for incentives/burns, amount must be > 0).",
  InsufficientTokens: "Wallet or contract has insufficient ARITOHAM token balance.",
  InsufficientLiquidity: "Protocol has insufficient USDT liquidity.",
  InsufficientBalance: "User has insufficient withdrawable balance.",
  Blacklisted: "Account is currently blacklisted from transferring/receiving ARITOHAM.",
  CannotBlacklist: "Cannot blacklist the zero address or the Blacklist Manager contract itself.",
  AlreadyRegistered: "User is already registered.",
  ReferrerNotRegistered: "Referrer address is not registered.",
  ReferrerNotActive: "Referrer address is not active.",
  NotRegistered: "User is not registered.",
  NotActive: "NotActive: Action not active yet (for distributeDao, 24h cooldown since daoLastCycleStart has not elapsed yet).",
  NothingToWithdraw: "Nothing available to claim or withdraw.",
  MaxPayoutReached: "User has already reached their maximum payout cap.",
  DailySellLimitExceeded: "24-hour daily sell limit exceeded.",
  SlippageExceeded: "Output tokens below minimum slippage threshold.",
  BadStakeIndex: "stakeIndex does not match user's current stakes array length in DataStore.",
  TooLarge: "Value exceeds uint128 maximum in DataStore.",
  EnforcedPause: "Protocol is currently paused.",
  ExpectedPause: "Protocol is not paused.",
};

export function decodeContractError(err: unknown): string {
  if (err instanceof BaseError) {
    const revertErr = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revertErr instanceof ContractFunctionRevertedError) {
      const errName = revertErr.data?.errorName;
      if (errName && ERROR_MESSAGES[errName]) {
        return ERROR_MESSAGES[errName];
      }
      if (errName) {
        return `Contract reverted with ${errName}`;
      }
      if (revertErr.reason) {
        return `Contract reverted: ${revertErr.reason}`;
      }
    }
    if (err.shortMessage) return err.shortMessage;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

/* ─────────────────────────── Read Helpers ─────────────────────────── */

export const readReader = (functionName: string, args?: readonly unknown[]) =>
  getClient().readContract({
    address: config.addresses.reader,
    abi: readerAbi,
    functionName: functionName as never,
    args: args as never,
  }) as Promise<any>;

export const readTeamDao = (functionName: string, args?: readonly unknown[]) =>
  getClient().readContract({
    address: config.addresses.readerTeamDao,
    abi: readerTeamDaoAbi,
    functionName: functionName as never,
    args: args as never,
  }) as Promise<any>;

export const readProtocol = (functionName: string, args?: readonly unknown[]) =>
  getClient().readContract({
    address: config.addresses.protocol,
    abi: protocolAbi,
    functionName: functionName as never,
    args: args as never,
  }) as Promise<any>;

export const readStore = (functionName: string, args?: readonly unknown[]) =>
  getClient().readContract({
    address: config.addresses.dataStore,
    abi: dataStoreAbi,
    functionName: functionName as never,
    args: args as never,
  }) as Promise<any>;

export const readToken = (functionName: string, args?: readonly unknown[], tokenAddr?: Address) =>
  getClient().readContract({
    address: tokenAddr ?? config.addresses.aritoham,
    abi: erc20Abi,
    functionName: functionName as never,
    args: args as never,
  }) as Promise<any>;

/* ─────────────────────────── Write Helpers ─────────────────────────── */

async function ensureWalletChain(): Promise<void> {
  const provider = getActiveWalletProvider();
  if (!provider?.request) return;
  const targetHex = "0x" + config.chain.id.toString(16);
  try {
    const currentHex: string = await provider.request({ method: "eth_chainId" });
    if (currentHex && currentHex.toLowerCase() === targetHex.toLowerCase()) return;
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetHex }],
      });
    } catch (switchErr: any) {
      if (switchErr?.code === 4902 || switchErr?.code === -32603) {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: targetHex,
              chainName: config.chain.name,
              nativeCurrency: config.chain.nativeCurrency,
              rpcUrls: config.rpcUrls.slice(0, 2),
              blockExplorerUrls: [config.explorer],
            },
          ],
        });
      } else {
        throw switchErr;
      }
    }
  } catch {
    // Allow writeContract to proceed if wallet doesn't support chain switch RPC
  }
}

async function executeWrite(
  address: Address,
  abi: readonly unknown[],
  functionName: string,
  args: readonly unknown[] = []
): Promise<{ hash: Hash }> {
  await ensureWalletChain();
  const wallet = getWalletClient();
  const publicClient = getClient();

  let accounts = await wallet.getAddresses().catch(() => [] as Address[]);
  if (!accounts || accounts.length === 0) {
    accounts = await wallet.requestAddresses();
  }
  const account = accounts[0];
  if (!account) {
    throw new Error("Please connect your MetaMask wallet first.");
  }

  try {
    // Pre-simulate to surface exact Solidity custom revert reasons before prompting wallet
    await publicClient.simulateContract({
      account,
      address,
      abi: abi as any,
      functionName: functionName as never,
      args: args as never,
      chain: config.chain,
    });

    const hash = await wallet.writeContract({
      account,
      address,
      abi: abi as any,
      functionName: functionName as never,
      args: args as never,
      chain: config.chain,
    });

    await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 }).catch(() => null);
    return { hash };
  } catch (err) {
    throw new Error(decodeContractError(err));
  }
}

export const writeProtocol = (functionName: string, args: readonly unknown[] = []) =>
  executeWrite(config.addresses.protocol, protocolAbi, functionName, args);

export const writeStore = (functionName: string, args: readonly unknown[] = []) =>
  executeWrite(config.addresses.dataStore, dataStoreAbi, functionName, args);

export const writeToken = (functionName: string, args: readonly unknown[] = [], tokenAddr?: Address) =>
  executeWrite(tokenAddr ?? config.addresses.aritoham, erc20Abi, functionName, args);
