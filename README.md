<h1 align="center">
  <img align="center" src="https://raw.githubusercontent.com/tron-us/tronweb/master/assets/TronWeb-logo.png" width="400"/>
</h1>

<p align="center">
  <a href="https://discord.gg/FgvVFQgdCW">
    <img src="https://img.shields.io/badge/chat-on%20discord-brightgreen.svg">
  </a>

  <a href="https://github.com/tronprotocol/tronweb/issues">
    <img src="https://img.shields.io/github/issues/tron-us/tronweb.svg">
  </a>

  <a href="https://github.com/tronprotocol/tronweb/pulls">
    <img src="https://img.shields.io/github/issues-pr/tron-us/tronweb.svg">
  </a>

  <a href="https://github.com/tronprotocol/tronweb/graphs/contributors">
    <img src="https://img.shields.io/github/contributors/tron-us/tronweb.svg">
  </a>

  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/tron-us/tronweb.svg">
  </a>
</p>

## What is TronWeb?

**[Tron Web - Developer Document](https://developers.tron.network/docs/tronweb-1)**

TronWeb aims to deliver a unified, seamless development experience influenced by Ethereum's [Web3](https://github.com/ethereum/web3.js/) implementation. We have taken the core ideas and expanded upon it to unlock the functionality of TRON's unique feature set along with offering new tools for integrating DApps in the browser, Node.js and IoT devices.

## Compatibility

-   Version built for Node.js v6 and above
-   Version built for browsers with more than 0.25% market share

You can access either version specifically from the [dist](dist) folder.

TronWeb is also compatible with frontend frameworks such as:

-   Angular
-   React
-   Vue.

You can also ship TronWeb in a Chrome extension.

## Installation

### Node.js

```bash
npm install tronweb
```

or

```bash
yarn add tronweb
```

### Browser

First, don't use the release section of this repo, it has not updated in a long time.

Then easiest way to use TronWeb in a browser is to install it as above and copy the dist file to your working folder. For example:

```
cp node_modules/tronweb/dist/TronWeb.js ./js/tronweb.js
```

so that you can call it in your HTML page as

```
<script src="./js/tronweb.js"><script>
```

## Testnet

Shasta is the official Tron testnet. To use it use the following endpoint:

```
https://api.shasta.trongrid.io
```

Get some Shasta TRX at https://www.trongrid.io/shasta and play with it.
Anything you do should be explorable on https://shasta.tronscan.org

## Your local private network for heavy testing

You can set up your own private network, running Tron Quickstart. To do it you must [install Docker](https://docs.docker.com/install/) and, when ready, run a command like

```bash
docker run -it --rm \
  -p 9090:9090 \
  -e "defaultBalance=100000" \
  -e "showQueryString=true" \
  -e "showBody=true" \
  -e "formatJson=true" \
  --name tron \
  trontools/quickstart
```

[More details about Tron Quickstart on GitHub](https://github.com/tron-us/docker-tron-quickstart)

## Creating an Instance

First off, in your javascript file, define TronWeb:

```js
const TronWeb = require('tronweb');
```

When you instantiate TronWeb you can define

-   fullNode
-   solidityNode
-   eventServer
-   privateKey

you can also set a

-   fullHost

which works as a jolly. If you do so, though, the more precise specification has priority.
Supposing you are using a server which provides everything, like TronGrid, you can instantiate TronWeb as:

```js
const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: {'TRON-PRO-API-KEY': 'your api key'},
    privateKey: 'your private key',
});
```

For retro-compatibility, though, you can continue to use the old approach, where any parameter is passed separately:

```js
const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
tronWeb.setHeader({'TRON-PRO-API-KEY': 'your api key'});
```

If you are, for example, using a server as full and solidity node, and another server for the events, you can set it as:

```js
const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    eventServer: 'https://api.someotherevent.io',
    privateKey: 'your private key',
});
```

If you are using different servers for anything, you can do

```js
const tronWeb = new TronWeb({
    fullNode: 'https://some-node.tld',
    solidityNode: 'https://some-other-node.tld',
    eventServer: 'https://some-event-server.tld',
    privateKey: 'your private key',
});
```

## A full example

The better way to understand how to work with TronWeb is go to the demo directory in this repository.

If you'd like to connect with tronlink app and chrome extention and develop a dapp on tron, you could run the demo in path demo/tron-dapp-react-demo.

If you'd like to develop only with tronweb dependency, you could run the demo in path demo/tronweb-demo.

## Contributions

In order to contribute you can

-   fork this repo and clone it locally
-   install the dependencies — `npm i`
-   do your changes to the code
-   build the TronWeb dist files — `npm run build`
-   run a local private network using Tron Quickstart
-   run the tests — `npm test:node`
-   push your changes and open a pull request

## Recent History

**4.4.0**

-   Support `createRandom` and `fromMnemonic` function
-   Add `tronWeb.utils.message` lib, which includes `hashMessage`, `signMessage` and `verifyMessage`
-   Add `signMessageV2` and `verifyMessageV2` in `tronWeb.trx` lib which can support plain text signature and verification
-   Add `size` filter for event watch

**4.3.0**

-   Support `_signTypedData`

**4.2.0**

-   Add the name key when the `call()` and `send()` methods has only one return value
-   Optimize the `TriggerConstantContract()` method
-   Update `axios` to version 0.26.1
-   Update `karma` to version 6.3.17
-   Update `puppeteer` to version 13.5.1

**4.1.0**

-   Add `encodeParamsV2ByABI` and `decodeParamsV2ByABI` functions in `tronWeb.utils.abi` lib
-   Support abi v2 for `triggerSmartContract`, `createSmartContract`, `call` and `send` methods
-   Update `validator` to version 13.7.0
-   Update `axios` to version 0.24.0
-   Update discord group link

**4.0.1**

-   Set \_isConstant as true for call method
-   Ignore max feeLimit check
-   Change git repository url

**4.0.0**

-   Support `broadcastHex` method
-   Ignore fullnode version check when calling `createToken` method
-   Update dependencies version
-   Add strict mode for `pkToAddress` method

**3.2.7**

-   Add options `rawParameter` that format of the parameters method and args when creating or triggering a contract
-   Update `elliptic` to the latest version 6.5.4
-   Update `validator` to the latest version 13.6.0

**3.2.6**

-   Add setHeader function

**3.2.5**

-   Set feeLimit max value as 5000 TRX

**3.2.4**

-   Set feeLimit default value as 150 TRX

**3.2.3**

-   Support triggerSmartContract function with empty character functionSelector and empty array parameters
-   The triggerSmartContract function Support for anonymous contract parameter incoming

**3.2.2**

-   Set feeLimit default value as 40 TRX
-   The `createToken` method supports 0 in its precision

**3.1.0**

-   Update `elliptic` to the latest version 6.5.3
-   Update `ethers` to the latest version 5.0.8
-   Fix `loadAbi()`

**3.0.0**

-   Support sidechain for SunNetwork
-   Set feeLimit default value as 20 TRX

**2.10.2**

-   Support toHex function with a space and empty character as parameter
-   The sign function supports visible as true.
-   Fix delete the private key in test files
-   Fix start method returned from watch is undefined #45

**2.10.1**

-   Fix `trx.listExchangesPaginated`

**2.10.0**

-   Fix `trx.getTokenListByName`

**2.9.0**

-   Support smart contracts with function that requires an array of addresses as a parameter, included the constructor during the deployment

**2.8.1**

-   Add options `keepTxID` to show also the txID when triggering a contract with `shouldPollResponse`

**2.8.0**

-   Improve in the plugin architecture allows someone to implement a full lib at the same level of Trx and TransactionBuilder

**2.7.4**

-   Fix bugs of trx.getBrokerage and trx.getReward function

**2.7.3**

-   Support new apis related to Java-Tron 3.6.5
-   Original withdrawBlockRewards method support to withdraw user's reward

**2.6.8**

-   Support extension of transaction expiration
-   Allow to add data to the transaction
-   Many minor changes and fixes

**2.6.3**

-   Support get unconfirmed transaction function

**2.6.0**

-   Support trigger constant contract, clear abi and add account by id
-   Add permission id option in functions related to creating transaction
-   Support multi-sign without permission id

**2.5.6**

-   Reverse PR #6

**2.5.5**

-   Ignore `receiverAddress` during `freezeBalance` and `unfreezeBalance` if it is equal to the owner address

**2.5.4**

-   Adds cache in Trx to cache Contracts locally and make the process more efficient

**2.5.2**

-   Adds static methods `Trx.signString` and `Trx.verifySignature`

**2.5.0**

-   Allows freeBandwidth, freeBandwidthLimit, frozenAmount and frozenDuration to be zero

**2.3.7**

-   Get rid of jssha to reduce the size of the package a little bit.

**2.3.6**

-   Supports `/wallet/getapprovedlist` and `/wallet/getsignweight` JavaTron API.
-   Adds test for multi-sign workflow.

**2.3.5**

-   Fixes a typo in `#event.getEventsByContractAddress` naming.

**2.3.4**

-   Adds options to `#plugin.register` to pass parameters to `pluginInterface`.

**2.3.3**

-   Adds filters during event watching.

**2.3.2**

-   Removes mixed approach instantiating tronWeb. Before you could pass the servers as an object, and the privateKey as a separate parameter. Now, you pass them either in the options object or in the params.

**2.3.1**

-   Adds support for not-tld domain, like http://localhost
-   Improve the new format, allow passing the privateKey as a property in the option object

**2.3.0**

-   Introduces new format to instantiate tronWeb, passing an options object instead that `fullNode`, `solidityNode` and `eventServer` as separate params
-   Fixes bug in `_watch` which causes a continuous update of the `since` parameter

## Licence

TronWeb is distributed under a MIT licence.

---

For more historic data, check the original repo at
[https://github.com/tronprotocol/tron-web](https://github.com/tronprotocol/tron-web)
