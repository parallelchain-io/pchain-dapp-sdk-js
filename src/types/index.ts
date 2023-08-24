import {
  Call,
  CreateDeposit,
  Deploy,
  Receipt,
  SetDepositSettings,
  Sha256Hash,
  StakeDeposit,
  TopUpDeposit,
  Transaction,
  Transfer,
  UnstakeDeposit,
  WithdrawDeposit,
} from "pchain-types-js";

export type TransactionResult = {
  transaction: Transaction;
  receipt: Receipt;
  block_hash: Sha256Hash;
  position: number;
};

export type SupportedCommands =
  | Transfer
  | Deploy
  | Call
  | CreateDeposit
  | SetDepositSettings
  | TopUpDeposit
  | WithdrawDeposit
  | StakeDeposit
  | UnstakeDeposit;
