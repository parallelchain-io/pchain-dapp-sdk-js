import BN from "bn.js";
import { Command, Keypair, SignedTx, Transaction } from "pchain-types-js";
import { lowerCamelCase } from "./utils/encoding";
import { SupportedCommands } from "./types";

const MIN_BASE_FEE_PER_GAS = new BN(8);
const MAX_GAS_LIMIT = new BN(250_000_000);

export class PChainTransactionBuilder {
  private commands: Command[];
  private keypair: Keypair;
  private gasLimit: BN;
  private maxBaseFeePerGas: BN;
  private nonce: BN;
  private priorityFeePerGas: BN;

  constructor(keypair: Keypair, nonce: BN) {
    this.keypair = keypair;
    this.nonce = nonce;
    this.commands = [];
    this.gasLimit = new BN(300_000); // sufficient for a basic Transfer
    this.maxBaseFeePerGas = MIN_BASE_FEE_PER_GAS;
    this.priorityFeePerGas = new BN(0);
  }

  addCommand(command: SupportedCommands): this {
    this.commands.push(
      new Command({
        [lowerCamelCase(command.constructor.name)]: command,
      })
    );
    return this;
  }

  async build(): Promise<SignedTx> {
    if (this.commands.length < 1) {
      throw new Error("Transaction needs to include at least command");
    }

    const transaction = new Transaction({
      commands: this.commands,
      priority_fee_per_gas: this.priorityFeePerGas,
      max_base_fee_per_gas: this.maxBaseFeePerGas,
      gas_limit: this.gasLimit,
      signer: this.keypair.public_key,
      nonce: this.nonce,
    });
    const signedTx = await transaction.toSignedTx(this.keypair);
    if (!(await signedTx.verifySignature(this.keypair))) {
      throw new Error(
        "Unable to sign transaction with keypair, keypair possibly invalid"
      );
    }
    return signedTx;
  }

  setGasLimit(amount: BN) {
    if (amount.gt(MAX_GAS_LIMIT)) {
      throw new Error(
        `Gas limit cannot be greater than ${MAX_GAS_LIMIT.toString()}`
      );
    }
    this.gasLimit = amount;
    return this;
  }

  setMaxBaseFeePerGas(amount: BN) {
    if (amount.lt(MIN_BASE_FEE_PER_GAS)) {
      throw new Error(
        `Base fee per gas cannot be less than ${MIN_BASE_FEE_PER_GAS.toString()}`
      );
    }
    this.maxBaseFeePerGas = amount;
    return this;
  }

  setPriorityFeePerGas(amount: BN) {
    this.priorityFeePerGas = amount;
    return this;
  }
}
