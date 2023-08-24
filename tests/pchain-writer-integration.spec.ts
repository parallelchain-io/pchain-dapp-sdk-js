import {
  BinaryReader,
  BinaryWriter,
  Call,
  Deploy,
  ExitStatus,
  Keypair,
  Option,
  PrivateKey,
  PublicAddress,
  Sha256Hash,
  Transfer,
} from "pchain-types-js";

import * as path from "path";
import * as fs from "fs";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import BN from "bn.js";

import { PChain } from "../src";

chai.use(chaiAsPromised);

describe("PChainWriter Integration Tests", async () => {
  let pchain: PChain;
  let signingKeypair: Keypair;

  const testNetUrl = "https://pchain-test-rpc02.parallelchain.io";

  beforeEach(() => {
    pchain = new PChain(testNetUrl);

    if (!process.env.PUBLIC_KEY || !process.env.PRIVATE_KEY) {
      throw new Error(
        "Tests require PUBLIC_KEY and PRIVATE_KEY to be set in environment"
      );
    }
    signingKeypair = new Keypair(
      new PublicAddress(process.env.PUBLIC_KEY),
      new PrivateKey(process.env.PRIVATE_KEY)
    );
  });

  describe("Transaction Submission", () => {
    it("submitTransaction should throw an exception on a valid transaction payload with an invalid nonce", async () => {
      const invalidNonce: BN =
        (await pchain.getAccountNonce(signingKeypair.public_key)).toString() ===
        "0"
          ? new BN("999")
          : new BN("0");

      const toAddress = "uwNayTusG-6R3qzftWNmC_OIbpCf5i2pfaacHRd9058";

      const signedTx = await pchain
        .buildTransaction(signingKeypair, invalidNonce)
        .addCommand(
          new Transfer({
            amount: new BN("99"),
            recipient: new PublicAddress(toAddress),
          })
        )
        .build();

      expect(await signedTx.verifySignature(signingKeypair)).to.eql(true);
      await expect(pchain.submitTransaction(signedTx)).to.be.rejectedWith(
        "Nonce"
      );
    }).timeout(30_000);

    it("submitAndConfirmTransaction should submit and confirm a Deploy command", async () => {
      const nonce = await pchain.getAccountNonce(signingKeypair.public_key);
      const contractPath = path.join(
        __dirname,
        "../fixtures/hello_contract.wasm"
      );
      const wasmBytes = fs.readFileSync(contractPath);

      const signedTx = await pchain
        .buildTransaction(signingKeypair, nonce)
        .addCommand(
          new Deploy({
            contract: wasmBytes,
            cbi_version: 0, // current version is 0
          })
        )
        .setGasLimit(new BN(250_000_000))
        .build();

      const { command_receipts } = await pchain.submitAndConfirmTransaction(
        signedTx
      );

      expect(command_receipts.length).to.eql(1);
      expect(command_receipts[0].exit_status).to.eql(ExitStatus.Success);
      const contractAddress = pchain.buildContractAddress(
        signingKeypair.public_key,
        nonce
      );

      const contractCode = await pchain.getContractCode(contractAddress);
      if (!contractCode) {
        throw new Error("Contract not found");
      }

      expect(Buffer.from(contractCode)).to.eql(wasmBytes);
    }).timeout(90_000);

    it("submitAndConfirmTransaction should submit and confirm a Call command", async () => {
      const nonce = await pchain.getAccountNonce(signingKeypair.public_key);

      // Contract being called
      // https://github.com/parallelchain-io/example-smart-contracts/tree/main/chapter_1
      const contractAddress = "ZxjCCuD8s5TEnXlbn9F7JMYmjNFMs5cGHSj21g9Ea0Y";

      // prepare the args which will be used later
      const nameParamValue = "parallelchain";
      const paramWriter = new BinaryWriter();
      paramWriter.writeString(nameParamValue);
      const serializedNameParam = paramWriter.toArray();

      const signedTx = await pchain
        .buildTransaction(signingKeypair, nonce)
        .addCommand(
          new Call({
            target: new PublicAddress(contractAddress),
            method: "i_say_hello",
            args: new Option<Uint8Array[]>({ value: null }),
            amount: new Option<BN>({ value: null }),
          })
        )
        .addCommand(
          new Call({
            target: new PublicAddress(contractAddress),
            method: "hello_from",
            args: new Option<Uint8Array[]>({
              value: [serializedNameParam],
            }),
            amount: new Option<BN>({ value: null }),
          })
        )
        .setGasLimit(new BN(3_000_000))
        .build();

      const { command_receipts } = await pchain.submitAndConfirmTransaction(
        signedTx
      );

      expect(command_receipts.length).to.eql(2);

      const firstCommandReceipt = command_receipts[0];
      expect(firstCommandReceipt.exit_status).to.eql(ExitStatus.Success);

      const firstCommandReturnValue: string = new BinaryReader(
        Buffer.from(firstCommandReceipt.return_values)
      ).readString();
      expect(firstCommandReturnValue).to.eql("you say world!");

      const secondCommandReceipt = command_receipts[1];
      expect(secondCommandReceipt.exit_status).to.eql(ExitStatus.Success);

      const secondCommandReturnValue: number = new BinaryReader(
        Buffer.from(secondCommandReceipt.return_values)
      ).readU32();

      // logs are topic-value pairs in the form of a byte strings
      const secondCommandLogs = secondCommandReceipt.logs.map(
        ({ topic, value }) => ({
          topic: new TextDecoder().decode(topic),
          value: new TextDecoder().decode(value),
        })
      );
      expect(secondCommandLogs.length).to.eql(1);
      expect(secondCommandLogs[0].topic).to.eql("topic: Hello From");
      expect(secondCommandLogs[0].value).to.eql(
        "Hello, Contract. From: " + nameParamValue
      );

      expect(secondCommandReturnValue).to.eql(nameParamValue.length);
    }).timeout(90_000);
  });

  describe("Convenience Methods", () => {
    it("transferToken should submit and confirm a transaction transfer on the blockchain", async () => {
      const toAddress = "uwNayTusG-6R3qzftWNmC_OIbpCf5i2pfaacHRd9058";
      const transferAmt = "99";

      let beforeBalance = await pchain.getAccountBalance(toAddress);
      const transactionHash = await pchain.transferToken(
        new PublicAddress(toAddress),
        new BN(transferAmt),
        signingKeypair
      );
      let afterBalance = await pchain.getAccountBalance(toAddress);
      console.log(
        `Token transfer completed with tx hash ${transactionHash.toBase64url()}`
      );

      expect(transactionHash).to.be.instanceOf(Sha256Hash);
      expect(afterBalance.sub(beforeBalance).toString()).to.eql(transferAmt);

      // second transfer, using toAddress as a string
      beforeBalance = await pchain.getAccountBalance(toAddress);
      const transactionHashTwo = await pchain.transferToken(
        toAddress,
        new BN(transferAmt),
        signingKeypair
      );
      afterBalance = await pchain.getAccountBalance(toAddress);

      console.log(
        `Token transfer completed with tx hash ${transactionHashTwo.toBase64url()}`
      );
      expect(transactionHash).to.be.instanceOf(Sha256Hash);
      expect(afterBalance.sub(beforeBalance).toString()).to.eql(transferAmt);
    }).timeout(120_000);

    it("callContractView should call a contract view function", async () => {
      // Contract being called
      // https://github.com/parallelchain-io/example-smart-contracts/tree/main/chapter_1
      const contractAddress = "ZxjCCuD8s5TEnXlbn9F7JMYmjNFMs5cGHSj21g9Ea0Y";

      const { exit_status, return_values } = await pchain.callContractView(
        contractAddress,
        "i_say_hello",
        null
      );

      console.log(exit_status);
      console.log(new BinaryReader(Buffer.from(return_values)).readString());
      expect(exit_status).to.eql(ExitStatus.Success);
      expect(new BinaryReader(Buffer.from(return_values)).readString()).to.eql(
        "you say world!"
      );
    }).timeout(30_000);

    it("callContractStateChange should call a contract state change function", async () => {
      // Contract being called
      // https://github.com/parallelchain-io/example-smart-contracts/tree/main/chapter_1
      const contractAddress = "ZxjCCuD8s5TEnXlbn9F7JMYmjNFMs5cGHSj21g9Ea0Y";

      // method saves multiple values 10KB values to the blockchain
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

      expect(stateChangeExitStatus).to.eql(ExitStatus.Success);
      // method has no return value nor logs
      expect(stateChangeReturnValues).to.eql(new Uint8Array(0));
      expect(stateChangeReturnLogs).to.eql([]);
    }).timeout(90_000);
  });
});
