// To execute this file, run the following command from the root of the repository:
// npm run example -- './examples/smart-contract-helpers.ts'

/*
This example showcases how to use the convenience methods provided to interact with smart contracts on PChain.

Pre-requisites:
1. You will need a PChain Testnet account with TXPLL balance, refer to 
https://docs.parallelchain.io/getting_started/create_account/

2. You will need a previously deployed smart contract on Testnet

In this example, we will be interacting with the "HelloContract", which can be found here: 
https://github.com/parallelchain-io/example-smart-contracts/blob/main/chapter_1/src/lib.rs

An instance of the contract is deployed Testnet at this address:
"ZxjCCuD8s5TEnXlbn9F7JMYmjNFMs5cGHSj21g9Ea0Y"
*/

//
// for actual usage, import PChain directly from the npm package, i.e.
// import { PChain } from "pchain-dapp-sdk-js";
import { PChain } from "../src";

// we will make use of the related "pchain-types-js" package
// which exposes primitive types for interacting with PChain
import {
  BinaryReader,
  ExitStatus,
  Keypair,
  PrivateKey,
  PublicAddress,
} from "pchain-types-js";

// load other helper packages
// including  the dotenv package for configuring environment variables from a .env file
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

  const contractAddress = "ZxjCCuD8s5TEnXlbn9F7JMYmjNFMs5cGHSj21g9Ea0Y";

  //
  //
  // PART ONE: Invoke view method using callContractView
  //
  //

  // callContractView allows you to call a smart contract method through the View procedure
  // the method in question must not write (store) any data on the blockchain
  const viewMethodName = "i_say_hello";
  console.log("\nBegin invoking view method:", viewMethodName);
  const { exit_status: viewSuccessExit, return_values: viewReturnValues } =
    await pchain.callContractView(contractAddress, viewMethodName, null);

  console.log("Exit status: ", viewSuccessExit);
  // Prints "Exit status:  0", i.e. Success

  // use the BinaryReader class from 'pchain-types'
  // reference the expected return type of the method called based on the contract code
  // in this case we expect it to be a String
  console.log(
    "Return value:",
    new BinaryReader(Buffer.from(viewReturnValues)).readString()
  );
  // Prints "Return value: you say world!"

  //
  //
  // PART TWO: INVOKE smart contract
  //
  //
  const stateChangeMethodName = "hello_set_many";
  console.log("\nBegin invoking state change method:", stateChangeMethodName);

  // our goal is to invoke the "hello_set_many" method
  // whose source function looks like so:
  // fn hello_set_many() {
  //   for i in 1..10{
  //       let key = format!("hello-key-{}", i);
  //       let value = vec![0_u8; 1024*10]; //10KB
  //       storage::set(key.as_bytes(), &value);
  //   }
  // }
  // https://github.com/parallelchain-io/example-smart-contracts/blob/29d7417d437c17b3939291ef0e2a651f49637c54/chapter_1/src/lib.rs#L42C27-L42C27
  //
  //
  // notice the method stores 10 values, each of 10KB to the blockchain
  // which means that it is not a view method
  //
  // IMPORTANT! - this method costs a LARGE amount of gas invoke as it stores a lot of data on the blockchain
  // it is only used here as an example of a state change method
  // in actual smart contracts you should avoid large data storage where possible

  // if we attempt to invoke the function as a View method, the call should fail
  const { exit_status: viewFailureExit } = await pchain.callContractView(
    contractAddress,
    stateChangeMethodName,
    null
  );

  if (viewFailureExit !== ExitStatus.Failed) {
    throw new Error("Expected view call to fail but did not");
  }

  console.log(
    "Invoking method as a View call failed, Exit status: ",
    viewFailureExit
  );
  // Prints "Exit status: 1", i.e. Failed

  // instead, if we invoke the method through the callContractStateChange convenience method
  // the call will succeed
  console.log("Invoking method using callContractStateChange");
  const {
    exit_status: stateChangeExitStatus,
    return_values: stateChangeReturnValues,
    logs: stateChangeReturnLogs,
  } = await pchain.callContractStateChange(
    contractAddress,
    "hello_set_many",
    null,
    null,
    signingKeypair,
    // note this an expensive contract method call for demonstration, pass in a high gas limit
    new BN(250_000_000)
  );

  console.log(
    "Invoking method as a State Change method, Exit status: ",
    stateChangeExitStatus
  );
  // Prints "Exit status: 0", i.e. Success

  // the method does not return any value
  // nor does it emit any logs, hence we expect these fields to be empty
  console.log("Return values: ", stateChangeReturnValues);
  // Prints "Return values: Uint8Array(0) []"

  console.log("Logs:", stateChangeReturnLogs);
  // Prints "Logs: []"

  console.log("Done");
})();
