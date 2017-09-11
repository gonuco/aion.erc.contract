let util = require('./util.js');

/**
 * This test suite kind of acts like the system tests. Since most functionality
 * is accessible from the token contract.
 */
contract('Token', (accs) => {

  /**
   * Deployment state tests
   * (run these tests before we deploy the live contract)
   * These tests check that our assumed initial states are correct
   */

  it("should have the same burn address as controller and ledger", (done) => {
    util.deployAll().then((c) => {
      tokenBurnAddress = null;
      controllerBurnAddress = null;
      ledgerBurnAddress = null;
      c.token.burnAddress().then((res) => {
        tokenBurnAddress = res;
        return c.controller.burnAddress();
      }).then((res) => {
        controllerBurnAddress = res;
        return c.ledger.burnAddress();
      }).then((res) => {
        ledgerBurnAddress = res;
        assert.equal(tokenBurnAddress, controllerBurnAddress);
        assert.equal(controllerBurnAddress, ledgerBurnAddress);
        done();
      });
    });
  });

  it("should have the correct state when deployed", (done) => {
    util.Token.new().then((token) => {
      /*
      Assumed state:
      string constant public name = "FixMeBeforeDeploying";
      uint8 constant public decimals = 8;
      string constant public symbol = "FIXME";
      Controller public controller;
      */
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
        assert.equal(params[3], '0x0000000000000000000000000000000000000000');
        assert.equal(params[4], '');
        assert.equal(params[5], '0x0000000000000000000000000000000000000000');
        assert.equal(params[6], false);
        done();
      });
    });
  });

  /**
   * Transfer Test Suite
   */

  it("should transfer 100 tokens from account 0 to account 1", (done) => {
    util.deployAll().then((c) => {
      c.ledger.multiMint(0, [util.addressValue(accs[0], 100)]).then((txid) => {
        return c.token.transfer(accs[1], 100);
      }).then((txid) => {
        return c.token.balanceOf(accs[1]);
      }).then((res) => {
        assert.equal(res.c[0], 100);
        return c.token.balanceOf(accs[0]);
      }).then((res) => {
        assert.equal(res.c[0], 0);
        done();
      });
    });
  });

  it("should not be able to transfer more than owned value", (done) => {
    util.deployAll().then((c) => {
      c.token.transfer(accs[1], 1).then((txid) => {
        return c.token.balanceOf(accs[1]);
      }).then((res) => {
        assert.equal(res.c[0], 0);
        done();
      });
    });
  });

  it("should not be able to transfer while paused", (done) => {
    util.deployAll().then((c) => {
      c.token.pause().then((txid) => {
        return c.ledger.multiMint(0, [util.addressValue(accs[0], 100)]);
      }).then((txid) => {
        return c.token.balanceOf(accs[0]);
      }).then((res) => {
        console.log("initial accs[0] balance: " + res);
        assert.equal(res.c[0], 100);
        return;
      }).then(() => {
        return c.token.transfer(accs[1], 100);
      }).catch((err) => {
        console.log("error caught, cannot transfer while paused");
        return;
      }).then(() => {
        return c.token.unpause();
      }).then((txid) => {
        return c.token.transfer(accs[1], 100);
      }).then((txid) => {
        return c.token.balanceOf(accs[1]);
      }).then((res) => {
        assert.equal(res.c[0], 100);
        done();
      });
    });
  });

  it("should not be able to transfer un-approved value", (done) => {
    util.deployAll().then((c) => {
      c.ledger.multiMint(0, [util.addressValue(accs[0], 100)]).then((txid) => {
        return c.token.transferFrom.sendTransaction(accs[0], accs[1], 100, {from: accs[1]});
      }).then((txid) => {
        return c.token.balanceOf(accs[1]);
      }).then((res) => {
        assert.equal(res.c[0], 0);
        done();
      });
    });
  });

  /**
   * Approval Test Suite
   */

  it("should be able to approve a higher value than balance", (done) => {
    util.deployAll().then((c) => {
      c.ledger.multiMint(0, [util.addressValue(accs[0], 100)]).then((txid) => {
        return c.token.approve(accs[1], 200);
      }).then((txid) => {
        return c.token.allowance(accs[0], accs[1]);
      }).then((res) => {
        assert.equal(res.c[0], 200);
        done();
      });
    });
  });

  it("should not be able to approve once an approve value is already set", (done) => {
    let initialValue = 200;
    let secondaryValue = 300;

    util.deployAll().then((c) => {
      c.ledger.multiMint(0, [util.addressValue(accs[0], 100)]).then((txid) => {
        return c.token.approve(accs[1], initialValue);
      }).then((txid) => {
        return c.token.allowance(accs[0], accs[1]);
      }).then((res) => {
        assert.equal(res.c[0], initialValue);
      }).then(() => {
        return c.token.approve(accs[1], secondaryValue);
      }).then((txid) => {
        return c.token.allowance(accs[0], accs[1]);
      }).then((res) => {
        assert.equal(res.c[0], initialValue);
        done();
      });
    });
  });

  /**
   * Assuming:
   * 1) account 0 has 500 tokens
   * 2) account 0 wants to let account 1 spend 100 tokens
   * 3) account 1 tries to transfer 101 tokens to account 2
   */
  it("should not allow users to transfer higher than the approved value", (done) => {
    let actualBalance = 500;
    let approvedBalance = 100;

    util.deployAll().then((c) => {
      c.ledger.multiMint(0, [util.addressValue(accs[0], actualBalance)]).then((txid) => {
        return c.token.approve(accs[1], approvedBalance);
      }).then((txid) => {
        return c.token.transferFrom(accs[0], accs[2], 101);
      }).then((txid) => {
        // our check is based on the event being emit on a successful transfer
        for (j = 0; j < txid.logs.length; j++) {
          if (txid.logs[j].event == 'Transfer')
            assert.fail("Transfer event found, should not have been successful");
        }
        done();
      });
    });
  });


  it("should not allow users to transfer higher than the balance", (done) => {
    let actualBalance = 100;
    let approvedBalance = 500;

    util.deployAll().then((c) => {
      c.ledger.multiMint(0, [util.addressValue(accs[0], actualBalance)]).then((txid) => {
        return c.token.approve(accs[1], approvedBalance);
      }).then((txid) => {
        return c.token.transferFrom(accs[0], accs[2], approvedBalance);
      }).then((txid) => {
        for (j = 0; j < txid.logs.length; j++) {
          if (txid.logs[i].event == 'Transfer')
            assert.fail("Transfer event found, should not have been successful");
        }
        done();
      });
    });
  });


  it("should allow re-approval after allowance has been spent", (done) => {
    let approvedBalance = 500;

    util.deployAll().then((c) => {
      c.ledger.multiMint(0, [util.addressValue(accs[0], approvedBalance)]).then((txid) => {
        c.token.approve(accs[1], 100);
      }).then(() => {
        return c.token.transferFrom.sendTransaction(accs[0], accs[2], 100, {from: accs[1]});
      }).then((txid) => {
        let receipt = web3.eth.getTransactionReceipt(txid);
        if (!util.searchForEvent(receipt, "Transfer(address,address,uint256)")) {
          assert.fail("expected transfer");
        }
      }).then(() => {
        return c.token.allowance(accs[0], accs[1]);
      }).then((res) => {
        assert.equal(res.c[0], 0);
      }).then(() => {
        c.token.approve(accs[1], 100);
      }).then(() => {
        return c.token.transferFrom.sendTransaction(accs[0], accs[2], 100, {from: accs[1]});
      }).then((txid) => {
        let finalState = [
          c.token.balanceOf(accs[0]),
          c.token.balanceOf(accs[1]),
          c.token.balanceOf(accs[2]),
          c.token.allowance(accs[0], accs[1])
        ];

        Promise.all(finalState).then((states) => {
          assert.equal(states[0].c[0], 300);
          assert.equal(states[1].c[0], 0);
          assert.equal(states[2].c[0], 200);
          assert.equal(states[3].c[0], 0);
          done();
        });
      });
    });
  });

  /**
   * Added to confirm increase/decreaseApproval functionality
   * Should confirm that:
   * 
   * 1) decreaseApproval is not vulnerable to timing attacks, in this form:
   * 
   * Allowance(A, B) = 100
   * A wants to decrease to 0
   * A sends decreaseApproval(100)
   * B captures this message and immediately publishes a spend for 50
   * 
   * This can be successful, B can spend before A deducts, but As 
   * decrease in allowance should still go through with the floor at 0.
   */
  it("should floor the approval to 0 given a decreaseApproval > currentApproval", (done) => {
    // so we only trigger done() once
    completed = false;

    util.deployAll().then((c) => {
      // no need to multiMint, we just want to test approval
      c.token.approve(accs[1], 100);
    }).then(() => {
      c.token.decreaseApproval(accs[1], 200);
    }).then(() => {
      return c.token.allowance(accs[0], accs[1]);
    }, (err) => {
      assert.fail("decreaseApproval should not cause a throw");
      completed = true;
      done();
    }).then((res) => {
      assert.equal(res.c[0], 0);
      
      if (!completed)
        done();
    });
  });

  /**
   * Burning Test Suite
   */

  /**
   * Assuming:
   * 1) multiMint is working
   * 2) contracts are all linked and deployed properly
   */
  it("should burn tokens and emit the a ControllerBurn event", (done) => {
    let defaultBurnAddress = '0x0000000000000000000000000000000000000000';
    let otherNetworkAddress = '0x00000000000000000000000000000000000000000000000000000000deadbeef';

    util.deployAll().then((c) => {
      let controllerBurnEvent = c.controller.ControllerBurn();

      c.ledger.multiMint(0, [util.addressValue(accs[0], 100)]).then((txid) => {
        return c.controller.enableBurning()
      }).then((txid) => {
        return c.token.burn(otherNetworkAddress, 99);
      }).then((txid) => {
        return controllerBurnEvent.get();
      }).then((events) => {
        assert.equal(events[0].args.from, accs[0]);
        assert.equal(events[0].args.to, otherNetworkAddress);
        assert.equal(events[0].args.value.c[0], 99);
      }).then(() => {
        // now we need to check that the balances are correctly put
        return c.token.balanceOf(accs[0]);
      }).then((res) => {
        assert.equal(res.c[0], 1);
      }).then(() => {
        return c.token.balanceOf(defaultBurnAddress);
      }).then((res) => {
        assert.equal(res.c[0], 99);
        done();
      });
    });
  });

  it("should not be able to burn tokens if not burn enabled", (done) => {
    let defaultBurnAddress = '0x0000000000000000000000000000000000000000';
    let otherNetworkAddress = '0x00000000000000000000000000000000000000000000000000000000deadbeef';

    util.deployAll().then((c) => {

      c.ledger.multiMint(0, [util.addressValue(accs[0], 100)]).then((txid) => {
        return c.token.burn(otherNetworkAddress, 100);
      }).catch((err) => {
        console.log("caught error, cannot burn without burn being enabled");
        done();
      });
    });
  });

  it("should not be able to burn tokens if paused, even if burn is enabled", (done) => {
    let otherNetworkAddress = '0x00000000000000000000000000000000000000000000000000000000deadbeef';

    util.deployAll().then((c) => {
      c.controller.enableBurning();
    }).then(() => {
      // burning should be enabled, check
      return c.token.burnable();
    }).then((res) => {
      assert.equal(res, true);
    }).then(() => {
      // now pause the contract
      c.token.pause();
    }).then(() => {
      c.ledger.multiMint(0,[util.addressValue(accs[0], 100)]);
    }).then(() => {
      // try to burn some tokens, should fail
      return c.token.burn(otherNetworkAddress, 100);
    }).catch((txid) => {
      console.log("caught error, pause should throw error");
      done();
    });
  });

  /**
   * Payload Size Test Suite
   */

  it("should be able to reject a transfer (2w + 4b) with an incorrect data payload", (done) => {
    util.deployAll().then((c) => {
      c.ledger.multiMint(0, [util.addressValue(accs[0], 100)]).then((txid) => {
        return c.token.transfer(accs[1], 1);
      }).then((txid) => {
        // first transfer one token (valid)
        // mainly for us to generate the correct inputs
        let tx = web3.eth.getTransaction(txid.tx);
        util.transactionMined(txid.tx).then((tx) => {
          // the offset we are looking for is the end of the address
          // 16*2 + 20*2 (plus the 0x means we are just in the correct position)
          console.log(tx.tx.input);
          const input = tx.tx.input.substring(0, 72) + tx.tx.input.substring(74);
          console.log(input);
          return input;
        }).then((modifiedInput) => {
          return c.token.sendTransaction({from: accs[0], data: modifiedInput});
        }).then((res) => {
          assert.fail("should not accept invalid payload (payloadSize modifier)");
          done();
        }, (err) => {
          done();
        });
      });

    });
  });

  it("should accept a payload size that is too large", (done) => {
    util.deployAll().then((c) => {
      c.ledger.multiMint(0, [util.addressValue(accs[0], 100)]).then((txid) => {
        return c.token.transfer(accs[1], 1);
      }).then((txid) => {
        // first transfer one token (valid)
        // mainly for us to generate the correct inputs
        let tx = web3.eth.getTransaction(txid.tx);
        util.transactionMined(txid.tx).then((tx) => {
          // the offset we are looking for is the end of the address
          // 16*2 + 20*2 (plus the 0x means we are just in the correct position)
          console.log(tx.tx.input);
          const input = tx.tx.input + "00"; //extend
          console.log(input);
          return input;
        }).then((modifiedInput) => {
          return c.token.sendTransaction({from: accs[0], data: modifiedInput});
        }).then((res) => {
          done();
        }, (err) => {
          assert.fail(err);
          done();
        });
      });
    });

  });

  it("should be able to reject approve (4b + 2w) of smaller payload size", (done) => {
    util.deployAll().then((c) => {

      let expectedInput = null;

      c.ledger.multiMint(0, [util.addressValue(accs[0], 100)]).then((txid) => {
        return c.token.approve(accs[1], 100);
      }).then((txid) => {
        const input = web3.eth.getTransaction(txid).input;
        expectedInput = input.substring(0, 8 + 64) + input.substring(8 + 64 + 2);
      }).then(() => {
        // disable the approve so we can approve again after
        return c.token.approve(accs[1], 0);
      }).then((txid) => {
        return c.sendTransaction({from: accs[0], data: expectedInput});
      }).then((res) => {
        assert.fail("did not expect malformed input to succeed");
        done();
      }, (err) => {
        done();
      });
    });
  });

  it("should be able to accept approve (4b + 2w + 1b) of larger payload size", (done) => {
    util.deployAll().then((c) => {

      let expectedInput = null;

      c.ledger.multiMint(0, [util.addressValue(accs[0], 100)]).then((txid) => {
        return c.token.approve(accs[1], 100);
      }).then((txid) => {
        const tx = web3.eth.getTransaction(txid.tx);
        expectedInput = tx.input + '00';
      }).then(() => {
        // disable the approve so we can approve again after
        return c.token.approve(accs[1], 0);
      }).then((txid) => {
        return c.token.sendTransaction({from: accs[0], data: expectedInput});
      }).then((res) => {
        done();
      }, (err) => {
        assert.fail(err);
        done();
      });
    });
  });


  it("should be able to reject a transferFrom (4b + 3w) of smaller payload size", (done) => {
    util.deployAll().then((c) => {
      c.ledger.multiMint(0, [util.addressValue(accs[0], 100)]).then((txid) => {
        return c.token.approve(accs[1], 100);
      }).then((txid) => {
        return c.token.transferFrom.sendTransaction(accs[0], accs[1], 1, {from: accs[1]});
      }).then((txid) => {
        const tx = web3.eth.getTransaction(txid);
        const outTx = tx.input.substring(0, 8 + 128) + tx.input.substring(8 + 128 + 2);
        console.log(tx.input);
        console.log(outTx);
        return outTx;
      }).then((modifiedInput) => {
        return c.token.sendTransaction({from: accs[1], data: modifiedInput});
      }).then((res) => {
        assert.fail("did not expect transaction with wrong payload to go through");
        done();
      }, (err) => {
        done();
      });
    });
  });

  it("should be able to accept a transferFrom (4b + 3w + 1b) longer payload", (done) => {
    util.deployAll().then((c) => {
      c.ledger.multiMint(0, [util.addressValue(accs[0], 100)]).then((txid) => {
        return c.token.approve(accs[1], 100);
      }).then((txid) => {
        return c.token.transferFrom.sendTransaction(accs[0], accs[1], 1, {from: accs[1]});
      }).then((txid) => {
        const tx = web3.eth.getTransaction(txid);
        const outTx = tx.input + '00';
        console.log(tx.input);
        console.log(outTx);
        return outTx;
      }).then((modifiedInput) => {
        return c.token.sendTransaction({from: accs[1], data: modifiedInput});
      }).then((res) => {
        done();
      }, (err) => {
        assert.fail(err);
        done();
      });
    });
  });

  it("should be able to reject increaseApproval (4b + 2w) of smaller payload size", (done) => {
    util.deployAll().then((c) => {
      c.ledger.multiMint(0, [util.addressValue(accs[0], 100)]).then((txid) => {
        return c.token.increaseApproval(accs[1], 1);
      }).then((txid) => {
        const input = web3.eth.getTransaction(txid.tx);
        return input.substring(0, 8 + 64) + input.substring(8 + 64 + 2);
      }).then((modifiedInput) => {
        return c.token.sendTransaction({from: accs[0], input: modifiedInput});
      }).then((res) => {
        assert.fail("did not expect transaction with wrong payload to go through");
        done();
      }, (err) => {
        done();
      });
    });
  });


  it("should be able to reject decreaseApproval (4b + 2w) of smaller payload size", (done) => {
    util.deployAll().then((c) => {
      c.ledger.multiMint(0, [util.addressValue(accs[0], 100)]).then((txid) => {
        return c.token.approve(accs[1], 50);
      }).then((txid) => {
        return c.token.decreaseApproval(accs[1], 1);
      }).then((txid) => {
        const input = web3.eth.getTransaction(txid.tx);
        return input.substring(0, 8 + 64) + input.substring(8 + 64 + 2);
      }).then((modifiedInput) => {
        return c.token.sendTransaction({from: accs[0], input: modifiedInput});
      }).then((res) => {
        assert.fail("did not expect transaction with wrong payload to go through");
        done();
      }, (err) => {
        done();
      });
    });
  });

  /**
   * Owner Test Suite
   */

  it("should return the address of the owner", (done) => {
    util.Token.new().then((token) => {
      return token.owner();
    }).then((res) => {
      assert.equal(res, accs[0]);
      done();
    });
  });

  it("should only let the owner set the message of the day", (done) => {
    let desiredMotd = "Beam me up, Scotty";

    util.Token.new().then((token) => {
        /**
         * Try setting motd from not owner
         */
        token.setMotd.sendTransaction(desiredMotd, {from: accs[1]}).catch((err) => {
        console.log("error caught, should not be able to set motd unless owner");
      }).then(() => {
        return token.setMotd(desiredMotd); // as owner
      }).then((txid) => {
        return token.motd();
      }).then((res) => {
        assert.equal(res, desiredMotd);
        done();
      });
    });
  });

  it("should only let the owner set the controller address", (done) => {
    let desiredAddress = accs[1];

    util.Token.new().then((token) => {
      token.setController.sendTransaction(desiredAddress, {from: accs[1]}).catch((err) => {
        console.log("error caught, should not be able to set controller address unless owner");
      }).then(() => {
        return token.setController(desiredAddress);
      }).then((txid) => {
        return token.controller();
      }).then((res) => {
        assert.equal(res, accs[1]);
        done();
      });
    });
  });

  it("should transfer 100 tokens after transferring ownership", (done) => {
    let newOwner = accs[1];

    util.deployAll().then((c) => {
      // create some value initially
      c.ledger.multiMint(0, [util.addressValue(accs[0], 100)]).then((txid) => {
        c.token.transfer(accs[1], 1);
      }).then(() => {
        return c.token.balanceOf(accs[1]);
      }).then((res) => {
        assert.equal(res.c[0], 1);
      }).then(() => {
        // begin transferring ownership
        c.token.changeOwner(newOwner);
      }).then(() => {
        // receive ownership
        c.token.acceptOwnership.sendTransaction({from: newOwner});
      }).then(() => {
        // verify that old owner is no longer able to transfer tokens
        c.token.transfer(accs[1], 1);
      }).catch((err) => {
        console.log("error caught, old owner is no longer able to transfer currency");
      }).then(() => {
        // new owner should be able to transfer currency
        return c.token.transfer.sendTransaction(accs[2], 1, {from: newOwner});
      }).then((txid) => {
        txReceipt = web3.eth.getTransactionReceipt(txid);
        let eventHash = web3.sha3("Transfer(address,address,uint256)");

        for (j = 0; j < txReceipt.logs.length; j++) {
          if (txReceipt.logs[j].topics[0] == eventHash)
            eventFound = true;
        }

        if (!eventFound)
          assert.fail("Transfer event not found");
        done();
      });
    });
  });

  /**
   * Finalize Test Suite
   * TODO: already covered in general tests suite
   */


  /**
   * Event Test Suite
   */
  it("should emit Transfer event", (done) => {
    let totalSupply = 5000;
    let amount = 200;

    util.deployAll().then((c) => {
      let ev = c.token.Transfer();

      c.ledger.multiMint(0, [util.addressValue(accs[0], totalSupply)]).then((txid) => {
        return c.token.transfer("0x1122334455667788112233445566778811223344", amount);
      }).then((txid) => {
        return ev.get();
      }).then((events) => {
        assert.equal(events[0].args.from, accs[0]);
        assert.equal(events[0].args.to, "0x1122334455667788112233445566778811223344");
        assert.equal(events[0].args.value.c[0], amount);
        done();
      });
    });
  });

  it("should emit Approval event", (done) => {
    let totalSupply = 5000;
    let amount = 200;

    util.deployAll().then((c) => {
      let ev = c.token.Approval();

      c.ledger.multiMint(0, [util.addressValue(accs[0], totalSupply)]).then((txid) => {
        return c.token.approve("0x1122334455667788112233445566778811223344", amount);
      }).then((txid) => {
        return ev.get();
      }).then((events) => {
        assert.equal(events[0].args.owner, accs[0]);
        assert.equal(events[0].args.spender, "0x1122334455667788112233445566778811223344");
        assert.equal(events[0].args.value.c[0], amount);
        done();
      });
    });
  });

  it("should emit Burn event", (done) => {
    let totalSupply = 5000;
    let amount = 200;

    util.deployAll().then((c) => {
      let ev = c.token.Burn();

      c.ledger.multiMint(0, [util.addressValue(accs[0], totalSupply)]).then((txid) => {
        return c.controller.enableBurning();
      }).then((txid) => {
        return c.token.burn("0x1122334455667788112233445566778811223344556677881122334455667788", amount);
      }).then((txid) => {
        return ev.get();
      }).then((events) => {
        assert.equal(events[0].args.from, accs[0]);
        assert.equal(events[0].args.to, "0x1122334455667788112233445566778811223344556677881122334455667788");
        assert.equal(events[0].args.value.c[0], amount);
        done();
      });
    });
  });

  it("should NOT emit Burn event when burning is disabled", (done) => {
    let totalSupply = 5000;
    let amount = 200;

    util.deployAll().then((c) => {
      let ev = c.token.Burn();

      c.ledger.multiMint(0, [util.addressValue(accs[0], totalSupply)]).then((txid) => {
        return c.token.burn("0x1122334455667788112233445566778811223344556677881122334455667788", amount);
      }).then((txid) => {
        return ev.get();
      }).then((events) => {
        throw "Recevied burn event"
        done();
      }).catch((err) => {
        console.log("caught error, failed to burn");
        done();
      });
    });
  });

  /**
   * Pause Test Suite
   */
  it("should NOT be able to transfer after being paused", (done) => {
    let totalSupply = 5000;
    let amount = 200;

    util.deployAll().then((c) => {
      c.ledger.multiMint(0, [util.addressValue(accs[0], totalSupply)]).then((txid) => {
        return c.token.pause();
      }).then((txid) => {
        return c.token.transfer("0x1122334455667788112233445566778811223344", amount);
      }).then((txid) => {
        assert.fail("Should be unable to transfer under current condition");
      }).catch((err) => {
        console.log("caught error, failed to transfer");
        done();
      });
    });
  });

  it("should be able to transfer after unpaused", (done) => {
    let totalSupply = 5000;
    let amount = 200;

    util.deployAll().then((c) => {
      let ev = c.token.Transfer();

      c.ledger.multiMint(0, [util.addressValue(accs[0], totalSupply)]).then((txid) => {
        return c.token.pause();
      }).then((txid) => {
        return c.token.unpause();
      }).then((txid) => {
        return c.token.transfer("0x1122334455667788112233445566778811223344", amount);
      }).then((txid) => {
        return ev.get();
      }).then((events) => {
        assert.equal(events[0].args.from, accs[0]);
        assert.equal(events[0].args.to, "0x1122334455667788112233445566778811223344");
        assert.equal(events[0].args.value.c[0], amount);
        done();
      }).catch((err) => {
        assert.fail("Unable to transfer under current condition");
        done();
      });
    });
  });

  it("should NOT be able to burn after being paused", (done) => {
    let defaultBurnAddress = '0x0000000000000000000000000000000000000000';
    let otherNetworkAddress = '0xdeadbeef00000000000000000000000000000000000000000000000000000000';

    let totalSupply = 5000;
    let amount = 200;

    util.deployAll().then((c) => {
      c.ledger.multiMint(0, [util.addressValue(accs[0], totalSupply)]).then((txid) => {
        return c.controller.enableBurning()
      }).then((txid) => {
        return c.token.pause();
      }).then((txid) => {
        return c.token.burn(defaultBurnAddress, amount);
      }).then((txid) => {
        assert.fail("Should be unable to burn under current condition");
      }).catch((err) => {
        console.log("caught error, failed to burn");
        done();
      });
    });
  });

  it("should be able to burn after being unpaused", (done) => {
    let aionAddress = '0xdeadbeef00000000000000000000000000000000000000000000000000000000';

    let totalSupply = 5000;
    let amount = 200;

    util.deployAll().then((c) => {
      let ev = c.token.Burn();

      c.ledger.multiMint(0, [util.addressValue(accs[0], totalSupply)]).then((txid) => {
        return c.controller.enableBurning()
      }).then((txid) => {
        return c.token.pause();
      }).then((txid) => {
        return c.token.unpause();
      }).then((txid) => {
        return c.token.burn(aionAddress, amount);
      }).then((txid) => {
        return ev.get();
      }).then((events) => {
        assert.equal(events[0].args.from, accs[0]);
        assert.equal(events[0].args.to, aionAddress);
        assert.equal(events[0].args.value.c[0], amount);
        done();
      }).catch((err) => {
        console.log(err);
        assert.fail("failed to burn");
        done();
      });
    });
  });

  /**
   * approval test suite
   */

  it("should be able to increase approval", (done) => {
    let totalSupply = 5000;
    let amount = 200;

    util.deployAll().then((c) => {
      let ev = c.token.Approval();

      c.ledger.multiMint(0, [util.addressValue(accs[0], totalSupply)]).then((txid) => {
        return c.token.approve("0x1122334455667788112233445566778811223344", amount);
      }).then((txid) => {
        return c.token.increaseApproval("0x1122334455667788112233445566778811223344", amount);
      }).then((txid) => {
        return ev.get();
      }).then((events) => {
        assert.equal(events[0].args.owner, accs[0]);
        assert.equal(events[0].args.spender, "0x1122334455667788112233445566778811223344");
        assert.equal(events[0].args.value.c[0], amount * 2);
        done();
      }).catch((err) => {
        assert.fail("Unable to increase approval");
        done();
      });
    });
  });

  it("should be able to decrease approval", (done) => {
    let totalSupply = 5000;
    let amount = 200;

    util.deployAll().then((c) => {
      let ev = c.token.Approval();

      c.ledger.multiMint(0, [util.addressValue(accs[0], totalSupply)]).then((txid) => {
        return c.token.approve("0x1122334455667788112233445566778811223344", amount);
      }).then((txid) => {
        return c.token.decreaseApproval("0x1122334455667788112233445566778811223344", amount);
      }).then((txid) => {
        return ev.get();
      }).then((events) => {
        assert.equal(events[0].args.owner, accs[0]);
        assert.equal(events[0].args.spender, "0x1122334455667788112233445566778811223344");
        assert.equal(events[0].args.value.c[0], 0);
        done();
      }).catch((err) => {
        assert.fail("Unable to decrease approval");
        done();
      });
    });
  });

  /**
   * General test cases
   */

  it("should be able to repeatly set controller before being finalized", (done) => {
    let controllerAddress = "0x0000000000000000000000000000000000000001";

    util.deployAll().then((c) => {
      c.token.setController(controllerAddress).then((tx) => {
        return c.token.controller();
      }).then(res => {
        assert.equal(controllerAddress, res);
        done();
      });
    });
  });

  it("should not be able to set controller after being finalized", (done) => {
    util.deployAll().then((c) => {
      c.token.finalize().then((tx) => {
        return c.token.setController(c.controller);
      }).then((tx) => {
        throw "Were able to set controller"
        done();
      }).catch((err) => {
        console.log("caught error, unable to set controller");
        done();
      });
    });
  });

  it("should NOT decrease totalSupply after coin burning", (done) => {
    let defaultBurnAddress = '0x0000000000000000000000000000000000000000';
    let otherNetworkAddress = '0xdeadbeef00000000000000000000000000000000000000000000000000000000';
    let totalSupply = 5000;
    let burnAmount = 200;

    util.deployAll().then((c) => {
      let burnEvent = c.token.Burn();

      c.ledger.multiMint(0, [util.addressValue(accs[0], totalSupply)]).then((txid) => {
        return c.controller.enableBurning()
      }).then((txid) => {
        return c.token.burn(otherNetworkAddress, burnAmount);
      }).then((txid) => {
        return burnEvent.get();
      }).then((events) => {
        assert.equal(events[0].args.from, accs[0]);
        assert.equal(events[0].args.to, otherNetworkAddress);
        assert.equal(events[0].args.value.c[0], burnAmount);
      }).then(() => {
        return c.token.totalSupply();
      }).then((res) => {
        assert.equal(totalSupply, res);
        done();
      });
    });
  });
});
