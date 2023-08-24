import { Block, PublicAddress, Sha256Hash } from "pchain-types-js";
import { PChain } from "../src";
import { expect } from "chai";
import nock from "nock";
import BN from "bn.js";

import * as path from "path";
import * as fs from "fs";

describe("PChainReader Methods", async () => {
  let pchain: PChain;
  const rpcURL = "https://pchain-test-rpc02.parallelchain.io";

  beforeEach(() => {
    nock.restore();
    nock.activate();
    pchain = new PChain(rpcURL);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe("Address-related queries", () => {
    it("getAccountBalance should accept a base64URL account string and query the state RPC API", async () => {
      const interceptedRequest = nock(rpcURL)
        .post(
          "/state",
          "01000000e98a24c6b574536cbace0f0512593745bee3fe31a894fdbc66e31de8fd975e7d0000000000"
        )
        .reply(
          200,
          Buffer.from(
            "01000000e98a24c6b574536cbace0f0512593745bee3fe31a894fdbc66e31de8fd975e7d010a00000000000000395bec1e00000000000000000000f5a90f0ea25dd388d85d0306ad733146933fc8a291abbe5b2aff6dad914afcda",
            "hex"
          )
        );

      const balance = await pchain.getAccountBalance(
        "6YokxrV0U2y6zg8FElk3Rb7j_jGolP28ZuMd6P2XXn0"
      );

      expect(balance.toString()).to.eql("518806329");
      expect(interceptedRequest.isDone()).to.eql(true);
    });

    it("getAccountBalance should accept an instance of PublicAddress and query the state RPC API", async () => {
      const interceptedRequest = nock(rpcURL)
        .post(
          "/state",
          Buffer.from(
            "AQAAAJgtt8LcgrrpLuYyugB5x5mDxN2B12gYdVmW0d2zpjCUAAAAAAA=",
            "base64"
          ).toString("hex")
        )
        .reply(
          200,
          Buffer.from(
            "AQAAAJgtt8LcgrrpLuYyugB5x5mDxN2B12gYdVmW0d2zpjCUAZUAAAAAAAAA4H86QgAAAAAAAAAAAADAhOi1zRAUBwAsDrUVenweK7J3IbbGdILyOCyYosNw9A==",
            "base64"
          )
        );
      const balance = await pchain.getAccountBalance(
        new PublicAddress("mC23wtyCuuku5jK6AHnHmYPE3YHXaBh1WZbR3bOmMJQ")
      );

      expect(interceptedRequest.isDone()).to.eql(true);
      expect(balance.toString()).to.eql("1111130080");
    });

    it("getAccountNonce should accept a base64URL account string and query the state RPC API", async () => {
      const interceptedRequest = nock(rpcURL)
        .post(
          "/state",
          "01000000e98a24c6b574536cbace0f0512593745bee3fe31a894fdbc66e31de8fd975e7d0000000000"
        )
        .reply(
          200,
          Buffer.from(
            "01000000e98a24c6b574536cbace0f0512593745bee3fe31a894fdbc66e31de8fd975e7d010a00000000000000395bec1e00000000000000000000f5a90f0ea25dd388d85d0306ad733146933fc8a291abbe5b2aff6dad914afcda",
            "hex"
          )
        );

      const nonce = await pchain.getAccountNonce(
        "6YokxrV0U2y6zg8FElk3Rb7j_jGolP28ZuMd6P2XXn0"
      );

      expect(nonce.toString()).to.eql("10");
      expect(interceptedRequest.isDone()).to.eql(true);
    });

    it("getAccountNonce should accept an instance of PublicAddress and query the state RPC API", async () => {
      const interceptedRequest = nock(rpcURL)
        .post(
          "/state",
          Buffer.from(
            "AQAAAJgtt8LcgrrpLuYyugB5x5mDxN2B12gYdVmW0d2zpjCUAAAAAAA=",
            "base64"
          ).toString("hex")
        )
        .reply(
          200,
          Buffer.from(
            "AQAAAJgtt8LcgrrpLuYyugB5x5mDxN2B12gYdVmW0d2zpjCUAZUAAAAAAAAA4H86QgAAAAAAAAAAAADAhOi1zRAUBwAsDrUVenweK7J3IbbGdILyOCyYosNw9A==",
            "base64"
          )
        );

      const nonce = await pchain.getAccountNonce(
        new PublicAddress("mC23wtyCuuku5jK6AHnHmYPE3YHXaBh1WZbR3bOmMJQ")
      );

      expect(interceptedRequest.isDone()).to.eql(true);
      expect(nonce.toString()).to.eql("149");
    });

    it("getContractCode should accept a base64URL string and query the state RPC API", async () => {
      const queryContractResponsePath = path.join(
        __dirname,
        "../fixtures/query_hello_contract_response.txt"
      );
      const queryContractResponse = Buffer.from(
        fs.readFileSync(queryContractResponsePath, "utf-8"),
        "base64"
      );

      const interceptedRequest = nock(rpcURL)
        .post(
          "/state",
          "010000006718c20ae0fcb394c49d795b9fd17b24c6268cd14cb397061d28f6d60f446b460100000000"
        )
        .reply(200, queryContractResponse);

      const contractPath = path.join(
        __dirname,
        "../fixtures/hello_contract.wasm"
      );
      const wasmBytes = fs.readFileSync(contractPath);

      const contractCode = await pchain.getContractCode(
        "ZxjCCuD8s5TEnXlbn9F7JMYmjNFMs5cGHSj21g9Ea0Y"
      );
      if (contractCode === null) {
        throw new Error("Expected contract code");
      }

      expect(Buffer.from(contractCode)).to.eql(wasmBytes);
      expect(interceptedRequest.isDone()).to.eql(true);
    });

    it("getContractCode should accept an instance of PublicAddress and query the state RPC API", async () => {
      const queryContractResponsePath = path.join(
        __dirname,
        "../fixtures/query_hello_contract_response.txt"
      );
      const queryContractResponse = Buffer.from(
        fs.readFileSync(queryContractResponsePath, "utf-8"),
        "base64"
      );

      const interceptedRequest = nock(rpcURL)
        .post(
          "/state",
          "010000006718c20ae0fcb394c49d795b9fd17b24c6268cd14cb397061d28f6d60f446b460100000000"
        )
        .reply(200, queryContractResponse);

      const contractPath = path.join(
        __dirname,
        "../fixtures/hello_contract.wasm"
      );
      const wasmBytes = fs.readFileSync(contractPath);

      const contractCode = await pchain.getContractCode(
        new PublicAddress("ZxjCCuD8s5TEnXlbn9F7JMYmjNFMs5cGHSj21g9Ea0Y")
      );
      if (contractCode === null) {
        throw new Error("Expected contract code");
      }

      expect(Buffer.from(contractCode)).to.eql(wasmBytes);
      expect(interceptedRequest.isDone()).to.eql(true);
    });
  });

  describe("Block-related queries", () => {
    it("getBlock should accept a SHA256Hash and query the block RPC API (block is null)", async () => {
      const interceptedBlockReq = nock(rpcURL)
        .post(
          "/block",
          "85195efbbe5d55eb28e3f759c5440de4d14a4367a8c66ff09876324931ac70e5"
        )
        .reply(200, Buffer.from("00", "hex"));

      const block = await pchain.getBlock(
        new Sha256Hash("hRle-75dVeso4_dZxUQN5NFKQ2eoxm_wmHYySTGscOU")
      );

      expect(interceptedBlockReq.isDone()).to.eql(true);
      expect(block).to.eql(null);
    });

    it("getBlock should accept a SHA256Hash and query the block RPC API (block is valid)", async () => {
      const interceptedBlockReq = nock(rpcURL)
        .post(
          "/block",
          "8b225287b494c24fafd55a17b7461b66f0a9a9bc5e48a590fa8f3132486f6a45"
        )
        .reply(
          200,
          Buffer.from(
            "018b225287b494c24fafd55a17b7461b66f0a9a9bc5e48a590fa8f3132486f6a45c1a00b000000000010270000000000000ba20b00000000006264efb70be1727adaa4ee06b8d90d9088e884a2c1ad67984e2996b4db6d4119000a00000001517b28987f8ab26f03d387b6d918a81dcedc564521450619350e69fcbcd3b06a58969d1f138830288e45b09990f3bd4712aa56ea93f46ead98aa6b70482a1707000119aa34a5529f0d76fd6ce12b5a090295d836daa2a4ee6d33495fd6bd3d0657ddb506f82d52b071c916bb738117578f9931a83aa3ec9bb4d6dc58da174458a70c0001ad1c39fb4200c78827b0b54c6af3376001c51c8b717ebac6eb1e078a978001ec346d86387dbc4c82409d64b0f6d23bf3202e146fb1520be99e4793031edff401013a2310ae63c204939c79c55b212f2ba2c3dc8d582f2abd5b7e030b5eb7c004ee590fcdb18ec83a75649cf9785fa9ec639b96fb720d72e5f853514fe9384de60e01de4bfe8e54a089e06477606ee6f2733915f08a0a347276804be1a7387066f96aac922963a78577a0d5702821e0743bf72c8d52a608df1cbaff34586eca5416070001e718ae030609e903990fda99f16cf5fc503865f2203d9bd2acb9e4637d3e9358e1f1016361f5ed7611332a1c8214665f8602ea1d651882579290da3bac2a4d0701adfe68dd9211975e0f5f0ff619a0a3ac6a74b751970fdf5a71f99d3153a623962fbd60b2bb43f0f3418882b2835df7ed477733163588900a3c6616cc91019a0369a83a629c46b50180cf5493d16e6cfec3e7a9947ae9d03ce3f85a450cb809c9102700000000000015293a4a985a1a4475193e2fbc2b69dbda412c58d35ef833bfdd87eaad3fcc41ffd7d564080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024dcf8365291d333bc07284ac383817c4cfb8671dc2d03951a3da499f7c927c5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "hex"
          )
        );

      const block = await pchain.getBlock(
        new Sha256Hash("iyJSh7SUwk-v1VoXt0YbZvCpqbxeSKWQ-o8xMkhvakU")
      );

      expect(interceptedBlockReq.isDone()).to.eql(true);
      expect(block).to.be.instanceOf(Block);

      const { blockHeader } = block!;
      expect(blockHeader.height.toString()).to.eql("762049");
    });

    it("getBlock should accept a base64URL string and query the block RPC API", async () => {
      const interceptedBlockReq = nock(rpcURL)
        .post(
          "/block",
          "85195efbbe5d55eb28e3f759c5440de4d14a4367a8c66ff09876324931ac70e5"
        )
        .reply(200, Buffer.from("00", "hex"));

      const block = await pchain.getBlock(
        "hRle-75dVeso4_dZxUQN5NFKQ2eoxm_wmHYySTGscOU"
      );

      expect(interceptedBlockReq.isDone()).to.eql(true);
      expect(block).to.eql(null);
    });

    it("getBlock should accept a BN representing the block number and query the block RPC API", async () => {
      const interceptedBlockHashReq = nock(rpcURL)
        .post(
          "/block_hash_by_height",
          "\u0003o\u000b\u0000\u0000\u0000\u0000\u0000"
        )
        .reply(
          200,
          Buffer.from(
            "036f0b00000000000148b07825f91e2adaba87d1877255bb44d1e0abbee43f58f6ddd477f8ba96d54f",
            "hex"
          )
        );

      const interceptedBlockReq = nock(rpcURL)
        .post(
          "/block",
          "48b07825f91e2adaba87d1877255bb44d1e0abbee43f58f6ddd477f8ba96d54f"
        )
        .reply(
          200,
          Buffer.from(
            "0148b07825f91e2adaba87d1877255bb44d1e0abbee43f58f6ddd477f8ba96d54f036f0b0000000000102700000000000049700b0000000000997378dc670cce1e7fb6feca7349780319bc56914c8c33805aa84f38ae039c79000a000000000172558674253ae6fa510eb5c47deb1a164072806a060959ea405700c15f25f78da8c3308d7169db943fe3ef81de6112e2ca16df8c9eb3741adc0421be9291860d01e24772c0b3f413adea48bc5498ade01827053eaed7ab0ca25839382723ecc7aa660c6ee9b2ecf775e462ef618c39f087a52972b408f0141df1626b1f850dda0c014dbe573a8612dbee8bacee8fdf83f1401830575bad2e2b05ea678205ee5197c2b06680a01d45740f3d2dc02bac11da521610e5adbe4a8340a5bcfafd587b9c050179cd1c4220af6d904d0d22e5afeeaf3587420b12bda43df95104032a5638700968fc9cfe6141c1bb1c9c8a5432eb7ba1e88f514c13a24fe9ec006ef2c7f0810a0001828472627b60c7f21cd7804c7a32ea8a8ab3695cb3cf3454975f42f1b5115fd7a6022453d619eb7c0d2f87e5257481c17a56647447bd6102768efdf7c6a7750e01192a6d118f3f43a55478020bfaf282df7de73812cc147ab4f290d4b760cb5d8af5fb7ca7e6729b06ff78ceef575e66f75464ada77af6eeef2bbb34195b691a0c01bc686c59738dc368b31498467320f858d860eea5892b1f3321b5bed7af0aab625295e645f8ae25f463b2fe6132e3a79bfac97e020743314a4a9857ba5b0f8a09013f75ce143a5223ee7ca6fa489eb4140709b78854d5bde442fdf2b1aca8f5083ef29380954478780ab68ab5e847b42bf83de56b4de9a49b7462c5883085d7d10a81925e03b83c98bf3b94200817db114838f199efb86942763c88bc0c17c23990102700000000000064f0407a92bfe3d49f03a58f3b922077f08de4e73ca84cca8c3dd76a8cfdff4256ffd3640800000000000000ce89020000000000de895d823802893e599d829b9f64700392689f831c7269dc28ee1e12d88b6b83b97453d6689c1d4b7ba2b54f89f68583906f39024b77d2b898d005a34cd6d31e8b9c78706604ad61c16efadff56908a5ca38748e17e9029eb47eb60c5eda8cf10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000a6f787c4771f3cd447fa58edbba90dedde93e5c4ee82383c41ab93d00f0e9005c1000000000000000100000000982db7c2dc82bae92ee632ba0079c79983c4dd81d76818755996d1ddb3a630940094357700000000e0f7050400000000080000000000000000000000000000004582384f6b6602d2080fc2279299548f5d4806e5d075d8cfc6b3fed39b6a0c3dcac0ee69f42fa25738af4fbc7d45eaae88ec4c42d7df66d555044bc5ce81680285195efbbe5d55eb28e3f759c5440de4d14a4367a8c66ff09876324931ac70e501000000010000000034800000000000000000000000000000",
            "hex"
          )
        );

      const block = await pchain.getBlock(new BN("749315"));
      if (!block) {
        throw new Error("Block is not found");
      }

      expect(interceptedBlockHashReq.isDone()).to.eql(true);
      expect(interceptedBlockReq.isDone()).to.eql(true);

      expect(block).to.be.instanceOf(Block);

      const { blockHeader, transactions, receipts } = block;
      expect(blockHeader.hash.toBase64url()).to.eql(
        "SLB4JfkeKtq6h9GHclW7RNHgq77kP1j23dR3-LqW1U8"
      );

      //
      // assert that there is only 1 command and 1 receipt in this block
      //
      expect(transactions.length).to.eql(1);
      expect(receipts.length).to.eql(1);

      expect(transactions[0].commands.length).to.eql(1);
      expect(receipts[0].command_receipts.length).to.eql(1);

      // iterate through block's transactions and respective commands and receipts
      // every command has a matching receipt
      for (let txIndex = 0; txIndex < transactions.length; txIndex++) {
        const txCommands = transactions[txIndex].commands;
        const txCommandReceipts = receipts[txIndex].command_receipts;

        for (let commandIdx = 0; commandIdx < txCommands.length; commandIdx++) {
          const command = txCommands[commandIdx];

          // the second check for the "enum" property is optional
          if (command.transfer && command.enum === "transfer") {
            const transfer = command.transfer;
            const { recipient, amount } = transfer;
            expect(recipient.toBase64url()).to.eql(
              "mC23wtyCuuku5jK6AHnHmYPE3YHXaBh1WZbR3bOmMJQ"
            );

            expect(amount.toString()).to.eql("2000000000");
            const matchingReceipt = txCommandReceipts[commandIdx];

            expect(matchingReceipt.exit_status).to.eql(0);

            expect(matchingReceipt.gas_used.toString()).to.eql("32820");
          }
        }
      }
    });

    it("getLatestCommittedBlock", async () => {
      const interceptedHighestBlockReq = nock(rpcURL)
        .get("/highest_committed_block")
        .reply(
          200,
          Buffer.from(
            "010c92c102ea686e2d825f2ab36d17598c39d4f9f882f961937e0d57805f58631e",
            "hex"
          )
        );

      const interceptedBlockReq = nock(rpcURL)
        .post(
          "/block",
          "0c92c102ea686e2d825f2ab36d17598c39d4f9f882f961937e0d57805f58631e"
        )
        .reply(
          200,
          Buffer.from(
            "010c92c102ea686e2d825f2ab36d17598c39d4f9f882f961937e0d57805f58631e78a50b00000000001027000000000000c2a60b000000000039445ca4de43fe0a220c13f1c85efb69e0ba2e4a8fa2f6ae5826a21abbd87d0e000a00000001db3620dad7431edb3aaff342a6f899bd7f50de5b85f16aae5a90ca5128b8ba6705444bb3dfb25df97864d6f338f844d5a108c185fce527b347b2c4d283d563020001d30291c0daf7eb2e0b1c95d4c986d5e1c4bd644e231672b9ea36266884356025554e3d304caa25f0e2a00cc38c4dd60266bea5543631a20bfc8f7142cb44ae000136267b6fed1ab2edfb3edad294d4a2c1c8d3adc1ef006cd3535029e7c42a439ff5245d628afb13f916714b56dbba37cb092049d123fd070617c445c4077240080001fe04447021279caabe0acd3ab7eb98c1f937996da9bda34ba30541b7379a20f9050cd2eebbd92617806ab82dfa88f11ca6133124204958a1d353ba6da3baf807013e8f50611f1cbf09427d29f3094122e26af657144a4899f911426d40b707731f3fd08f3e44d8fe0673ce39494ee66d716b8c7d90860f802e125198c7e4764c0801e66f2cee9228a2ff4c6dd0d3c6fb6cf08d475b5c7fe9e944bc196bfc45b2782fbafd6cd03cf6079a0b57fd3e0c23f36311cc72e5794bd97078796827313add0d01dcf01a8750ab6f2c8ad5d1a190bb6450a1e040cae9472483d175b8a366dba1ec7aaab0a34124ba0a2b1260f1e3349bae2d74c2bb6da547473de231bfcd2a46050005b31f5af9a15e3a4e0a8a5ea7aaa288ae87bfe80ab392f5c17cc52e457e5ee21027000000000000cef5c76be6cd2cf7328605b9718dd19861cec2ac2cccfe22eba4eda8d89943ae1405d664080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024dcf8365291d333bc07284ac383817c4cfb8671dc2d03951a3da499f7c927c5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "hex"
          )
        );

      const block = await pchain.getLatestCommittedBlock();
      const { blockHeader, transactions, receipts } = block;
      expect(block).to.be.instanceOf(Block);

      expect(blockHeader.hash.toBase64url()).to.eql(
        "DJLBAupobi2CXyqzbRdZjDnU-fiC-WGTfg1XgF9YYx4"
      );
      expect(blockHeader.height.toString()).to.eql("763256");
      expect(transactions.length).to.eql(0);
      expect(receipts.length).to.eql(0);

      expect(interceptedHighestBlockReq.isDone()).to.eql(true);
      expect(interceptedBlockReq.isDone()).to.eql(true);
    });
  });

  describe("Transaction-related queries", () => {
    it("getTransaction should accept a SHA256Hash and query the transaction RPC API", async () => {
      const interceptedTransactionReq = nock(rpcURL)
        .post(
          "/transaction",
          "85195efbbe5d55eb28e3f759c5440de4d14a4367a8c66ff09876324931ac70e501"
        )
        .reply(
          200,
          Buffer.from(
            "01a6f787c4771f3cd447fa58edbba90dedde93e5c4ee82383c41ab93d00f0e9005c1000000000000000100000000982db7c2dc82bae92ee632ba0079c79983c4dd81d76818755996d1ddb3a630940094357700000000e0f7050400000000080000000000000000000000000000004582384f6b6602d2080fc2279299548f5d4806e5d075d8cfc6b3fed39b6a0c3dcac0ee69f42fa25738af4fbc7d45eaae88ec4c42d7df66d555044bc5ce81680285195efbbe5d55eb28e3f759c5440de4d14a4367a8c66ff09876324931ac70e5010100000000348000000000000000000000000000000148b07825f91e2adaba87d1877255bb44d1e0abbee43f58f6ddd477f8ba96d54f0100000000",
            "hex"
          )
        );

      const transactionResult = await pchain.getTransaction(
        new Sha256Hash("hRle-75dVeso4_dZxUQN5NFKQ2eoxm_wmHYySTGscOU")
      );

      expect(interceptedTransactionReq.isDone()).to.eql(true);
      expect(transactionResult).to.not.eql(null);

      if (!transactionResult) {
        throw new Error("Transaction not found");
      }
      const { block_hash, position, transaction, receipt } = transactionResult;

      expect(block_hash.toBase64url()).to.eql(
        "SLB4JfkeKtq6h9GHclW7RNHgq77kP1j23dR3-LqW1U8"
      );
      expect(position).to.eql(0);
      expect(transaction.signer.toBase64url()).to.eql(
        "pveHxHcfPNRH-ljtu6kN7d6T5cTugjg8QauT0A8OkAU"
      );

      const txCommands = transaction.commands;
      const txCommandReceipts = receipt.command_receipts;

      // iterate through transaction to detect any transfers
      for (let commandIdx = 0; commandIdx < txCommands.length; commandIdx++) {
        const command = txCommands[commandIdx];

        // the second check for the "enum" property is optional
        if (command.transfer && command.enum === "transfer") {
          const transfer = command.transfer;
          const { recipient, amount } = transfer;
          expect(recipient.toBase64url()).to.eql(
            "mC23wtyCuuku5jK6AHnHmYPE3YHXaBh1WZbR3bOmMJQ"
          );

          expect(amount.toString()).to.eql("2000000000");

          const matchingReceipt = txCommandReceipts[commandIdx];

          expect(matchingReceipt.exit_status).to.eql(0);

          expect(matchingReceipt.gas_used.toString()).to.eql("32820");
        }
      }
    });

    it("getTransaction should accept a base64Url and query the transaction RPC API", async () => {
      const interceptedTransactionReq = nock(rpcURL)
        .post(
          "/transaction",
          "85195efbbe5d55eb28e3f759c5440de4d14a4367a8c66ff09876324931ac70e501"
        )
        .reply(
          200,
          Buffer.from(
            "01a6f787c4771f3cd447fa58edbba90dedde93e5c4ee82383c41ab93d00f0e9005c1000000000000000100000000982db7c2dc82bae92ee632ba0079c79983c4dd81d76818755996d1ddb3a630940094357700000000e0f7050400000000080000000000000000000000000000004582384f6b6602d2080fc2279299548f5d4806e5d075d8cfc6b3fed39b6a0c3dcac0ee69f42fa25738af4fbc7d45eaae88ec4c42d7df66d555044bc5ce81680285195efbbe5d55eb28e3f759c5440de4d14a4367a8c66ff09876324931ac70e5010100000000348000000000000000000000000000000148b07825f91e2adaba87d1877255bb44d1e0abbee43f58f6ddd477f8ba96d54f0100000000",
            "hex"
          )
        );

      const transactionResult = await pchain.getTransaction(
        "hRle-75dVeso4_dZxUQN5NFKQ2eoxm_wmHYySTGscOU"
      );

      if (!transactionResult) {
        throw new Error("Transaction not found");
      }

      expect(interceptedTransactionReq.isDone()).to.eql(true);
      expect(transactionResult.block_hash.toBase64url()).to.eql(
        "SLB4JfkeKtq6h9GHclW7RNHgq77kP1j23dR3-LqW1U8"
      );
      const txCommands = transactionResult.transaction.commands;
      expect(txCommands.length).to.eql(1);
    });
  });
});
