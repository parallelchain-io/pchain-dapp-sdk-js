# ParallelChain Mainnet DApp JavaScript SDK

This SDK aims to provide a convenient way JavaScript developers to transfer tokens or build DApps on the [Parallelchain Mainnet](https://github.com/parallelchain-io/parallelchain-protocol).

Please refer to the [usage guide](https://github.com/parallelchain-io/pchain-dapp-sdk-js/blob/main/USAGE-GUIDE.md) for details on the API methods provided.

Within the [`/examples`](https://github.com/parallelchain-io/pchain-dapp-sdk-js/tree/main/examples) folder, there are pre-written code samples that can be utilized to begin working on projects. For those who specialize in smart contracts, the [smart-contract-e2e sample](https://github.com/parallelchain-io/pchain-dapp-sdk-js/blob/main/examples/smart-contract-e2e.ts) provides a helpful starting point.

**Table of Contents**

- [Installation](#installation)

  - [Importing](#importing)
  - [Supported Node Versions](#supported-node-versions)

- [Getting Started](#getting-started)

  - [Running Examples](#running-examples)

- [Testing](#testing)

  - [Testing Setup](#testing-setup)
  - [Running Tests](#running-tests)

- [Detailed Usage](#detailed-usage)
- [Dependencies](#dependencies)
- [Support](#support)

## Installation

Install using `npm` or `yarn`.

```sh
$ npm install pchain-dapp-sdk-js
```

```sh
$ yarn add pchain-dapp-sdk-js
```

### Importing

**Lexical/ ES Modules/ TypeScript**

```ts
import { PChain } from "pchain-dapp-sdk-js";
```

**CommonJS**

```js
const { PChain } = require("pchain-dapp-sdk-js");
```

### Supported Node Versions

Node v16.x and above

## Getting Started

```ts
import { PChain } from "pchain-dapp-sdk-js";
const pchain = new PChain("https://pchain-test-rpc02.parallelchain.io");
const nonce = await pchain.getAccountNonce(
  "6YokxrV0U2y6zg8FElk3Rb7j_jGolP28ZuMd6P2XXn0"
);

console.log(nonce);
```

### Running Examples

Try out the pre-written code samples in the `/examples` folder using the following command:

```sh
npm run example -- <filepath>
```

For instance

```sh
npm run example -- './examples/smart-contract-e2e.ts'
```

## Testing

### Testing Setup

1. As some integration tests interact with Testnet, prepare an account and export the relevant private and public keys.  
   Please find detailed instructions at https://docs.parallelchain.io/getting_started/create_account/.

1. Create a local copy of the `.env` file by following the sample in `.env-example`.  
   Populate the file with your keys.

### Running Tests

```sh
npm run test
```

## Detailed Usage

For a detailed explanation and example of each method, please refer to the [usage guide](https://github.com/parallelchain-io/pchain-dapp-sdk-js/blob/main/USAGE-GUIDE.md).

## Dependencies

This library depends on [bn.js](https://www.npmjs.com/package/bn.js) for safe encoding of number values, as these could exceed `Number.MAX_SAFE_INTEGER` in JavaScript.

It also depends on related packages such as [`pchain-types-js`](https://github.com/parallelchain-io/pchain-types-js), which exposes the types and classes used to interact with PChain, as well as [`pchain-client-js`](https://github.com/parallelchain-io/pchain-client-js), which provides the base-level HTTP client to interact with the PChain RPC API.

Although included as part of this package, we also recommend that developers explicitly install `bn.js` and `pchain-types-js` as dependencies in their project `package.json`.

## Support

Spot any potential problem or wish to request a feature? [Please open an issue here](https://github.com/parallelchain-io/pchain-dapp-sdk-js/issues).
