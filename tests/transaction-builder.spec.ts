import BN from "bn.js";
import {
  BinaryWriter,
  Call,
  Command,
  Keypair,
  Option,
  PrivateKey,
  PublicAddress,
  Transaction,
  Transfer,
} from "pchain-types-js";

import { PChainTransactionBuilder } from "../src/transaction-builder";

import { expect } from "chai";

describe("PChainWriter Integration Tests", async () => {
  let signingKeypair: Keypair;

  beforeEach(() => {
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

  describe("Transaction Builder", () => {
    it("should build a transaction with a Transfer command correctly", async () => {
      const amount = new BN(100);
      const recipient = new PublicAddress(
        "uwNayTusG-6R3qzftWNmC_OIbpCf5i2pfaacHRd9058"
      );
      const nonce = new BN("10000");

      const expectedTx = await new Transaction({
        commands: [
          new Command({
            transfer: new Transfer({
              amount,
              recipient,
            }),
          }),
        ],
        priority_fee_per_gas: new BN(0),
        max_base_fee_per_gas: new BN(8),
        gas_limit: new BN(300_000), // sufficient to cover a basic transfer
        signer: signingKeypair.public_key,
        nonce: nonce,
      }).toSignedTx(signingKeypair);

      const tx = await new PChainTransactionBuilder(signingKeypair, nonce)
        .addCommand(
          new Transfer({
            amount,
            recipient,
          })
        )
        .build();

      expect(tx.serialize()).to.eql(expectedTx.serialize());
    });

    it("should build a transaction with a single Call Command correctly", async () => {
      const nonce = new BN("10000");
      const contractAddress = "ZxjCCuD8s5TEnXlbn9F7JMYmjNFMs5cGHSj21g9Ea0Y";
      const expectedTx = await new Transaction({
        commands: [
          new Command({
            call: new Call({
              target: new PublicAddress(contractAddress),
              method: "i_say_hello",
              args: new Option<Uint8Array[]>({ value: null }),
              amount: new Option<BN>({ value: null }),
            }),
          }),
        ],
        priority_fee_per_gas: new BN(0),
        max_base_fee_per_gas: new BN(8),
        gas_limit: new BN(3_000_000),
        signer: signingKeypair.public_key,
        nonce: nonce,
      }).toSignedTx(signingKeypair);

      const tx = await new PChainTransactionBuilder(signingKeypair, nonce)
        .addCommand(
          new Call({
            target: new PublicAddress(contractAddress),
            method: "i_say_hello",
            args: new Option<Uint8Array[]>({ value: null }),
            amount: new Option<BN>({ value: null }),
          })
        )
        .setGasLimit(new BN(3_000_000))
        .build();

      expect(tx.serialize()).to.eql(expectedTx.serialize());
    });

    it("should build a transaction with multiple Call Commands correctly", async () => {
      const helloFromNameParam = "parallelchain";
      const paramWriter = new BinaryWriter();
      paramWriter.writeString(helloFromNameParam);
      const serializedNameParam = paramWriter.toArray();

      const contractAddress = "ZxjCCuD8s5TEnXlbn9F7JMYmjNFMs5cGHSj21g9Ea0Y";
      const nonce = new BN("10000");

      const expectedTx = await new Transaction({
        commands: [
          new Command({
            call: new Call({
              target: new PublicAddress(contractAddress),
              method: "i_say_hello",
              args: new Option<Uint8Array[]>({ value: null }),
              amount: new Option<BN>({ value: null }),
            }),
          }),
          new Command({
            call: new Call({
              target: new PublicAddress(contractAddress),
              method: "hello_from",
              args: new Option<Uint8Array[]>({
                value: [serializedNameParam],
              }),
              amount: new Option<BN>({ value: null }),
            }),
          }),
        ],
        priority_fee_per_gas: new BN(0),
        max_base_fee_per_gas: new BN(8),
        gas_limit: new BN(3_000_000),
        signer: signingKeypair.public_key,
        nonce: nonce,
      }).toSignedTx(signingKeypair);

      const tx = await new PChainTransactionBuilder(signingKeypair, nonce)
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

      expect(tx.serialize()).to.eql(expectedTx.serialize());
    });
  });
});
