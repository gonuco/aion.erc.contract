let util = require('./util.js');
let foundation = require('./foundation_tools.js');

contract("Foundation", (accs) => {

  /**
   * This test is written from the viewpoint of the foundation
   */
  it("should handle an update to the ledger correctly", (done) => {
    util.deployAll().then((c) => {
      let newLedger = null;
      let oldControllerAddr = null;

      /**
       * Assume a successful deployment, the next step is to pretend
       * to set an initial state onto the contract, this involves
       * setting the balances for a multitude of users. The idea here is to
       * test a massive batch create from users
       */
      let mintMax = 1000;
      let mintAmount = 200; // seems to be the average amount of user
                              // other ICOs are getting
      /**
       * Generate user account address for each account, these will be
       * random addresses
       */
      let accounts = []
      for (i = 0; i < mintAmount; i++) {
        let _acc = {addr: null, value: null};
        let seed = Math.floor(Math.random() * 1000000);
        _acc.addr = web3.sha3(seed.toString()).substring(0, 42);
        _acc.value = Math.floor(Math.random()*(mintMax-1)+1);
        accounts.push(_acc);
      }

      let balanceOfWrapper = (acc) => {
        //console.log(acc);
        return new Promise((resolve, reject) => {
          c.ledger.balanceOf(acc.addr).then((res) => {
            //console.log("res.c[0]: " + res.c[0] + " acc.value: " + acc.value);
            if (res.c[0] == acc.value)
              resolve(acc.value);
            else
              reject("incorrect value");
          });
        });
      }

      // NOTE: uses Token to query instead of ledger!
      let balanceOfZeroWrapper = (acc) => {
        //console.log(acc);
        return new Promise((resolve, reject) => {
          c.token.balanceOf(acc.addr).then((res) => {
            //console.log("res.c[0]: " + res.c[0] + " acc.value: " + acc.value);
            if (res.c[0] == 0)
              resolve(acc.value);
            else
              reject("incorrect value");
          });
        });
      }

      /**
       * Migration related functions
       */
      let multiMintWrapper = (nonce, mintArr) => {
        return c.ledger.multiMint.sendTransaction(nonce, mintArr, {from: accs[1]});
      }


      foundation.mintBatch(accounts, c.ledger.multiMint).then(() => {
        return foundation.confirmBatch(accounts, balanceOfWrapper).then((res) => {
          console.log("successfully generated the ledger correctly");
        }).then(() => {
          /**
           * Now that all necessary initial state is set, swap out the ledger
           * and verify that all account balances are now reset to 0
           */
          return util.Ledger.new();
        }).then((ledgerInstance) => {
          newLedger = ledgerInstance;
        }).then(() => {
          return c.controller.setLedger(newLedger.address);
        }).then((txid) => {
          // it doesnt matter what accounts we send in, as long as its the same length
          console.log("confirming that accounts are set to 0");
          return foundation.confirmBatch(accounts, balanceOfZeroWrapper);
        }).then((txid) => {
          /**
           * Assume at this point, assume accs[1] is a minter and transfer ownership
           */
          return c.ledger.changeOwner(accs[1]);
        }).then((txid) => {
          return c.ledger.acceptOwnership.sendTransaction({from: accs[1]});
        }).then((txid) => {
          return foundation.mintBatch(accounts, multiMintWrapper);
        }).then((txid) => {
          console.log("successfully minted as minter");
          console.log("transferring ownership back to foundation")
        }).then((txid) => {
          return c.ledger.changeOwner.sendTransaction(accs[0], {from: accs[1]});
        }).then((txid) => {
          // ownership back to foundation
          return c.ledger.acceptOwnership();
        }).then((txid) => {
          return foundation.confirmBatch(accounts, balanceOfWrapper);
        }).then((txid) => {
          console.log("foundation completed check that balances are same");
          done();
        });
      });

    });
  });

  it("should be able to upgrade controller", (done) => {
    util.deployAll().then((c) => {
      c.ledger.multiMint(0, [util.addressValue(accs[0], 100)]).then((txid) => {
        return c.token.pause();
      }).then((txid) => {
        return artifacts.require('./Controller.sol').new();
      }).then((instance) => {
        assert.notEqual(instance.address, c.controller.address);
        c.controller = instance;

        return c.controller.setToken(c.token.address);
      }).then((txid) => {
        return c.controller.setLedger(c.ledger.address);
      }).then((txid) => {
        return c.token.setController(c.controller.address);
      }).then((txid) => {
        return c.ledger.setController(c.controller.address);
      }).then((txid) => {
        return c.token.balanceOf(accs[0]);
      }).then((ret) => {
        assert.equal(ret, 100);
        done();
      });
    });
  });

});
