const BigNumber = require('bignumber.js');
const fs = require('fs');

let web3;
// let the user set an active web3
const setWeb3 = (w) => {
  web3 = w;
}

/**
 * Utility related
 */

const padLeft = (value, len) => {
  const hexLength = len * 2;
  if (value.length > len)
    return value;

  let outStr = value;
  for (i = 0; i < (hexLength - value.length); i++) {
    outStr = '0' + outStr;
  }
  return outStr;
}

const numberToAddress = (value) => {
  const s = value.toString(16);
  if (s.length > 20)
    throw "value too large";

  return padLeft(s, 20);
}

const logCSV = (name, costs) => {
  let out = "";
  for (let i = 0; i < costs.length; i++) {
    const c = costs[i];
    out +=  c.name +
            "," +
            c.gasUsed.toString() + 
            "," +
            c.eth.low.toString() +
            "," +
            c.eth.medium.toString() +
            "," +
            c.eth.high.toString() +
            "," +
            c.cad.low.toString() +
            "," +
            c.cad.medium.toString() +
            "," +
            c.cad.high.toString() +
            "\n";
  }
  fs.writeFile(name, out, (err) => {
    // do nothing
  });
}

/**
 * Generates the packed address value multiMint expects
 * 
 * TODO: this function should throw if anything goes wrong
 * since its our responsibility to ensure the input is correct.
 * This function or some variation of it must be unit tested in the future
 * to ensure safe functionality.
 *
 * @param      {string}    address  The address in hexidecimal string format with or without '0x'
 * @param      {number}    value    The numerical value of the intended value to mint
 * @return     {string}    The correctly formatted numerical value that maps to uint256
 */
const addressValue = (address, value) => {
  let hexValue = value.toString(16);
  if (hexValue.length > 24)
    throw "size too large";

  let paddedHexValue = padLeft(hexValue, 12);

  let headerIncluded = false;
  if (address.substring(0, 2) == '0x') {
    headerIncluded = true;
  }

  if (headerIncluded && !(address.length == 42))
    throw "address wrong length";

  if (!headerIncluded && !(address.length == 40))
    throw "address wrong length";

  return address + paddedHexValue;
}

/**
 * Searches for an event given the receipt of the transaction
 *
 * @param      {receipt}      receipt    The receipt
 * @param      {hexString}    signature  The signature
 * @return     {boolean}
 */
const searchForEvent = (receipt, signature) => {
  let hashed = web3.sha3(signature);
  for (i = 0; i < receipt.logs.length; i++) {
    let topics = receipt.logs[i].topics;
    for (j = 0; j < topics.length; j++) {
      let topic = topics[j];
      if (topic == hashed)
        return true;      
    }
  }
  return false;
}

/**
 * Deployment related functionality
 */

const deployMVC = async (Token, Controller, Ledger) => {
  if (Token == undefined)
    Token = artifacts.require("Token.sol");

  if (Controller == undefined)
    Controller = artifacts.require("Controller.sol");

  if (Ledger == undefined)
    Ledger = artifacts.require("Ledger.sol");

  const [t, c, l] = await Promise.all([Token.new(), Controller.new(), Ledger.new()]);
  await Promise.all([
    t.setController(c.address),
    c.setToken(t.address),
    c.setLedger(l.address),
    l.setController(c.address)
  ]);
  return {token: t, controller: c, ledger: l};
}

const mint = async (accounts, value, ledger) => {
  let mintList = [];
  for (let i = 0; i < accounts.length; i++) {
    mintList.push(addressValue(accounts[i], value));
  }
  await ledger.multiMint(0, mintList);
}

/**
 * Promise wrapper for tx getting mined
 * Starts filtering from 10 blocks before when called, until the latest.
 * 
 * Resolves on txHash find
 * Rejects after 50 blocks
 */
const transactionMined = (txHash) => {
  let latestBlock = web3.eth.blockNumber
  let p = new Promise((resolve, reject) => {
    let filter = web3.eth.filter({fromBlock: latestBlock - 10, toBlock: 'latest'});

    filter.watch((err, res) => {
      let block = web3.eth.getBlock(res.blockHash, true);
      for (j = 0; j < block.transactions.length; j++) {
        if (block.transactions[j].hash == txHash) {
          let tx = block.transactions[j];
          let receipt = web3.eth.getTransactionReceipt(tx.hash);
          filter.stopWatching();
          resolve({tx: tx, receipt: receipt});
        }
      }

      if ((res.blockNumber - latestBlock) > 50) {
        filter.stopWatching();
        reject("waited 50 blocks, no transaction response");
      }
    }); 
  });
  return p;
}

/**
 * Confirms that a transaction is mined, then confirms that said transaction
 * did not occur any invalid opcodes
 */
const confirmTransactionValid = (txHash) => {
  return new Promise((resolve, reject) => {
    transactionMined(txHash).then((res) => {
      return web3.debug.traceTransaction(res.hash);
    }, (err) => {
      reject(err);
    }).then((res) => {
      let lastOpError = res.structLogs[res.structLogs.length - 1].error
      if (error == "")
        resolve(null);
      else
        reject(lastOpError);
    });
  });
}

/**
 * Gas calculation related utilities
 */
const getContent = function(url) {
  // return new pending promise
  return new Promise((resolve, reject) => {
    // select http or https module, depending on reqested url
    const lib = url.startsWith('https') ? require('https') : require('http');
    const request = lib.get(url, (response) => {
      // handle http errors
      if (response.statusCode < 200 || response.statusCode > 299) {
         reject(new Error('Failed to load page, status code: ' + response.statusCode));
       }
      // temporary data holder
      const body = [];
      // on every content chunk, push it to the data array
      response.on('data', (chunk) => body.push(chunk));
      // we are done, resolve promise with those joined chunks
      response.on('end', () => resolve(body.join('')));
    });
    // handle connection errors of the request
    request.on('error', (err) => reject(err))
    });
};

const ethPrice = async () => {
  const price = 
    JSON.parse(
      await getContent("https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=CAD")
    ).CAD;

  return {
    CAD: new BigNumber(price)
  };
}

const gasPrices = async () => {
  const resp = JSON.parse(
    await getContent("https://api.blockcypher.com/v1/eth/main")
  );

  return {
    low: new BigNumber(resp.low_gas_price),
    medium: new BigNumber(resp.medium_gas_price),
    high: new BigNumber(resp.high_gas_price)
  };
}

const prices = async () => {
  const [gp, ep] = await Promise.all([gasPrices(), ethPrice()]);
  return {
    gas: gp,
    eth: ep
  };
}

/**
 * Estimates the gas of each contract function call.
 * Expects a truffle contract instance
 */
const cost = (txHash, price) => {
  const used = web3.eth.getTransactionReceipt(txHash);
  return gasCost(used.gasUsed, price);
}

/**
 * Calculates the gas, given the gas used
 */
const gasCost = (gasUsed, price) => {
  const ethUsed = {
    low: price.gas.low.times(gasUsed),
    medium: price.gas.medium.times(gasUsed),
    high: price.gas.high.times(gasUsed)
  };

  const cadUsed = {
    low: web3.fromWei(ethUsed.low, 'ether').times(price.eth.CAD),
    medium: web3.fromWei(ethUsed.medium, 'ether').times(price.eth.CAD),
    high: web3.fromWei(ethUsed.high, 'ether').times(price.eth.CAD)
  };

  return {
    gasUsed: gasUsed,
    eth: ethUsed,
    cad: cadUsed
  };
}

/**
 * Utilities
 */
module.exports.addressValue = addressValue;
module.exports.numberToAddress = numberToAddress;
module.exports.mint = mint;
module.exports.logCSV = logCSV;

/**
 * Deployment related
 */
module.exports.deployMVC = deployMVC;
module.exports.transactionMined = transactionMined;
module.exports.confirmTransactionValid = confirmTransactionValid;

/**
 * Gas related
 */
module.exports.ethPrice = ethPrice;
module.exports.gasPrices = gasPrices;
module.exports.request = getContent;
module.exports.prices = prices;
module.exports.cost = cost;
module.exports.gasCost = gasCost;
module.exports.setWeb3 = setWeb3;