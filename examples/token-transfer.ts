// To execute this file, run the following command from the root of the repository:
// npm run example -- './examples/token-transfer.ts'

/*
This example showcases how to the use transferToken convenience method to send tokens on PChain.

Pre-requisites:
1. You will need a PChain Testnet account with TXPLL balance, see 
https://docs.parallelchain.io/getting_started/create_account/
*/

// for actual usage, import PChain directly from the npm package, i.e.
// import { PChain } from "pchain-dapp-sdk-js";
import { PChain } from "../src";

// we will make use of the related "pchain-types-js" package
// which exposes primitive types for interacting with PChain
import { Keypair, PrivateKey, PublicAddress } from "pchain-types-js";

// load other helper packages
// including  dotenv package for loading environment variables from a .env file
import { config } from "dotenv";
import BN from "bn.js";

(async function example() {
  // connect to the PChain testnet
  const pchain = new PChain("https://pchain-test-rpc02.parallelchain.io");

  // load env files to set up keypair
  config();
  if (!process.env.PUBLIC_KEY || !process.env.PRIVATE_KEY) {
    throw new Error("Private key and public key are required");
  }
  const signingKeypair = new Keypair(
    new PublicAddress(process.env.PUBLIC_KEY),
    new PrivateKey(process.env.PRIVATE_KEY)
  );

  // we are using a random address to test transferring tiny amounts
  // replace with another address if you want to test transferring to a different account
  const toAddress = "uwNayTusG-6R3qzftWNmC_OIbpCf5i2pfaacHRd9058";
  const transferAmt = "99";

  // inspect the state of the account before the transfer
  const beforeBalance = await pchain.getAccountBalance(toAddress);
  console.log(`Before: Balance is ${beforeBalance.toString()}`);

  const transactionHash = await pchain.transferToken(
    toAddress,
    new BN(transferAmt),
    signingKeypair
  );

  const afterBalance = await pchain.getAccountBalance(toAddress);
  if (afterBalance.sub(beforeBalance).toString() !== transferAmt) {
    console.log("Transfer amounts do not match");
  }
  console.log(`After: Balance is ${afterBalance.toString()}`);

  console.log(
    `Successfully transferred ${transferAmt} to ${toAddress}, tx hash: ${transactionHash.toBase64url()}`
  );
})();
