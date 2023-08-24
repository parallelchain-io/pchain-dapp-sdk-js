import { Client } from "pchain-client-js";
import {
  Call,
  CommandReceipt,
  ExitStatus,
  Keypair,
  Option,
  PublicAddress,
  Receipt,
  ReceiptResponse,
  Sha256Hash,
  SignedTx,
  SubmitTransactionError,
  SubmitTransactionRequest,
  TransactionPositionRequest,
  Transfer,
  ViewRequest,
} from "pchain-types-js";
import { poll, retryExponentialBackoff } from "./utils/async";
import BN from "bn.js";
import { PChainReader } from "./pchain-reader";
import { PChainTransactionBuilder } from "./transaction-builder";
import { base64UrlToBase64 } from "./utils/encoding";

export class PChainWriter {
  private pchain_client: Client;
  private endpoint: string;
  private pchainReader: PChainReader;
  constructor(endpoint: string) {
    this.pchain_client = new Client(endpoint);
    this.pchainReader = new PChainReader(endpoint);
    this.endpoint = endpoint;
  }

  //
  // Transaction-sending methods
  //
  async submitAndConfirmTransaction(signedTx: SignedTx): Promise<Receipt> {
    // implies polling timeout of 180 seconds
    const POLLING_MAX_NUMBER = 30;
    const POLLING_INTERVAL_MS = 6_000;

    const txHash = await this.submitTransaction(signedTx);

    console.log(
      "Transaction Submitted, transaction hash is",
      txHash.toBase64url()
    );
    console.log("Transaction Pending Confirmation, please wait...");

    // poll for committed transaction execution
    const executionResult = await poll(
      POLLING_MAX_NUMBER,
      POLLING_INTERVAL_MS,
      async () => {
        return this.pchain_client.receipt(
          new TransactionPositionRequest({ transaction_hash: txHash })
        );
      },
      (response: ReceiptResponse): boolean => {
        const { block_hash, receipt } = response;
        return block_hash.value !== null && receipt.value !== null;
      }
    );
    console.log(
      `Transaction Confirmed: block hash is ${executionResult.block_hash.value?.toBase64url()}`
    );

    return executionResult.receipt.value!;
  }

  async submitTransaction(signedTx: SignedTx): Promise<Sha256Hash> {
    const RETRY_MAX_NUMBER = 10;
    const RETRY_INTERVAL_MS = 500;
    const RETRY_BACKOFF_MULTIPLIER = 1.8;

    return retryExponentialBackoff(
      RETRY_MAX_NUMBER,
      RETRY_INTERVAL_MS,
      RETRY_BACKOFF_MULTIPLIER,
      async () => {
        const response = await this.pchain_client.submit_transaction(
          new SubmitTransactionRequest({ transaction: signedTx })
        );
        const error = response.error.value;
        if (error !== null) {
          switch (error) {
            case SubmitTransactionError.MempoolFull:
              // retry on Mempoolfull
              return null;
            case SubmitTransactionError.UnacceptableNonce:
              throw new Error("Nonce is no longer valid, please check");
            default:
              throw new Error(
                "Error with transaction payload, please check and retry"
              );
          }
        }
        return signedTx.hash;
      }
    );
  }

  //
  // Convenience Methods
  //
  async callContractView(
    contractAddress: string | PublicAddress,
    method: string,
    args: Uint8Array[] | null
  ): Promise<CommandReceipt> {
    if (typeof contractAddress === "string") {
      contractAddress = new PublicAddress(contractAddress);
    }
    const request = new ViewRequest({
      target: contractAddress,
      method: new TextEncoder().encode(method),
      args: new Option({ value: args }),
    });

    const response = await this.pchain_client.view(request);
    return response.receipt;
  }

  async callContractStateChange(
    contractAddress: string | PublicAddress,
    method: string,
    args: Uint8Array[] | null,
    amount: BN | null,
    keypair: Keypair,
    gasLimit: BN
  ): Promise<CommandReceipt> {
    if (typeof contractAddress === "string") {
      contractAddress = new PublicAddress(contractAddress);
    }
    const nonce = await new PChainReader(this.endpoint).getAccountNonce(
      keypair.public_key
    );

    const signedTx = await new PChainTransactionBuilder(keypair, nonce)
      .addCommand(
        new Call({
          target: contractAddress,
          method: method,
          args: new Option<Uint8Array[]>({ value: args }),
          amount: new Option<BN>({ value: amount }),
        })
      )
      .setGasLimit(gasLimit)
      .build();

    const { command_receipts } = await this.submitAndConfirmTransaction(
      signedTx
    );
    return command_receipts[0];
  }

  async transferToken(
    toAddress: PublicAddress | string,
    amount: BN,
    keypair: Keypair
  ): Promise<Sha256Hash> {
    if (typeof toAddress === "string") {
      toAddress = new PublicAddress(base64UrlToBase64(toAddress));
    }
    const nonce = await this.pchainReader.getAccountNonce(keypair.public_key);
    const signedTx = await new PChainTransactionBuilder(keypair, nonce)
      .addCommand(
        new Transfer({
          amount,
          recipient: toAddress,
        })
      )
      .build();

    const { command_receipts } = await this.submitAndConfirmTransaction(
      signedTx
    );
    if (command_receipts[0].exit_status === ExitStatus.Success) {
      return signedTx.hash;
    }
    throw new Error(
      "Transaction processed but token transfer failed, please check your parameters and try again"
    );
  }
}
