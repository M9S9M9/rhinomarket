import "dotenv/config";
import { getIncomingUsdtTransactions, checkUsdtBalance } from "../src/lib/bsc";

(async () => {
  const addr = "0xe8d2b23A953ce4f2093dbCC8554Ab4FE1E4FD8BF";
  const usdt = await checkUsdtBalance(addr);
  console.log("Admin wallet USDT balance:", usdt);
  const txs = await getIncomingUsdtTransactions(addr);
  console.log("Incoming transfers:", txs.length);
  for (const tx of txs) {
    console.log("  from=", tx.from, " value=", Number(tx.value) / 1e18, " hash=", tx.hash);
  }
})();