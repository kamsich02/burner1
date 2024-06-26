import { providers, Wallet } from "ethers";
import { formatEther } from "ethers/lib/utils.js";
import { gasPriceToGwei } from "./utils.js";

import "log-timestamp";
import "dotenv/config";

const NETWORK_RPC_URL = process.env.NETWORK_RPC_URL;
const PRIVATE_KEY_ZERO_GAS = process.env.PRIVATE_KEY_ZERO_GAS || "";

if (PRIVATE_KEY_ZERO_GAS === "") {
  console.warn(
    "Must provide PRIVATE_KEY_ZERO_GAS environment variable, corresponding to the compromised wallet."
  );
  process.exit(1);
}

const provider = new providers.JsonRpcProvider(NETWORK_RPC_URL);
const walletZeroGas = new Wallet(PRIVATE_KEY_ZERO_GAS, provider);

console.log(`Zero Gas Account: ${walletZeroGas.address}`);

async function burn(wallet) {
  const balance = await wallet.getBalance();
  if (balance.isZero()) {
    console.log(` Balance is zero`);
    return;
  }

  const gasPrice = balance.div(21000).sub(1);
  if (gasPrice.lt(1e9)) {
    console.log(
      ` Balance too low to burn (balance=${formatEther(
        balance
      )} gasPrice=${gasPriceToGwei(gasPrice)})`
    );
    return;
  }

  try {
    console.log(` Burning ${formatEther(balance)}`);
    const tx = await wallet.sendTransaction({
      to: wallet.address,
      gasLimit: 21000,
      gasPrice,
    });
    console.log(
      ` Sent tx with nonce ${tx.nonce} burning ${formatEther(
        balance
      )} ETH at gas price ${gasPriceToGwei(gasPrice)} gwei: ${tx.hash}`
    );
  } catch (err) {
    console.log(` Error sending tx: ${err.message ?? err}`);
  }
}

async function main() {
  console.log(`Connected to ${NETWORK_RPC_URL}`);
  provider.on("block", async (blockNumber) => {
    console.log(`New block ${blockNumber}`);
    await burn(walletZeroGas);
  });
}

main();
