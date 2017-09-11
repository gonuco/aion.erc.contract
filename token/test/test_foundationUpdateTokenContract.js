let util = require('./util.js');
let foundation = require('./foundation_tools.js');

contract("Foundation", (accs) => {
  /**0
   * This test is written from the viewpoint of the foundation
   */
  let inst;

  // multimint
  const bits = [
    util.addressValue(accs[0], 100),
    util.addressValue(accs[1], 200)
  ];

  let totalSupply = 0;
  for (i = 0; i < bits.length; i++) {
    totalSupply += parseInt(bits[i].substr(42), 16);
  }
  console.log("tokensupply: " + totalSupply );

  it("should transfer owner from accs[0] to the accs[1]", (done) => {
    util.deployAll().then ( (c) => {
     inst = c;
     return c.ledger.owner.call();
    }).then( (res) => {
      console.log("ledger current owner : " + res);
      return c.token.owner.call();
    }).then( (res) => {
      console.log("token current owner : " + res);
      return c.controller.owner.call();
    }).then( (res) => {
      console.log("cotroller current owner : " + res);
      console.log("preffer transafer account : " + accs[1]);
      return c.ledger.changeOwner(accs[1]);
    }).then( (tx) => {
      return c.token.changeOwner(accs[1]);
    }).then( (tx) => {
      return c.controller.changeOwner(accs[1]);
    }).then( (tx) => {
      return c.ledger.acceptOwnership({from: accs[1]});
    }).then( (tx) => {
      return c.ledger.owner.call();
    }).then( (res) => {
      assert.equal(res, accs[1]);
      return c.token.acceptOwnership({from: accs[1]});
    }).then( (tx) => {
      return c.token.owner.call();
    }).then( (res) => {
      assert.equal(res, accs[1]);
      return c.controller.acceptOwnership({from: accs[1]});
    }).then( (tx) => {
      return c.controller.owner.call();
    }).then( (res) => {
      assert.equal(res, accs[1]);
      done();
    });
  })

  it("should the contract state nothing has been minted", (done) => {
    console.log("Checking ledger status");
      inst.ledger.totalSupply.call().then((res) => {
        assert.equal(res, 0);
      }).then( () => {
        inst.ledger.mintingNonce.call().then( (res) => {
          assert.equal(res, 0);
        });
      }).then( () => {
        inst.ledger.mintingStopped.call().then( (res) => {
          assert.equal(res, false);
        });
      }).then( () => {
        inst.ledger.finalized.call().then( (res) => {
          assert.equal(res, false);
        });
      }).then( () => {
        inst.ledger.controller.call().then( (res) => {
          assert.equal(res, inst.controller.address);
        });
      });

    console.log("Checking token status");
    inst.token.name.call().then((res) => {
        assert.equal(res, "FixMeBeforeDeploying");
    }).then(() => {
      inst.token.decimals.call().then((res) => {
        assert.equal(res, 8);
      });
    }).then(() => {
      inst.token.symbol.call().then((res) => {
        assert.equal(res, "FIXME");
      });
    }).then(() => {
      inst.token.controller.call().then((res) => {
        assert.equal(res, inst.controller.address);
        //done();
      });
    }).then(() => {
      inst.token.motd.call().then((res) => {
        assert.equal(res, "");
      });
    }).then(() => {
      inst.token.burnAddress.call().then((res) => {
        assert.equal(res, "0x0000000000000000000000000000000000000000");
      });
    }).then(() => {
      inst.token.burnable.call().then((res) => {
        assert.equal(res, false);
      });
    }).then(() => {
      inst.token.paused.call().then((res) => {
        assert.equal(res, false);
      });
    }).then( () => {
      inst.token.finalized.call().then( (res) => {
        assert.equal(res, false);
      });
    });

    console.log("Checking controller status");
    inst.controller.finalized.call().then((res) => {
        assert.equal(res, false);
    }).then(() => {
      inst.controller.ledger.call().then((res) => {
        assert.equal(res, inst.ledger.address);
      });
    }).then(() => {
      inst.controller.token.call().then((res) => {
        assert.equal(res, inst.token.address);
      });
    }).then(() => {
      inst.controller.burnAddress.call().then((res) => {
        assert.equal(res, "0x0000000000000000000000000000000000000000");
        done();
      });
    })
  });

  it("should pause the contract", (done) => {
    inst.token.pause({from: accs[1]}).then(() => {
      inst.token.paused.call().then((res) => {
        assert.equal(res, true);
        done();
      });
    });
  });

  it("should transfer the minted abt to minter", (done) => {
    inst.ledger.changeOwner(accs[2], {from: accs[1]}).then(() => {
      return inst.ledger.acceptOwnership({from: accs[2]});
    }).then((tx) => {
      return inst.ledger.owner.call();
    }).then((res) => {
      assert.equal(res, accs[2]);
      done();
    });
  });

  it("should be able to mint some tokens by the minter", (done) => {
    inst.ledger.multiMint(0, bits, {from: accs[2]}).then( () => {
      return inst.ledger.stopMinting({from: accs[2]});
    }).then(() => {
      return inst.ledger.mintingStopped.call();
    }).then( (res) => {
        assert.equal(res, true);
    }).then( () => {
      return inst.ledger.totalSupply.call();
    }).then( (res) => {
      assert.equal(res, totalSupply);
      done();
    });
  });

  it("should transfer the ledger back to the foundation", (done) => {
    inst.ledger.changeOwner(accs[1], {from: accs[2]}).then( () => {
      return inst.ledger.acceptOwnership({from: accs[1]});
    }).then( () => {
      return inst.ledger.owner.call();
    }).then( (res) => {
      assert.equal(res, accs[1]);
      done();
    });
  });

  it("verify the balance minted by minter", (done) => {
    inst.ledger.totalSupply.call().then( (res) => {
      assert.equal(res, totalSupply);
    }).then( () => {

      const val = parseInt(bits[0].substr(42), 16);
      const addr = bits[0].substr(0,42);
      console.log("addr: " + addr + " val: " + val);
      inst.ledger.balanceOf.call( addr ).then( (res) => {
        console.log("res: " + res);
        assert.equal(res, val);
      });

      const val1 = parseInt(bits[1].substr(42), 16);
      const addr1 = bits[1].substr(0,42);
      console.log("addr: " + addr1 + " val: " + val1);
      inst.ledger.balanceOf.call( addr1 ).then( (res1) => {
        console.log("res: " + res1);
        assert.equal(res1, val1);
      });

      done();
    });
  });

  it("unpause contract", (done) => {
    inst.token.unpause({from: accs[1]}).then(() => {
      inst.token.paused.call().then((res) => {
        assert.equal(res, false);
        done();
      });
    });
  });

  it("should pause the contract again before update tokenContract", (done) => {
    inst.token.pause({from: accs[1]}).then(() => {
      inst.token.paused.call().then((res) => {
        assert.equal(res, true);
        done();
      });
    });
  });

  var newToken;
  it("should deploy new token contract", (done) => {
    util.Token.new({from: accs[0]}).then((token) => {

      token.setController(inst.controller.address).then( () => {
        let params = [token.name(),
                      token.decimals(),
                      token.symbol(),
                      token.controller(),
                      token.motd(),
                      token.burnAddress(),
                      token.burnable()]

        Promise.all(params).then((params) => {
          console.log()
          assert.equal(params[0], 'FixMeBeforeDeploying');
          assert.equal(params[1], 8);
          assert.equal(params[2], 'FIXME');
          assert.equal(params[3], inst.controller.address);
          assert.equal(params[4], '');
          assert.equal(params[5], '0x0000000000000000000000000000000000000000');
          assert.equal(params[6], false);
        });
      });

      newToken = token;
      done();
    });
  });

  it ("should transafer new token contract owner", (done) => {
    newToken.changeOwner(accs[1],{from: accs[0]}).then( (tx) => {
      return newToken.changeOwner(accs[1],{from: accs[0]});
    }).then( (tx) => {
      return newToken.acceptOwnership({from: accs[1]});
    }).then( (tx) => {
      return newToken.owner.call();
    }).then( (res) => {
      assert.equal(res, accs[1]);
      done();
    });
  });

  it ("should assign new token contract address to controller", (done) => {
    inst.controller.setToken(newToken.address, {from: accs[1]}).then( () => {
      inst.controller.token.call().then( (tAddr) => {
        console.log("newToken.address: " + newToken.address);
        console.log("token.address in the controller: " + tAddr);
        assert.equal(tAddr, newToken.address);
      }).then( () => {
        return newToken.totalSupply.call();
      }).then( (res) => {
        assert.equal(res, totalSupply);
        done();
      });
    });
  });

  it ("should transfer balnce from user[1] to user[2]", (done) => {
      newToken.transfer(accs[1], 50, {from: accs[0]}).then( (res) => {

        // Can't get the fuction return value
        //assert.equal(res, true);

        inst.ledger.balanceOf.call( accs[0] ).then( (res) => {
          console.log("acc0 res: " + res);
          assert.equal(res, 50);
        });

        inst.ledger.balanceOf.call( accs[1] ).then( (res1) => {
          console.log("acc1 res: " + res1);
          assert.equal(res1, 250);
        });

        done();
      });
    });
});
