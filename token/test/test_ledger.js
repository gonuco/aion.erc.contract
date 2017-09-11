let Controller = artifacts.require('./Controller.sol');
let Ledger = artifacts.require("./Ledger.sol");
let Token = artifacts.require("./Token.sol");
// web3 already loaded by truffle

let padLeft = function(value, len) {
  let hexLength = len * 2;
  if (value.length > len)
    return value;

  let outStr = value;
  for (i = 0; i < (hexLength - value.length); i++) {
    outStr = '0' + outStr;
  }
  return outStr;
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
let addressValue = function(address, value) {
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
 * Does all the dirtywork of setting up the contracts and
 * setting the controllers to eachother
 *
 * @return     {<type>}  { description_of_the_return_value }
 */
let deployAll = () => {
  p = new Promise((resolve, reject) => {
    c = {
      token: null,
      controller: null,
      ledger: null
    };

    Token.new().then((tokenInstance) => {
      Controller.new().then((controllerInstance) => {
        Ledger.new().then((ledgerInstance) => {
          c.token = tokenInstance;
          c.controller = controllerInstance;
          c.ledger = ledgerInstance;
        }).then(() => {
          return c.token.setController(c.controller.address);
        }).then((txid) => {
          return c.controller.setToken(c.token.address);
        }).then((txid) => {
          return c.controller.setLedger(c.ledger.address);
        }).then((txid) => {
          return c.ledger.setController(c.controller.address);
        }).then((txid) => {
          resolve(c);
        });
      });
    });
  });

  return p;
}

contract('Ledger', (accs) => {

  /**
   * Minting Suite
   */

  it("should mint one account with 100 tokens (correct nonce)", (done) => {
    deployAll().then((c) => {
      return c.ledger.multiMint(0, [addressValue(accs[0], 100)]);
    }).then((txid) => {
      return c.ledger.balanceOf(accs[0]);
    }).then((res) => {
      assert.equal(res.c[0], 100);
      done();
    });
  });

  it("should mint 10 accounts with values of 100*i", (done) => {
    deployAll().then((c) => {
      let mintList = []

      for (j = 0; j < 10; j++) {
        mintList.push(addressValue(accs[j], j*100));
      }

      c.ledger.multiMint(0, mintList).then((txid) => {
        return c.ledger.balanceOf(accs[0]);
      }).then((res) => {
        assert.equal(res.c[0], 0);
        return c.ledger.balanceOf(accs[1]);
      }).then((res) => {
        assert.equal(res.c[0], 100);
        return c.ledger.balanceOf(accs[2]);
      }).then((res) => {
        assert.equal(res.c[0], 200);
        return c.ledger.balanceOf(accs[3]);
      }).then((res) => {
        assert.equal(res.c[0], 300);
        return c.ledger.balanceOf(accs[4]);
      }).then((res) => {
        assert.equal(res.c[0], 400);
        return c.ledger.balanceOf(accs[5]);
      }).then((res) => {
        assert.equal(res.c[0], 500);
        return c.ledger.balanceOf(accs[6]);
      }).then((res) => {
        assert.equal(res.c[0], 600);
        return c.ledger.balanceOf(accs[7]);
      }).then((res) => {
        assert.equal(res.c[0], 700);
        return c.ledger.balanceOf(accs[8]);
      }).then((res) => {
        assert.equal(res.c[0], 800);
        return c.ledger.balanceOf(accs[9]);
      }).then((res) => {
        assert.equal(res.c[0], 900);
        done();
      });
    });
  });

  it("should fail trying to mint after minting disabled", (done) => {
    deployAll().then((c) => {
      c.ledger.stopMinting().then((txid) => {
        return c.ledger.multiMint(0, [addressValue(accs[0], 100)]);
      }).catch((err) => {
        console.log("caught error, trying to mint when minting disabled")
        done();
      });
    });
  });

  it("should fail trying to mint from not owner", (done) => {
    deployAll().then((c) => {
      return c.ledger.multiMint.sendTransaction(0, [addressValue(accs[1], 100)], {from: accs[1]});
    }).catch((err) => {
      console.log("caught error, trying to mint not as owner");
      done();
    });
  });

  it("should mint to an address containing leading zeroes", (done) => {
    let targetAddress = '0x0000000000000000000000000000000000000000';
    deployAll().then((c) => {
      c.ledger.multiMint(0, [addressValue(targetAddress, 100)]).then((txid) => {
        return c.ledger.balanceOf(targetAddress);
      }).then((res) => {
        assert.equal(res.c[0], 100);
        done();
      });
    });
  });

  it("should mint to the same account 10 times, each containing 100 tokens", (done) => {
    let targetAddress = '0x0000000000000000000000000000000000000000';
    deployAll().then((c) => {
      let mintList = [];
      for (j = 0; j < 10; j++) {
        mintList.push(addressValue(targetAddress, 100));
      }
      c.ledger.multiMint(0, mintList).then((txid) => {
        return c.ledger.balanceOf(targetAddress);
      }).then((res) => {
        assert.equal(res.c[0], 1000);
        done();
      });
    });
  });

  it("should not mint with the wrong nonce", (done) => {
    let targetAddress = '0x0000000000000000000000000000000000000000';
    deployAll().then((c) => {
      /**
       * This function does not fail, just returns without processing.
       * Assuming this is because of saving gas costs, but maybe we can
       * do with a revert in the future post Metropolis?
       */
      c.ledger.multiMint(1, [addressValue(targetAddress, 100)]).then((txid) => {
        return c.ledger.balanceOf(targetAddress);
      }).then((res) => {
        assert.equal(res.c[0], 0);
        done();
      });

    });
  });

  /**
   * TODO: we skip the transfer and approval suites because those need to be called down
   * from Token and Controller contracts.
   */

  /**
   * Finalize Suite
   */

  it("should not be able to modify controller after finalizing", (done) => {
    deployAll().then((c) => {
      c.ledger.finalize().then((txid) => {
        return c.ledger.setController(accs[0]);
      }).catch((err) => {
        console.log("caught error, cannot set controller after contract is finalized");
        done();
      });
    });
  });
});
