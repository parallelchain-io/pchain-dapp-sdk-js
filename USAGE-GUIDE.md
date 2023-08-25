# Usage and Examples

**Table of Contents**

- [Create PChain Instance](#create-pchain-instance)

- [Import Related Packages](#import-related-packages)

- [Reading From PChain](#reading-from-pchain)

  - [getAccountBalance](#get-account-balance)
  - [getAccountNonce](#get-account-nonce)
  - [getBlock](#get-block)
  - [getContractCode](#get-contract-code)
  - [getLatestCommittedBlock](#get-latest-committed-block)
  - [getTransaction](#get-transaction)

- [Writing To PChain](#writing-to-pchain)

  - [submitAndConfirmTransaction](#submit-and-confirm-transaction)
  - [submitTransaction](#submit-transaction)

- [Convenience Methods](#convenience-methods)

  - [buildContractAddress](#build-contract-address)
  - [buildTransaction](#build-transaction)
  - [callContractStateChange](#call-contract-state-change)
  - [callContractView](#call-contract-view)
  - [transferToken](#transfer-token)

## Create PChain Instance

```ts
// note: use a named import instead of a default import
import { PChain } from "pchain-dapp-sdk-js";

// provide an RPC endpoint, in this case, PChain testnet
const pchain = new PChain("https://pchain-test-rpc02.parallelchain.io");
```

## Import Related Packages

For many routine operations, you will require `pchain-types-js` and `bn.js` in conjunction with this package.

This can be easily done as shown in the following example:

```ts
import { PublicAddress } from "pchain-types-js";
import BN from "bn.js";

// separately we prepare the toAddress (string), transferAmt(number or string), and signingKeypair
// refer to `examples/token-transfer.ts` for more details
const transactionHash = await pchain.transferToken(
  // transferToken() also accepts the address string directly, other than a PublicAddress instance
  // here we are using the latter for purposes of the import demonstration
  new PublicAddress(toAddress),
  new BN(transferAmt),
  signingKeypair
);
let afterBalance = await pchain.getAccountBalance(toAddress);
console.log(
  `Token transfer completed with tx hash ${transactionHash.toBase64url()}`
);
```

## Reading From PChain

### Get Account Balance

Retrieves token balance for a chosen account in grays (the smallest denomination of XPLL).

```ts
// accepts either a base64Url string
const balanceA = await pchain.getAccountBalance(
  "6YokxrV0U2y6zg8FElk3Rb7j_jGolP28ZuMd6P2XXn0"
);

// or an instance of PublicAddress
import { PublicAddress } from "pchain-types-js";
const balanceB = await pchain.getAccountBalance(
  new PublicAddress("6YokxrV0U2y6zg8FElk3Rb7j_jGolP28ZuMd6P2XXn0")
);

// always returns a BN
console.log(balanceA instanceof BN); // true
console.log(balanceB instanceof BN); // true

console.log(balanceA.toString()); // 518806329 (grays)
console.log(balanceB.toString()); // 518806329 (grays)
```

### Get Account Nonce

Retrieves the latest nonce for the account.

This value can be used directly, without incrementing, to submit the next transaction.

The nonce represents the number of transactions performed by the account.
For accounts with no prior transactions, the nonce will be 0.

```ts
// accepts either a base64Url string
const nonce = await pchain.getAccountNonce(
  "6YokxrV0U2y6zg8FElk3Rb7j_jGolP28ZuMd6P2XXn0"
);

// or an instance of PublicAddress
import { PublicAddress } from "pchain-types-js";
const nonce = await pchain.getAccountNonce(
  new PublicAddress("6YokxrV0U2y6zg8FElk3Rb7j_jGolP28ZuMd6P2XXn0")
);

console.log(nonce instanceof BN); // true
console.log(nonce.toString()); // 10, given 10 previous transactions
```

### Get Block

Retrieves a particular block using one of several possible identifiers.

When passed a block hash, this method returns `null` if no matching block is found.
When passed a block number above the current block height, this method will return an error.

```ts
// accepts a base64Url string
const block = await pchain.getBlock(
  "iyJSh7SUwk-v1VoXt0YbZvCpqbxeSKWQ-o8xMkhvakU"
);

// or a Sha256Hash representing a block hash
import { Sha256Hash } from "pchain-types-js";
const block = await pchain.getBlock(
  new Sha256Hash("iyJSh7SUwk-v1VoXt0YbZvCpqbxeSKWQ-o8xMkhvakU")
);
// returns null if the hash is unknown

// or a BN for blocknumber
const block = await pchain.getBlock(new BN("762049"));
// raises Error unknown block number if the number is out of range
```

By querying the transactions included across successive blocks, it is possible to construct the history of the blockchain.

Here's a more detailed example of how we could query a single block for token transfers:

```ts
// the ExitStatus enum can help format human-readable values of a command's exit status
import { ExitStatus } from "pchain-types-js";

const block = await pchain.getBlock(new BN("749315"));
if (!block) {
  throw new Error("Block is not found");
}

const { blockHeader, transactions, receipts } = block;
console.log(blockHeader.hash.toBase64url());
// Prints: SLB4JfkeKtq6h9GHclW7RNHgq77kP1j23dR3-LqW1U8

// iterate through the block's transactions and respective commands and receipts
// every command has a matching receipt
for (let txIndex = 0; txIndex < transactions.length; txIndex++) {
  const txCommands = transactions[txIndex].commands;
  const txCommandReceipts = receipts[txIndex].command_receipts;

  for (let commandIdx = 0; commandIdx < txCommands.length; commandIdx++) {
    const command = txCommands[commandIdx];

    // the second check for the "enum" property is optional
    if (command.transfer && command.enum === "transfer") {
      console.log("Found a token transfer...");
      const transfer = command.transfer;
      const { recipient, amount } = transfer;

      console.log(recipient.toBase64url());
      // Prints: mC23wtyCuuku5jK6AHnHmYPE3YHXaBh1WZbR3bOmMJQ
      console.log(amount.toString());
      // Prints: 2000000000

      console.log("Finding matching receipt...");
      const matchingReceipt = txCommandReceipts[commandIdx];

      console.log(ExitStatus[matchingReceipt.exit_status]);
      // Prints: Success
      // optionally, the raw value is `exit_status` is the numeric enum, 0 in this case
      console.log(matchingReceipt.gas_used.toString());
      // Prints: 32820
    }
  }
}
```

### Get Contract Code

Retrieves the Wasm bytecode stored at a smart contract address.

Use this method to confirm that the desired smart contract bytecode was deployed to the blockchain.

```ts
// accepts either a base64Url string
const contractCode = await pchain.getContractCode(
  "ZxjCCuD8s5TEnXlbn9F7JMYmjNFMs5cGHSj21g9Ea0Y"
);

// or an instance of PublicAddress
const contractCode = await pchain.getContractCode(
  new PublicAddress("ZxjCCuD8s5TEnXlbn9F7JMYmjNFMs5cGHSj21g9Ea0Y")
);
if (contractCode === null) {
  throw new Error("Expected contract code");
}
console.log(contractCode);
// Prints Uint8Array(42761) [0,  97, 115, 109,  1, ....]
```

### Get Latest Committed Block

Retrieves the latest committed block on the blockchain, at the time of query.

Inspecting this block will provide information about the latest confirmed transactions (if any) and the height of the ParallelChain Mainnet blockchain.

```ts
const block = await pchain.getLatestCommittedBlock();
const { blockHeader, transactions, receipts } = block;

// note: exact responses will differ based on query time
// the following shows a sample response for a block with no new transactions
console.log(blockHeader.hash.toBase64url());
// Prints: DJLBAupobi2CXyqzbRdZjDnU-fiC-WGTfg1XgF9YYx4
console.log(blockHeader.height.toString());
// Prints: 763256
console.log(transactions);
// Prints: []
console.log(receipts);
// Prints: []
```

### Get Transaction

Retrieves a TransactionResult object given a transaction hash.

```ts
// accepts a base64Url string
const transactionResult = await pchain.getTransaction(
  "hRle-75dVeso4_dZxUQN5NFKQ2eoxm_wmHYySTGscOU"
);

// or any Sha256Hash representing a transaction hash
import { Sha256Hash } from "pchain-types-js";
const transactionResult = await pchain.getTransaction(
  new Sha256Hash("hRle-75dVeso4_dZxUQN5NFKQ2eoxm_wmHYySTGscOU")
);
```

Following is a demonstration of how we can parse a TransactionResult for relevant metadata and any transfers:

```ts
const transactionResult = await pchain.getTransaction(
  "hRle-75dVeso4_dZxUQN5NFKQ2eoxm_wmHYySTGscOU"
);

if (!transactionResult) {
  throw new Error("Transaction not found");
}

const { block_hash, position, transaction, receipt } = transactionResult;

console.log(block_hash.toBase64url());
// Prints: SLB4JfkeKtq6h9GHclW7RNHgq77kP1j23dR3-LqW1U8

// position describes the index of the transaction within the block
console.log(position);
// Prints: 0

console.log(transaction.signer.toBase64url());
// Prints: pveHxHcfPNRH-ljtu6kN7d6T5cTugjg8QauT0A8OkAU

const txCommands = transaction.commands;
const txCommandReceipts = receipt.command_receipts;

// iterate through transaction to detect any transfers
for (let commandIdx = 0; commandIdx < txCommands.length; commandIdx++) {
  const command = txCommands[commandIdx];

  // the second check for the "enum" property is optional
  if (command.transfer && command.enum === "transfer") {
    const transfer = command.transfer;
    const { recipient, amount } = transfer;

    console.log(recipient.toBase64url());
    // Prints: mC23wtyCuuku5jK6AHnHmYPE3YHXaBh1WZbR3bOmMJQ
    console.log(amount.toString());
    // Prints: 2000000000

    console.log("Finding matching receipt...");
    const matchingReceipt = txCommandReceipts[commandIdx];

    console.log(ExitStatus[matchingReceipt.exit_status]);
    // Prints: Success
    // optionally, the raw value is `exit_status` is the numeric enum, 0 in this case

    console.log(matchingReceipt.gas_used.toString());
    // Prints: 32820
  }
}
```

## Writing To PChain

### Submit And Confirm Transaction

Submits a signed transaction to the blockchain and wait for its confirmation.

Upon confirmation, the method will return the Receipt for the transaction. The Receipt contains an array of CommandReceipts, which individually indicate the ExitStatus and other data related to the executed commands.

```ts
import { ExitStatus, PublicAddress, Transfer } from "pchain-types-js";
// separately prepare the signingKeypair, nonce and toAddress
// use the buildTransaction helper method to create a signed transaction
const signedTx = await pchain
  .buildTransaction(signingKeypair, nonce)
  .addCommand(
    new Transfer({
      amount: new BN("99"),
      recipient: new PublicAddress(toAddress),
    })
  )
  .build();

const { command_receipts } = await pchain.submitAndConfirmTransaction(signedTx);

// for each command, we expect a separate receipt, in this case there is only 1
// compare against the Success value of the ExitStatus enum from 'pchain-types-js'
const { exit_status, return_values, logs } = command_receipts[0];
if (exit_status !== ExitStatus.Success) {
  throw new Error("Transaction execution failed");
}
console.log("Transfer successful");
```

### Submit Transaction

_N.B. In most cases, you probably want to use another method, e.g. submitAndConfirmTransaction() which waits for transaction confirmation, or convenience methods such as transferToken()._

Submits a signed transaction to the blockchain, without waiting for confirmation.

If accepted with no error, the method returns the transaction hash. The transaction is considered "pending" until included in a confirmed block. Note that developers will need to check for confirmation separately.

Otherwise, the method will throw an error indicating the reason, such as an incorrectly formed transaction payload.

```ts
import { PublicAddress, Transfer } from "pchain-types-js";
// separately prepare the signingKeypair nonce and toAddress
// use the buildTransaction helper method to create a signed transaction
const signedTx = await pchain
  .buildTransaction(signingKeypair, nonce)
  .addCommand(
    new Transfer({
      amount: new BN("99"),
      recipient: new PublicAddress(toAddress),
    })
  )
  .build();

const txHash = await pchain.submitTransaction(signedTx);
console.log("Transaction Submitted, transaction hash is", txHash.toBase64url());
// at this point, the transaction is still not confirmed
// query for confirmation separately
```

## Convenience Methods

### Build Contract Address

Compute the address of a deployed smart contract, given the deployer's public key and nonce of the deployment transaction.

```ts
const contractAddress = pchain.buildContractAddress(
  new PublicAddress("oK8Kvd-2cWYloQaPNlGtG3Q5dV6JFKzVrXOAhBRt5hs"),
  new BN("47987")
);
console.log(contractAddress.toBase64url());
// Prints: lu-2SF7uOB5EBNLGFkLWHzieJ4BNqxQJ48sQiRpzj90
```

### Build Transaction

_N.B. The method is asynchronous due to the nature of the signature verification, please call using `await`._

Helper method to build and sign a transaction, which can be passed to `submitAndConfirmTransaction()`.

The method requires at least one of the following commands which can be imported from `pchain-types-js`.

- Transfer
- Deploy
- Call
- CreateDeposit
- SetDepositSettings
- TopUpDeposit
- WithdrawDeposit
- StakeDeposit
- UnstakeDeposit

Gas-related limits are defaulted but can be overridden.

The following example uses the Deploy command to deploy a smart contract.

```ts
// build a Transaction to deploy a smart contract
// prepare the bytes of the .wasm contract (wasmBytes parameter) separately
import { Deploy } from "pchain-types-js";

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

const { command_receipts: deployCommandReceipts } =
  await pchain.submitAndConfirmTransaction(deployTx);

console.log(deployCommandReceipts[0].exit_status);
// Prints: "0", indicating success
```

### Call Contract State Change

Convenience method for calling a smart contract method that changes the blockchain state.

Under the hood, this method creates a transaction with the Call command. It is required to provide a signing keypair and specify the gas limit for the call.

```ts
// pre-deployed instance of the HelloContract on Testnet
// contract code: https://github.com/parallelchain-io/example-smart-contracts/blob/main/chapter_1/src/lib.rs
const contractAddress = "ZxjCCuD8s5TEnXlbn9F7JMYmjNFMs5cGHSj21g9Ea0Y";

// pass arguments based on the smart contract method signature
// refer to the smart contract code
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
  // note this an expensive contract method call as a demonstration, pass in a high gas limit
  new BN(250_000_000)
);

console.log(
  "Invoking method as a State Change method, Exit status:",
  stateChangeExitStatus
);
// Prints "Exit status: 0", i.e. Success

// the method does not return any value
// nor does it emit any logs, hence we expect these fields to be empty
console.log("Return values:", stateChangeReturnValues);
// Prints "Return values: Uint8Array(0) []"

console.log("Logs:", stateChangeReturnLogs);
// Prints "Logs: []"
```

### Call Contract View

Convenience method for calling a smart contract method through the view procedure.

The method in question must not write (store) any data to the blockchain and is called in a read-only way.

```ts
import { BinaryReader } from "pchain-types-js";

// pre-deployed instance of the HelloContract on Testnet
// contract code: https://github.com/parallelchain-io/example-smart-contracts/blob/main/chapter_1/src/lib.rs
const contractAddress = "ZxjCCuD8s5TEnXlbn9F7JMYmjNFMs5cGHSj21g9Ea0Y";

// pass arguments based on the smart contract method signature
// refer to the smart contract code
const { exit_status, return_values } = await pchain.callContractView(
  contractAddress,
  "i_say_hello",
  null
);

console.log(exit_status);
// Prints 0, i.e. Success

// use the BinaryReader class (from pchain-types-js) to decode the return value of type String
console.log(new BinaryReader(Buffer.from(return_values)).readString());
// Prints "you say world!"
```

### Transfer Token

Convenience method for transferring tokens to a designated address.

The method returns the transaction hash if the transfer succeeded, throwing an error otherwise. Note that you will need to pass a signing key pair.
Behind the scenes, a default gas fee has been set that is sufficient to pay for the basic transfer.

```ts
// accepted address formats include a string, or a PublicAddress instance
// here we use a string for convenience
const transactionHash = await pchain.transferToken(
  toAddress,
  new BN("99"),
  signingKeypair
);

console.log(
  `Token transfer completed with tx hash ${transactionHash.toBase64url()}`
);
// use the getAccountBalance method to validate the updated balance
const afterBalance = await pchain.getAccountBalance(toAddress);
console.log(`After balance is ${afterBalance.toString()}`);
```
