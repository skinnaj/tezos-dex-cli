import { TezosToolkit } from "@taquito/taquito";
import { InMemorySigner } from "@taquito/signer";
import BigNumber from "bignumber.js";

require("dotenv").config();

type Result = {
  metadata: {
    internal_operation_results: {
      parameters: {
        value: {
          int: number;
        };
      };
    }[];
  };
};

(async () => {
  const args = process.argv.slice(2);
  printBalances(args[0]);
})();

async function printBalances(address: string) {
  const node = new TezosToolkit(`${process.env.RPC_URL}`);
  node.setProvider({
    signer: await InMemorySigner.fromSecretKey(process.env.PRIVATE_KEY),
  });

  const entryContract = "KT18bAxHmJh511Co2nuFJQn888JxYX939RU3";
  const contracts = [
    {
      address: "KT1LN4LPSqTMS7Sd2CJw4bbDGRkMv2t68Fy9",
      symbol: "USDtz",
      decimals: new BigNumber("1000000"),
    },
    {
      address: "KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn",
      symbol: "tzBTC",
      decimals: new BigNumber("100000000"),
    },
    {
      address: "KT1VYsVfmobT7rsMVivvZ4J8i3bPiqz12NaH",
      symbol: "wXTZC",
      decimals: new BigNumber("1000000"),
    },
    {
      address: "KT19at7rQUvyjxnZ2fBv7D9zc8rkyG7gAoU8",
      symbol: "ETHtz",
      decimals: new BigNumber("1000000000000000000"),
    },
  ];

  const batch = node.batch();
  for (let i in contracts) {
    const cont = await node.contract.at(contracts[i].address);
    batch.withContractCall(
      cont.methods.getBalance(address || process.env.ADDRESS, entryContract)
    );
  }

  const batchOp = await batch.send();

  for (let i = 0; i < batchOp.results.length; i++) {
    console.log(
      `${new BigNumber(
        ((batchOp.results[
          i
        ] as unknown) as Result).metadata.internal_operation_results[0].parameters.value.int
      ).dividedBy(contracts[i].decimals)} ${contracts[i].symbol}`
    );
    try {
    } catch (error) {
      console.log(JSON.stringify(error));
    }
  }
}
