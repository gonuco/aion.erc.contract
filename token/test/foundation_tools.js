/**
 * Tools utilized by the foundation (hypothetically)
 * when maintaining and managing the contracts
 */
let util = require('./util.js');

let mintBatch = (accounts, fn) => {
  return new Promise((resolve, reject) => {
    let mintBatchHelper = (initial, nonce, accounts) => {
      console.log("mintBatch: minting " + initial);

      let i = initial;
      if (!(i < accounts.length)) {
        resolve();
        return;
      }
      let batchSize = 100;
      /**
       * Calculate the amount of mints per batch
       */
      let loopMax = Math.min(batchSize, accounts.length - i);
      let arr = []
      for (j = i; j < i + loopMax; j++) {
        //console.log("minting: " + accounts[j].addr + " value: " + accounts[j].value);
        //console.log("compressedform: " + util.addressValue(accounts[j].addr, accounts[j].value));
        arr.push(util.addressValue(accounts[j].addr, accounts[j].value));
      }

      fn(nonce, arr).then(() => {
        mintBatchHelper(i + batchSize, nonce + 1, accounts, fn, resolve);
      });
    }
    mintBatchHelper(0, 0, accounts, fn, resolve);
  });
}


/**
 * 
 * 
 * @param      accounts    accounts  matches the given accounts against the ledger records
 * @param      function    fn        The expected function to call 
 * @return     boolean               Returns whether the result was consistent or not
 */
let confirmBatch = (accounts, fn) => {
  return accounts.reduce((promise, acc) => {
    return promise.then(() => {
      return fn(acc);
    });
  }, Promise.resolve());
}


module.exports.mintBatch = mintBatch;
module.exports.confirmBatch = confirmBatch;