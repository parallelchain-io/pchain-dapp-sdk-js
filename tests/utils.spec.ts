import { expect } from "chai";
import { base64UrlToBase64, lowerCamelCase } from "../src/utils/encoding";
import { computeContractAddress } from "../src/utils/smart-contract";
import { PublicAddress } from "pchain-types-js";
import BN from "bn.js";

describe("Utils", async () => {
  describe("Encoding Utils", () => {
    it("base64UrlToBase64 should convert a base64URL string with '-' and '_' characters to base64 ", () => {
      const base64Url = "zfA7q0vwO8BUUo2X5DB7uq_-e7tnQoPKmC107U2y-0c";
      const base64 = "zfA7q0vwO8BUUo2X5DB7uq/+e7tnQoPKmC107U2y+0c";

      expect(base64UrlToBase64(base64Url)).to.equal(base64);
      expect(Buffer.from(base64Url, "base64url")).to.deep.equal(
        Buffer.from(base64, "base64")
      );
    });

    it("lowerCamelCase should convert a string to lower camel case", () => {
      expect(lowerCamelCase("SetDepositSettings")).to.eql("setDepositSettings");
    });
  });

  describe("Smart Contract Utils", () => {
    it("computeContractAddress should compute the contract address for a given input", () => {
      const addr = computeContractAddress(
        new PublicAddress("oK8Kvd-2cWYloQaPNlGtG3Q5dV6JFKzVrXOAhBRt5hs"),
        new BN("47987")
      );
      expect(addr?.toBase64url()).to.eql(
        "lu-2SF7uOB5EBNLGFkLWHzieJ4BNqxQJ48sQiRpzj90"
      );
    });
  });
});
