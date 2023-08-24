import {
  Block,
  CommandReceipt,
  Keypair,
  PublicAddress,
  Receipt,
  Sha256Hash,
  SignedTx,
} from "pchain-types-js";
import { PChainReader } from "./pchain-reader";
import { PChainWriter } from "./pchain-writer";
import BN from "bn.js";
import { TransactionResult } from "./types";
import { PChainTransactionBuilder } from "./transaction-builder";
import { computeContractAddress } from "./utils/smart-contract";

export class PChain {
  private reader: PChainReader;
  private writer: PChainWriter;

  constructor(endpoint: string) {
    this.reader = new PChainReader(endpoint);
    this.writer = new PChainWriter(endpoint);
  }

  // READER
  /**
   * @param address account address in either base64Url string or PublicAddress instance
   */
  async getAccountBalance(address: string | PublicAddress): Promise<BN> {
    return this.reader.getAccountBalance(address);
  }

  /**
   * @param address account address in either base64Url string or PublicAddress instance
   */
  async getAccountNonce(address: string | PublicAddress): Promise<BN> {
    return this.reader.getAccountNonce(address);
  }

  /**
   * @param addressaccount address in either base64Url string or PublicAddress instance
   */
  async getContractCode(
    contractAddress: string | PublicAddress
  ): Promise<Uint8Array | null> {
    return this.reader.getContractCode(contractAddress);
  }

  /**
   * @param id block identifier which could be either a BN representation of the block number, Sha256Hash instance of the block hash, or base64Url string of the block hash
   */
  async getBlock(id: BN | string | Sha256Hash): Promise<Block | null> {
    return this.reader.getBlock(id);
  }

  /**
   */
  async getLatestCommittedBlock(): Promise<Block> {
    return this.reader.getLatestCommittedBlock();
  }

  /**
   * @param hash transaction hash either in Sha256Hash format or base64Url string
   */
  async getTransaction(
    hash: Sha256Hash | string
  ): Promise<TransactionResult | null> {
    return this.reader.getTransaction(hash);
  }

  // WRITER
  /**
   * @param signedTx a signed instance of Transaction
   */
  async submitAndConfirmTransaction(signedTx: SignedTx): Promise<Receipt> {
    return this.writer.submitAndConfirmTransaction(signedTx);
  }

  /**
   * @param signedTx a signed instance of Transaction
   */
  async submitTransaction(signedTx: SignedTx): Promise<Sha256Hash> {
    return this.writer.submitTransaction(signedTx);
  }

  // Convenience methods
  /**
   * @param keypair key pair of the signing account
   * @param nonce current nonce of the signing account in BN format
   */
  buildTransaction(keypair: Keypair, nonce: BN): PChainTransactionBuilder {
    return new PChainTransactionBuilder(keypair, nonce);
  }

  /**
   * @param address public key of the signing (deploying) account
   * @param nonce nonce of the transaction that deployed the smart contract
   */
  buildContractAddress(address: PublicAddress, nonce: BN): PublicAddress {
    return computeContractAddress(address, nonce);
  }

  /**
   * @param toAddress destination account as a PublicAddress or base64Url string
   * @param amount BN representing amount to transfer in grays
   * @param keypair key pair of the sending account
   */
  async transferToken(
    toAddress: PublicAddress | string,
    amount: BN,
    keypair: Keypair
  ): Promise<Sha256Hash> {
    return this.writer.transferToken(toAddress, amount, keypair);
  }

  /**
   * @param contractAddress contract address as a PublicAddress or base64Url string
   * @param method string of method name to call
   * @param args an array of arguments, each in Uint8Array format, e.g. [arg1, arg2, arg3...] or null if no arguments are required
   */
  async callContractView(
    contractAddress: string | PublicAddress,
    method: string,
    args: Uint8Array[] | null
  ): Promise<CommandReceipt> {
    return this.writer.callContractView(contractAddress, method, args);
  }

  /**
   * @param contractAddress contract address as a PublicAddress or base64Url string
   * @param method string of method name to call
   * @param args an array of arguments, each in Uint8Array format, e.g. [arg1, arg2, arg3...] or null if no arguments are required
   * @param amount BN representing amount to transfer in grays, if the contract call requires tokens to be transferred, null otherwise
   * @param keypair key pair of the sending account
   * @param gasLimit BN representing the gas limit for the contract call
   */
  async callContractStateChange(
    contractAddress: string | PublicAddress,
    method: string,
    args: Uint8Array[] | null,
    amount: BN | null,
    keypair: Keypair,
    gasLimit: BN
  ): Promise<CommandReceipt> {
    return this.writer.callContractStateChange(
      contractAddress,
      method,
      args,
      amount,
      keypair,
      gasLimit
    );
  }
}
