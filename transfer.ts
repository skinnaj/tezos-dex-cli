import { TezosToolkit } from "@taquito/taquito";
import { InMemorySigner } from "@taquito/signer";
import { TransactionOperation } from "@taquito/taquito/dist/types/operations/transaction-operation";
import fetch from "node-fetch";
import { BatchOperation } from "@taquito/taquito/dist/types/operations/batch-operation";
import BigNumber from "bignumber.js";

require("dotenv").config();

type Pools = "USDtz" | "ETHtz" | "tzBTC" | "wXTZ" | "XTZ";

const dexterPools = {
  USDtz: "KT1Puc9St8wdNoGtLiD2WXaHbWU7styaxYhD",
  ETHtz: "KT19c8n5mWrqpxMcR3J687yssHxotj88nGhZ",
  tzBTC: "KT1DrJV8vhkdLEj76h1H9Q4irZDqAkMPo1Qf",
  wXTZ: "KT1XTXBsEauzcv3uPvVXW92mVqrx99UGsb9T",
};

const contracts = [
  {
    address: "KT1LN4LPSqTMS7Sd2CJw4bbDGRkMv2t68Fy9",
    symbol: "USDtz",
  },
  {
    address: "KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn",
    symbol: "tzBTC",
  },
  {
    address: "KT1VYsVfmobT7rsMVivvZ4J8i3bPiqz12NaH",
    symbol: "wXTZ",
  },
  {
    address: "KT19at7rQUvyjxnZ2fBv7D9zc8rkyG7gAoU8",
    symbol: "ETHtz",
  },
];

(async () => {
  const args = process.argv.slice(2);
  doTransfer(args[0] as Pools, args[1] as Pools, parseFloat(args[2]), args[3]);
})();

async function doTransfer(
  from: Pools,
  to: Pools,
  amount: number,
  address: string
) {
  const prices = await getPrices();

  try {
    const a = address || process.env.ADDRESS;
    const node = await getNode();

    const poolContract = await node.contract.at(
      dexterPools[from.toLowerCase() === "xtz" ? to : from]
    );

    const timeout = new Date(new Date().getTime() + 3 * 60000);

    let res: TransactionOperation | BatchOperation;
    if (from.toLowerCase() === "xtz") {
      res = await poolContract.methods
        .xtzToToken(a, 1, timeout)
        .send({ amount });
    } else {
      const tokenDecimals = getTokenDecimals(from);
      const xtzDecimals = new BigNumber("1000000");

      const price = getConversionPrice(prices, from, tokenDecimals);

      const tokens = new BigNumber(amount).times(tokenDecimals);
      const xtz = Math.floor(
        tokens.dividedBy(price).times(xtzDecimals).toNumber() * 0.8
      );

      const tokenContract = await node.contract.at(
        contracts.find((c) => c.symbol === from).address
      );

      res = await node
        .batch()
        .withContractCall(
          tokenContract.methods.approve(dexterPools[from], tokens)
        )
        .withContractCall(
          poolContract.methods.tokenToXtz(a, a, tokens.toNumber(), xtz, timeout)
        )
        .send();
    }

    console.log(`Transfering ${amount} ${from} to ${to}`);
    await res.confirmation();
    console.log(`Transfer confirmed in ${res.hash}`);
  } catch (err) {
    console.log(`Error: ${JSON.stringify(err, null, 2)}`);
  }
}

async function getPrices() {
  const prices = await (
    await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=tezos&vs_currencies=USD,ETH,BTC"
    )
  ).json();
  prices["tezos"]["wxtz"] = 1.30936994; // price comes from dexter, which has no API for exact number fetching

  return prices;
}

async function getNode() {
  const node = new TezosToolkit(`${process.env.RPC_URL}`);
  node.setProvider({
    signer: await InMemorySigner.fromSecretKey(process.env.PRIVATE_KEY),
  });
  return node;
}

function getTokenDecimals(from: Pools) {
  let tokenDecimals = new BigNumber("1000000");
  if (from === "ETHtz") {
    tokenDecimals = new BigNumber("1000000000000000000");
  } else if (from === "tzBTC") {
    tokenDecimals = new BigNumber("100000000");
  }
  return tokenDecimals;
}

function getConversionPrice(prices, from, tokenDecimals) {
  return new BigNumber(
    prices["tezos"][
      Object.keys(prices["tezos"]).find((p: string) =>
        from.toLowerCase().includes(p)
      )
    ]
  ).times(tokenDecimals);
}
