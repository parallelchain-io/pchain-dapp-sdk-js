// To execute this file, run the following command from the root of the repository:
// npm run example -- './examples/smart-contract-e2e.ts'

/*
This example showcases an end-to-end flow of deploying and interacting with a smart contract on PChain.

Pre-requisites:
1. You will need a PChain Testnet account with TXPLL balance, see 
https://docs.parallelchain.io/getting_started/create_account/

2. You will need a PChain smart contract binary in .wasm format.
For creation instructions, see
https://docs.parallelchain.io/smart_contract_sdk/introduction/

In this example, we are using the sample binary at `fixtures/hello_contract.wasm`
Which is a compiled version of the HelloContract found here
https://github.com/parallelchain-io/example-smart-contracts/blob/main/chapter_1/src/lib.rs
*/

//
// for actual usage, import PChain directly from the npm package, i.e.
// import { PChain } from "pchain-dapp-sdk-js";
import { PChain } from "../src";

// we will make use of the related "pchain-types-js" package
// which exposes primitive types for interacting with PChain
import {
  BinaryReader,
  BinaryWriter,
  Call,
  Deploy,
  ExitStatus,
  Keypair,
  // note the Option type which is used in certain parameters of the Call command
  Option,
  PrivateKey,
  PublicAddress,
} from "pchain-types-js";

// load other helper packages
// including  dotenv package for loading environment variables from a .env file
// and the path and fs packages to load the smart contract .wasm file
import { config } from "dotenv";
import * as path from "path";
import * as fs from "fs";
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

  //
  //
  // STEP ONE: DEPLOY smart contract
  //
  //
  console.log("\nBegin deploying smart contract\n");

  const contractWasmPath = "../fixtures/hello_contract.wasm";
  console.log("Reading smart contract .wasm file from ", contractWasmPath);
  const contractPath = path.join(__dirname, contractWasmPath);
  const wasmBytes = fs.readFileSync(contractPath);

  // fetch the current nonce for the given keypair
  // use it without incrementing for our next transaction
  const deployTxNonce = await pchain.getAccountNonce(signingKeypair.public_key);

  // build a transaction using the buildTransaction helper
  // here, we are sending a Deploy command, which is one of the possible Command types that the protocol accepts
  // for a full list, see https://github.com/parallelchain-io/pchain-types-js/blob/master/src/blockchain/transaction_commands.ts
  const deployTx = await pchain
    .buildTransaction(signingKeypair, deployTxNonce)
    .addCommand(
      new Deploy({
        // the bytes of the .wasm file can be passed directly to the contract param
        contract: wasmBytes,
        // Contract Binary Interface (CBI) is a standard specifying a valid contract, it is set to 0 in the current protocol version
        cbi_version: 0,
      })
    )
    // the Deploy command is relatively expensive, set a high gas limit to be be safe
    .setGasLimit(new BN(250_000_000))
    .build();

  // use the provided submitAndConfirmTransaction helper
  // which will wait for transaction confirmation
  const { command_receipts: deployCommandReceipts } =
    await pchain.submitAndConfirmTransaction(deployTx);

  // since there is only one command (Deploy), we expect a single receipt
  // inspect its exit_status to ensure the transaction was successful
  if (deployCommandReceipts[0].exit_status !== ExitStatus.Success) {
    throw new Error("Transaction execution failed");
  }

  // the buildContractAddress helper calculates the address of our deployed contract
  // we can fetch the contract code persisted to PChain for a sanity check
  const contractAddress = pchain.buildContractAddress(
    signingKeypair.public_key,
    deployTxNonce
  );
  const contractCode = await pchain.getContractCode(contractAddress);
  if (!contractCode) {
    throw new Error("Contract not found");
  }
  if (Buffer.from(contractCode).compare(wasmBytes) !== 0) {
    throw new Error("Contract code does not match");
  }
  console.log(
    "Contract deployed successfully to address:",
    contractAddress.toBase64url()
  );

  //
  //
  // STEP TWO: INVOKE smart contract
  //
  //
  console.log("\nBegin invoking smart contract\n");

  // our goal is to invoke the "hello_from" method
  // whose source function looks like so:
  //
  // fn hello_from(name :String) -> u32 {
  //   pchain_sdk::log(
  //     "topic: Hello From".as_bytes(),
  //     format!("Hello, Contract. From: {}", name).as_bytes()
  //   );
  //   name.len() as u32
  // }
  // https://github.com/parallelchain-io/example-smart-contracts/blob/29d7417d437c17b3939291ef0e2a651f49637c54/chapter_1/src/lib.rs#L24
  //
  // since the function expects a parameter 'name' of type String
  // we will use the BinaryWriter helper from "pchain-types" to serialize the string
  const nameParamValue = "parallelchain";
  const paramWriter = new BinaryWriter();
  paramWriter.writeString(nameParamValue);
  const serializedNameParam = paramWriter.toArray();

  // don't forget to retrieve the next nonce since this is a new transaction
  const callTxNonce = await pchain.getAccountNonce(signingKeypair.public_key);

  // build a transaction with the Call command, passing the serialized parameter
  // note the 'args' and the 'amount' fields are wrapped in an Option class as they represent potentially empty values
  const callTx = await pchain
    .buildTransaction(signingKeypair, callTxNonce)
    .addCommand(
      new Call({
        target: new PublicAddress(contractAddress),
        method: "hello_from",
        // args and amount are of type Option
        // don't forget to import the Option type from "pchain-types-js"
        // in this case args has some value, but amount is empty (null)
        //
        // IMPORTANT! the args field is an ARRAY of Buffer/ Uint8Arrays, you need to wrap each argument like so [arg1, arg2, arg3, ...]
        // in this case there is only one param so we wrap it in an array with a single element
        args: new Option<Uint8Array[]>({
          value: [serializedNameParam],
        }),
        amount: new Option<BN>({ value: null }),
      })
    )
    .setGasLimit(new BN(3_000_000))
    .build();

  const { command_receipts: callCommandReceipts } =
    await pchain.submitAndConfirmTransaction(callTx);

  const { exit_status, return_values, logs } = callCommandReceipts[0];
  if (exit_status !== ExitStatus.Success) {
    throw new Error("Transaction execution failed");
  }

  // here we inspect the return value of the function call
  // from the function signature, we know that the return value is an unsigned 32-bit integer
  // equal to the length of the name parameter which we provided
  // we can use the BinaryReader from "pchain-types-js" to decode the value
  const commandReturnValue: number = new BinaryReader(
    Buffer.from(return_values)
  ).readU32();
  console.log(
    `Return value is ${commandReturnValue}, expected value is ${nameParamValue.length}`
  );
  // Prints: Return value is 13, expected value is 13

  // the function also generates log messages
  // which are topic-value pairs in the form of byte strings
  // we can decode them using TextDecoder from the standard library
  const decodedCommandLogs = logs.map(({ topic, value }) => ({
    topic: new TextDecoder().decode(topic),
    value: new TextDecoder().decode(value),
  }));

  console.log(decodedCommandLogs);
  // Prints:
  // [
  //   {
  //     topic: 'topic: Hello From',
  //     value: 'Hello, Contract. From: parallelchain'
  //   }
  // ]
  console.log("Done");
})();
