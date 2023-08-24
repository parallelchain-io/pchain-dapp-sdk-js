import BN from "bn.js";
import {
  PublicAddress,
  BinaryWriter,
  generateSha256Hash,
} from "pchain-types-js";

export const computeContractAddress = (
  account_address: PublicAddress,
  nonce: BN
) => {
  if (nonce.lt(new BN(0))) {
    throw new Error("Cannot compute contract address with invalid nonce");
  }
  let preImage = new Uint8Array();
  const writer = new BinaryWriter();
  writer.writeU64(nonce);
  const serializedNonce = writer.toArray();
  preImage = new Uint8Array([
    ...preImage,
    ...account_address.toBytes(),
    ...serializedNonce,
  ]);
  return new PublicAddress(generateSha256Hash(preImage).toBytes());
};
