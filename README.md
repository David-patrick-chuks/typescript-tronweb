[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit&logoColor=white)](https://github.com/pre-commit/pre-commit)
![GitHub CI](https://github.com/sterliakov/tronweb/actions/workflows/test.yml/badge.svg)
[![https://nodei.co/npm/@sterliakov/tstron.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/@sterliakov/tstron.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/@sterliakov/tstron)

## What is TSTron?

This project is a fork of [TronWeb](https://github.com/tronprotocol/tronweb/) library written in pure JavaScript. This library provides (almost) the same interface, but in completely typed context. Also there are several bugfixes introduced (they will be backported to original JS library, though). _This project was created as [Tron Grand Hackathon Session 3](https://trons3.devpost.com/) submission._

Temporarily I suggest that you refer to the original documentation - amount of backwards incompatible changes in this library is low.

**[Tron Web - Developer Document](https://developers.tron.network/docs/tronweb-1)**

## Compatibility

-   Version built for Node.js v12 and above
-   Version built for browsers with more than 0.25% market share

## Installation

### Node.js

```bash
npm install @sterliakov/tstron
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

## Licence

TronWeb is distributed under a MIT licence.

---

For more historic data, check the original repo at
[https://github.com/tronprotocol/tron-web](https://github.com/tronprotocol/tron-web)
