import BN from "bn.js";
import { Client } from "pchain-client-js";
import {
  AccountWithContract,
  AccountWithoutContract,
  Block,
  BlockHashByHeightRequest,
  BlockRequest,
  PublicAddress,
  Sha256Hash,
  StateRequest,
  TransactionRequest,
} from "pchain-types-js";
import { base64UrlToBase64 } from "./utils/encoding";
import { TransactionResult } from "./types";

export class PChainReader {
  private pchain_client: Client;
  constructor(endpoint: string) {
    this.pchain_client = new Client(endpoint);
  }

  //
  // Address-related queries
  //
  async getAccountBalance(address: string | PublicAddress): Promise<BN> {
    const account = await this.getAccount(address, false);
    if (account === null) {
      // an account not associated with any transfer conceptually has zero balance
      return new BN(0);
    }
    return account.balance;
  }

  async getAccountNonce(address: string | PublicAddress): Promise<BN> {
    const account = await this.getAccount(address, false);
    if (account === null) {
      // an account which is not associated with any user action conceptually has a zero nonce
      return new BN(0);
    }
    return account.nonce;
  }

  async getContractCode(
    contractAddress: string | PublicAddress
  ): Promise<Uint8Array | null> {
    const contractAccount = await this.getAccount(contractAddress, true);
    const { contract } = contractAccount as AccountWithContract;
    if (contract.value === null || !contract) {
      return null;
    }
    return contract.value;
  }

  //
  // Block-related queries
  //
  async getBlock(id: BN | string | Sha256Hash): Promise<Block | null> {
    let blockHash: any;

    if (id instanceof BN) {
      const blockHashResponse = (
        await this.pchain_client.block_hash_by_height(
          new BlockHashByHeightRequest({
            block_height: id,
          })
        )
      ).block_hash;
      if (blockHashResponse.value === null) {
        throw new Error("Unknown block number");
      }
      blockHash = blockHashResponse.value;
    } else if (typeof id === "string") {
      blockHash = new Sha256Hash(base64UrlToBase64(id));
    } else if (id instanceof Sha256Hash) {
      blockHash = id;
    } else {
      throw new Error("Invalid block identifier");
    }
    return this.getBlockByHash(blockHash);
  }

  async getLatestCommittedBlock(): Promise<Block> {
    const blockHashResponse = (
      await this.pchain_client.highest_committed_block()
    ).block_hash;
    if (blockHashResponse.value === null) {
      throw new Error("Error fetching highest committed block");
    }
    const blockHash = blockHashResponse.value;
    const block = await this.getBlockByHash(blockHash);
    if (block === null) {
      throw new Error("Error fetching highest committed block");
    }
    return block;
  }

  //
  // Transaction-related queries
  //
  async getTransaction(
    hash: Sha256Hash | string
  ): Promise<TransactionResult | null> {
    if (typeof hash === "string") {
      hash = new Sha256Hash(hash);
    }
    const transactionResponse = await this.pchain_client.transaction(
      new TransactionRequest({ transaction_hash: hash, include_receipt: true })
    );

    // only consider a Transaction valid if all relevant fields are present
    if (
      transactionResponse.transaction.value == null ||
      transactionResponse.receipt.value == null ||
      transactionResponse.block_hash.value == null ||
      transactionResponse.position.value == null
    ) {
      return null;
    }
    return {
      transaction: transactionResponse.transaction.value,
      receipt: transactionResponse.receipt.value,
      block_hash: transactionResponse.block_hash.value,
      position: transactionResponse.position.value,
    };
  }

  //
  // private methods
  //
  private async getAccount(
    account_address: string | PublicAddress,
    includeContract: boolean
  ): Promise<AccountWithContract | AccountWithoutContract | null> {
    if (typeof account_address == "string") {
      account_address = new PublicAddress(base64UrlToBase64(account_address));
    }
    if (account_address.toBytes().length != 32) {
      throw Error(
        "Account input is not a valid 32-byte PublicAddress or equivalent string"
      );
    }

    const response = await this.pchain_client.state(
      new StateRequest({
        accounts: new Set([account_address]),
        include_contract: includeContract,
        storage_keys: new Map(),
      })
    );

    if (!response.accounts) {
      throw new Error("Error fetching account");
    }
    let target_account = null;
    for (const [addr, acct] of response.accounts) {
      if (addr.value.compare(account_address.value) === 0) {
        target_account = acct;
        break;
      }
    }

    if (target_account === null) {
      return null;
    }

    const { accountWithContract, accountWithoutContract } = target_account;
    const account = accountWithContract || accountWithoutContract;
    if (!account) {
      throw new Error("Error fetching account"); // malformed response
    }
    return account;
  }

  private async getBlockByHash(blockHash: Sha256Hash): Promise<Block | null> {
    const block_response = await this.pchain_client.block(
      new BlockRequest({
        block_hash: blockHash,
      })
    );
    return block_response.block.value;
  }
}
