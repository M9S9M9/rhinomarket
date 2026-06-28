const { TronWeb } = require("tronweb");

const TRONGRID_API = "https://api.trongrid.io";
const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

let _tronWeb: any = null;

function getTronWeb(): any {
  if (!_tronWeb) {
    _tronWeb = new TronWeb({
      fullHost: TRONGRID_API,
      privateKey: process.env.PLATFORM_WALLET_PRIVATE_KEY,
    });
  }
  return _tronWeb;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.TRONGRID_API_KEY) {
    headers["TRON-PRO-API-KEY"] = process.env.TRONGRID_API_KEY;
  }
  return headers;
}

export async function getIncomingUsdtTransactions(
  address: string,
  sinceTimestamp?: number
): Promise<any[]> {
  const params = new URLSearchParams({
    only_to: "true",
    contract_address: USDT_CONTRACT,
    limit: "200",
    order_by: "block_timestamp,asc",
  });
  if (sinceTimestamp) {
    params.set("min_timestamp", String(Math.floor(sinceTimestamp)));
  }

  const url = `${TRONGRID_API}/v1/accounts/${address}/transactions/trc20?${params}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error(`TronGrid API error: ${res.status}`);
  const data = await res.json();
  return data.data || [];
}

export async function getLatestBlock(): Promise<number> {
  const res = await fetch(`${TRONGRID_API}/wallet/getnowblock`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to get latest block");
  const data = await res.json();
  return data.block_header?.raw_data?.number || 0;
}

export async function verifyTransactionOnChain(
  txHash: string,
  expectedTo: string,
  expectedAmount: number
): Promise<{ valid: boolean; confirmations: number; from: string; actualAmount: number }> {
  const res = await fetch(`${TRONGRID_API}/v1/transactions/${txHash}/trc20`, {
    headers: getHeaders(),
  });
  if (!res.ok) return { valid: false, confirmations: 0, from: "", actualAmount: 0 };
  const data = await res.json();
  const tx = data.data?.[0];
  if (!tx) return { valid: false, confirmations: 0, from: "", actualAmount: 0 };

  const value = Number(tx.value) / 1_000_000;
  const to = (tx.to || "").toLowerCase();
  const from = (tx.from || "").toLowerCase();
  const blockNumber = tx.block_number || 0;

  const currentBlock = await getLatestBlock();
  const confirmations = Math.max(0, currentBlock - blockNumber);

  const valid = to === expectedTo.toLowerCase() && Math.abs(value - expectedAmount) < 0.01;

  return { valid, confirmations, from, actualAmount: value };
}

export async function sendUsdt(toAddress: string, amount: number): Promise<string> {
  const pk = process.env.PLATFORM_WALLET_PRIVATE_KEY;
  if (!pk) throw new Error("PLATFORM_WALLET_PRIVATE_KEY not set");

  const tronWeb = getTronWeb();
  const amountInSun = Math.round(amount * 1_000_000);

  try {
    const contract = await tronWeb.contract().at(USDT_CONTRACT);
    const txHash = await contract.transfer(toAddress, amountInSun).send({
      feeLimit: 150_000_000,
      callValue: 0,
      shouldPollResponse: true,
    });
    return txHash;
  } catch (error: any) {
    throw new Error(`USDT transfer failed: ${error.message || error}`);
  }
}

export async function checkUsdtBalance(address: string): Promise<number> {
  const res = await fetch(`${TRONGRID_API}/v1/accounts/${address}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch account");
  const data = await res.json();
  const trc20 = data.data?.[0]?.trc20?.[0];
  if (trc20 && trc20[USDT_CONTRACT]) {
    return Number(trc20[USDT_CONTRACT]) / 1_000_000;
  }
  return 0;
}
