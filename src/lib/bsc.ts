import { JsonRpcProvider, Wallet, Contract, formatUnits } from "ethers";
import { Interface } from "ethers";

const BSC_RPC_URLS = [
  "https://bsc-dataseed.binance.org",
  "https://bsc-dataseed1.binance.org",
  "https://bsc-dataseed1.defibit.io",
];

const BSCSCAN_API = "https://api.bscscan.com/api";
export const USDT_BEP20_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";
const USDT_DECIMALS = 18;

const TRANSFER_EVENT_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

let _provider: JsonRpcProvider | null = null;

function getProvider(): JsonRpcProvider {
  if (!_provider) {
    const rpcUrl = process.env.BSC_RPC_URL || BSC_RPC_URLS[0];
    _provider = new JsonRpcProvider(rpcUrl);
  }
  return _provider;
}

function getWallet(): Wallet {
  const pk = process.env.PLATFORM_WALLET_PRIVATE_KEY;
  if (!pk) throw new Error("PLATFORM_WALLET_PRIVATE_KEY not set");
  return new Wallet(pk, getProvider());
}

function getContract(signer?: Wallet): Contract {
  return new Contract(USDT_BEP20_CONTRACT, [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
  ], signer || getProvider());
}

async function bscscan(
  params: Record<string, string>
): Promise<any> {
  const apiKey = process.env.BSCSCAN_API_KEY;
  if (!apiKey) return null;

  const qs = new URLSearchParams({ ...params, apikey: apiKey, tag: "latest" }).toString();
  const res = await fetch(`${BSCSCAN_API}?${qs}`);
  if (!res.ok) throw new Error(`BscScan API error: ${res.status}`);
  const data = await res.json();
  if (data.status !== "1" || !Array.isArray(data.result)) return [];
  return data.result.map((tx: any) => ({
    hash: tx.hash,
    value: tx.value,
    from: tx.from,
    to: tx.to,
    block_number: Number(tx.blockNumber),
    timeStamp: Number(tx.timeStamp) * 1000,
  }));
}

export async function getIncomingUsdtTransactions(
  address: string,
  sinceTimestamp?: number
): Promise<any[]> {
  const params: Record<string, string> = {
    module: "account",
    action: "tokentx",
    contractaddress: USDT_BEP20_CONTRACT,
    address: address.toLowerCase(),
    page: "1",
    offset: "200",
    sort: "asc",
  };
  if (sinceTimestamp) params.startblock = "0";

  const txs = await bscscan(params);
  if (txs === null) {
    // Fallback: query Transfer events for the address via an eth_getLogs RPC
    const logs = await getTransferLogs(address, sinceTimestamp);
    return logs;
  }
  return txs
    .filter((tx: any) => (tx.to || "").toLowerCase() === address.toLowerCase())
    .filter((tx: any) => !sinceTimestamp || tx.timeStamp >= sinceTimestamp);
}

async function getTransferLogs(address: string, sinceTimestamp?: number): Promise<any[]> {
  const provider = getProvider();
  const iface = new Interface([
    "event Transfer(address indexed from, address indexed to, uint256 value)",
  ]);

  const logs = await provider.getLogs({
    address: USDT_BEP20_CONTRACT,
    topics: [TRANSFER_EVENT_TOPIC, null, address.toLowerCase()],
    fromBlock: "latest",
    toBlock: "latest",
  });

  return logs.map((log: any) => {
    const parsed = iface.parseLog(log);
    const decoded = parsed?.args;
    return {
      hash: log.transactionHash,
      value: decoded?.value?.toString?.() || "0",
      from: decoded?.from?.toLowerCase?.() || "",
      to: decoded?.to?.toLowerCase?.() || "",
      block_number: log.blockNumber,
      timeStamp: 0,
    };
  });
}

export async function getLatestBlock(): Promise<number> {
  return await getProvider().getBlockNumber();
}

export async function verifyTransactionOnChain(
  txHash: string,
  expectedTo: string,
  expectedAmount: number
): Promise<{ valid: boolean; confirmations: number; from: string; actualAmount: number }> {
  try {
    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) return { valid: false, confirmations: 0, from: "", actualAmount: 0 };

    const iface = new Interface([
      "event Transfer(address indexed from, address indexed to, uint256 value)",
    ]);

    let from = "";
    let actualAmount = 0;
    let to = "";

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== USDT_BEP20_CONTRACT.toLowerCase()) continue;
      const parsed = iface.parseLog(log);
      if (!parsed) continue;
      const args = parsed.args;
      from = (args.from as string).toLowerCase();
      to = (args.to as string).toLowerCase();
      actualAmount = Number(formatUnits(args.value, USDT_DECIMALS));
      break;
    }

    const currentBlock = await getLatestBlock();
    const confirmations = Math.max(0, currentBlock - receipt.blockNumber);

    const valid =
      to === expectedTo.toLowerCase() &&
      from !== expectedTo.toLowerCase() &&
      Math.abs(actualAmount - expectedAmount) < 0.01;

    return { valid, confirmations, from, actualAmount };
  } catch (err) {
    console.error("BSC verification error:", err);
    return { valid: false, confirmations: 0, from: "", actualAmount: 0 };
  }
}

export async function sendUsdt(toAddress: string, amount: number): Promise<string> {
  const contract = getContract(getWallet());
  const amountBase = BigInt(Math.round(amount * 10 ** USDT_DECIMALS));
  const tx = await contract.transfer(toAddress, amountBase);
  await tx.wait();
  return tx.hash;
}

export async function checkUsdtBalance(address: string): Promise<number> {
  const contract = getContract();
  const balance = await contract.balanceOf(address);
  return Number(formatUnits(balance, USDT_DECIMALS));
}