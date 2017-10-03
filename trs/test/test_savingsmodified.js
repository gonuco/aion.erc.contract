const Savings = artifacts.require("Savings.sol");
const Token = artifacts.require("TokenMock.sol");
const Controller = artifacts.require("ControllerMock.sol");
const Ledger = artifacts.require("LedgerMock.sol");
const DummyMock = artifacts.require("DummyMock.sol");

// TODO: swap to own utility once complete
const util = require('erc-utils');
const BigNumber = web3.BigNumber;
const secsPerMonth = 2592000;
function getBestBlockTimestamp(){
  return web3.eth.getBlock(web3.eth.blockNumber).timestamp;
}


// simpler version of the util
// this should ideally be consolidated with `erc-utils`
// do this if time permits
const deployERC20 = async () => {
  const [t, c, l] = await Promise.all([Token.new(), Controller.new(), Ledger.new()]);
  await Promise.all([
    t.setController(c.address),
    c.setToken(t.address),
    c.setLedger(l.address),
    l.setController(c.address)
  ]);
  return {token: t, controller: c, ledger: l};
}

const deployERC20Mint = async (accs) => {
  const [t, c, l] = await Promise.all([Token.new(), Controller.new(), Ledger.new()]);
  await Promise.all([
    t.setController(c.address),
    c.setToken(t.address),
    c.setLedger(l.address),
    l.setController(c.address)
  ]);

  let addressValueList = [];
  for (let i = 0; i < 10; i++) {
    addressValueList.push(util.addressValue(accs[i], 100));
  }

  await l.multiMint(0, addressValueList);
  return {token: t, controller: c, ledger: l};
}

const deployERC20Amount = async (accs, amount) => {
  const [t, c, l] = await Promise.all([Token.new(), Controller.new(), Ledger.new()]);
  await Promise.all([
    t.setController(c.address),
    c.setToken(t.address),
    c.setLedger(l.address),
    l.setController(c.address)
  ]);

  addressValueList = [];
  for (let i = 0; i < 10; i++) {
    addressValueList.push(util.addressValue(accs[i], amount));
  }

  await l.multiMint(0, addressValueList);
  return {token: t, controller: c, ledger: l};
}

contract("Savings", (accs) => {

  /**
   * Management Suite
   */

  describe("#()", () => {
    it("should not accept any ether", async () => {
      const s = await Savings.new();
      try {
        await s.sendTransaction({from: accs[0], value: web3.toWei(1, 'ether')});
      } catch (err) {
        return;
      }

      assert.fail("did not expect value transaction to go through, should be rejected");
    });

  });

  describe("init()", () => {
    it("should not set a period that is not a factor of 3", async () => {
      const s = await Savings.new();

      // go through a list of values that should not work
      // between 0 - 36
      const wrongPeriods = [
        0, 1, 2, 4, 5, 7, 10, 11, 13, 14, 16, 17, 18,
        19, 20, 22, 23, 25, 26, 28, 29, 31, 32, 34, 35
      ];

      for (let i = 0; i < wrongPeriods; i++) {
        try {
          await s.init(wrongPeriods[i]);
        } catch (err) {
          // expected error
          // pass
          continue;
        }
        // if we made it here it means it went through, something is wrong
        assert.fail();
      }

    });

    it("should not be able to set if not owner", async() => {
      const s = await Savings.new();
      const period = 36;
      try {
        await s.init.sendTransaction(period, {from: accs[1]});
      } catch (err) {
        return;
      }
      assert.fail();
    });

    it("should be able to set a period that is a factor of 3", async() => {
      const periods = [
        3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36
      ];

      for (let i = 0; i < periods; i++) {
        const s = await Savings.new();
        await s.init(periods[i]);
      }
    });
  });

  describe("#changeOwner()", () => {
    it("should not be able to changeOwner, when not the owner", async () => {
      const s = await Savings.new();
      try {
        await s.changeOwner.sendTransaction(accs[1], {from: accs[1]});
      } catch (err) {
        const owner = await s.owner();
        assert.equal(owner, accs[0]);
        return;
      }
      const owner = await s.owner();
      assert.equal(owner, accs[0]);
    });

    it("should be able to change owner", async () => {
      const s = await Savings.new();
      await s.changeOwner(accs[1]);
      const newOwner = await s.newOwner();
      assert.equal(newOwner, accs[1]);
    });
  });

  describe("#acceptOwnership()", () => {
    it("should not be able to accept ownership if not newOwner", async () => {
      const s = await Savings.new();
      await s.changeOwner(accs[1]);

      try {
        await s.acceptOwnership.sendTransaction({from: accs[2]});
      } catch (err) {
        // check either path
        const owner = await s.owner();
        assert.equal(owner, accs[0]);
        return;
      }
      // check either pass (this path should not happen)
      const owner = await s.owner();
      assert.equal(owner, accs[0]);
    });

    it("should be able to accept ownership", async() => {
      const s = await Savings.new();
      await s.changeOwner(accs[1]);
      await s.acceptOwnership.sendTransaction({from: accs[1]});
      const owner = await s.owner();
      assert.equal(owner, accs[1]);
    });
  });

  describe("#setToken()", () => {
    it("should not be able to setToken when not owner", async () => {
      const _s = await Savings.new();
      const _c = await Token.deployed();

      try {
        await _s.setToken.sendTransaction(_c.address, {from: accs[1]});
      } catch (err) {
        return;
      }

      assert.fail("should have thrown invalid opcode exception");
      return;
    });
  });

  describe("#lock()", () => {
    it("should not be able to lock when not owner", async () => {
      const _s = await Savings.new();

      try {
        await _s.lock.sendTransaction({from: accs[1]});
      } catch (err) {
        return;
      }

      assert.fail("should have thrown invalid opcode exception");
      return;
    });
  });

  describe("#start()", () => {
    it("should not be able to start when not owner", async () => {
      const [s, c] = await Promise.all([Savings.new(), deployERC20()]);

      await Promise.all([
        s.setToken(c.token.address),
        s.lock()
      ]);

      await s.init(36);

      try {
        await s.start(getBestBlockTimestamp()).sendTransaction({from: accs[1]});
      } catch (err) {
        return;
      }

      assert.fail("should have thrown invalid opcode exception");
      return;
    });
  });

  // describe("#period()", () => {
  //   it("should return the correct period", async () => {
  //     // dummy is for increment blocks, this test only works under testrpc
  //     const _dummy = await DummyMock.deployed();

  //     const [s, c] = await Promise.all([Savings.new(), deployERC20Mint(accs)]);
  //     await s.setToken(c.token.address);
  //     await s.lock();
  //     await s.start(0);

  //     // lets say everyone deposits 10 tokens
  //     const p1 = await s.period();

  //     assert.equal(p1.toNumber(), 0);

  //     for (let per = 1; per < 36; per++) {
  //       for (let i = 0; i < 10; i++)
  //         await _dummy.increment.sendTransaction({from: accs[0], gasPrice: 1});

  //       const p2 = await s.period();
  //       assert.equal(p2.toNumber(), per);
  //     }
  //   });
  // });
  describe("#periodAt()", () => {
    
    it("should return the correct period with plan 12", async () => {
      const savingPlan = 12;
      // dummy is for increment blocks, this test only works under testrpc
      const _dummy = await DummyMock.deployed();
      const [s, c] = await Promise.all([Savings.new(), deployERC20Mint(accs)]);
      await Promise.all([s.setToken(c.token.address), s.init(savingPlan), s.lock()]);
      await s.start(getBestBlockTimestamp());
      const p1 = await s.periodAt(getBestBlockTimestamp() - 10);
      assert.equal(p1.toNumber(), 0);
      for (let x = 0; x < 50; x++) {
        const p2 = await s.periodAt(getBestBlockTimestamp() + secsPerMonth * x);
        //console.log("periodAt " + p2.toNumber() + " / x " + x);
        assert.equal(p2.toNumber(), x + 1 > savingPlan ? savingPlan : (x + 1));
      }
    });

    it("should return the correct period with plan 36", async () => {
      const savingPlan = 36;
      // dummy is for increment blocks, this test only works under testrpc
      const _dummy = await DummyMock.deployed();

      const [s, c] = await Promise.all([Savings.new(), deployERC20Mint(accs)]);
      await Promise.all([s.setToken(c.token.address), s.init(savingPlan), s.lock()]);
      await s.start(getBestBlockTimestamp());
      const p1 = await s.periodAt(getBestBlockTimestamp() - 10);
      assert.equal(p1.toNumber(), 0);
      for (let x = 0; x < 50; x++) {
        const p2 = await s.periodAt(getBestBlockTimestamp() + secsPerMonth * x);
        //console.log("periodAt " + p2.toNumber() + " / x " + x);
        assert.equal(p2.toNumber(), x + 1 > savingPlan ? savingPlan: x + 1 );
      }
    });

  });

  /**
   * Deposit Suite
   */
  describe("#deposit()", () => {
    it("should be able to deposit to savings contract", async () => {
      const [s, c] = await Promise.all([Savings.new(), deployERC20Mint(accs)]);

      await s.setToken(c.token.address);
      await c.token.approve(s.address, 10); // approve 10 tokens
      await s.deposit(10); // deposit
      const deposited = await s.deposited(accs[0]);
      assert.equal(deposited.toNumber(), 10);
      const tokens = await c.token.balanceOf(s.address);
      assert.equal(tokens.toNumber(), 10);
    });

    it("should be able to bulk deposit to savings contract", async () => {
      const [s, c] = await Promise.all([Savings.new(), deployERC20Mint(accs)]);

      await s.setToken(c.token.address);
      await c.token.approve(s.address, 100);

      // everyone deposits
      let bulkDepositToList = [];
      for (let i = 0; i < 10; i++) {
        bulkDepositToList.push(util.addressValue(accs[i], 10));
      }

      // bulk depositTo
      const tx = await s.bulkDepositTo(bulkDepositToList);

      for (let i = 0; i < 10; i++) {
        const deposited = await s.deposited(accs[i]);
        assert.equal(deposited, 10);
      }
    });

    it("should not be able to deposit with approval", async () => {
      const [s, c] = await Promise.all([Savings.new(), deployERC20Mint(accs)]);
      await s.setToken(c.token.address);
      try {
        await s.deposit(10);
      } catch (err) {
        return;
      }
      assert.fail("expected unapproved deposit to fail");
    });
  });

  describe("#availableForWithdrawalAt()", () => {
    it("should return the correct amount available for withdraw", async() => {
      const [s, c] = await Promise.all([Savings.new(), deployERC20Amount(accs, 100000000)]);
      await Promise.all([s.setToken(c.token.address), s.init(36)]);

      await c.token.approve(s.address, 100000000);

      // everyone deposits
      let bulkDepositToList = [];
      for (let i = 0; i < 10; i++) {
        bulkDepositToList.push(util.addressValue(accs[i], 10000000));
      }
      // bulk depositTo
      const tx = await s.bulkDepositTo(bulkDepositToList);

      await s.lock();
      await s.start(getBestBlockTimestamp());

      for (let b = 0; b < 50; b++) {
          const deposited = await s.availableForWithdrawalAt(getBestBlockTimestamp() + b * secsPerMonth);

          const p = (b >= 36) ? 35 : b;
          const diff = deposited - (0.25 + 0.75 * (p + 1) / 36) * Math.pow(10, 18);
          assert.ok(Math.abs(diff) < 1000);
      }
    });
  });


  /**
   * Withdrawal Suite
   */

  describe("#withdraw()", () => {
    it("should be able to instantly withdraw 25% after start", async() => {
      const [s, c] = await Promise.all([Savings.new(), deployERC20Amount(accs, 100000000)]);

      await Promise.all([s.setToken(c.token.address), s.init(36)]);
      await c.token.approve(s.address, 100000000);

      // everyone deposits
      let bulkDepositToList = [];
      for (let i = 0; i < 10; i++) {
        bulkDepositToList.push(util.addressValue(accs[i], 10000000));
      }
      // bulk depositTo
      const tx = await s.bulkDepositTo(bulkDepositToList);

      // lets assume case b == d, then each use should be getting 2.5mil instantly (no roundoffs)
      // lets assume the case of one particular user acc[0]

      await s.lock();
      await s.start(getBestBlockTimestamp() + 55555); // let's set the start time in the future
      const oldBalance = await c.token.balanceOf(accs[0]);
      const withdrawTx = await s.withdraw();
      const newBalance = await c.token.balanceOf(accs[0]);

      //console.log("oldBalance = " + oldBalance.toNumber() + ", newBalance = " + newBalance.toNumber());

      assert.equal(oldBalance.toNumber(), 0);
      assert.equal(newBalance.toNumber(), 2500000);
    });

    it("should be able to withdraw 25% + t0 if we withdraw during the first period t0", async () => {
      const [s, c] = await Promise.all([Savings.new(), deployERC20Amount(accs, 100000000)]);
      const expected = 2708333;

      await s.setToken(c.token.address);
      await s.init(36);
      await c.token.approve(s.address, 100000000);

      // everyone deposits
      let bulkDepositToList = [];
      for (let i = 0; i < 10; i++) {
        bulkDepositToList.push(util.addressValue(accs[i], 10000000));
      }
      // bulk depositTo
      const tx = await s.bulkDepositTo(bulkDepositToList);

      // lets assume case b == d, then each use should be getting 2.5mil instantly (no roundoffs)
      // lets assume the case of one particular user acc[0]
      await s.lock();

      await s.lock();
      await s.start(getBestBlockTimestamp() - 55555); // let's set the start time in the past

      const oldBalance = await c.token.balanceOf(accs[0]);
      const withdrawTx = await s.withdraw();
      const newBalance = await c.token.balanceOf(accs[0]);

      //console.log("oldBalance = " + oldBalance.toNumber() + ", newBalance = " + newBalance.toNumber());

      assert.equal(oldBalance.toNumber(), 0);
      assert.equal(newBalance.toNumber(), expected);
    });

    it("should be able to withdraw the whole amount, if we withdraw only during the last period (36)", async () => {
      // dummy is for increment blocks, this test only works under testrpc
      const _dummy = await DummyMock.deployed();
      const [s, c] = await Promise.all([Savings.new(), deployERC20Amount(accs, 100000000)]);
      const expected = 10000000;

      await s.setToken(c.token.address);
      await s.init(36);
      await c.token.approve(s.address, 100000000);

      // everyone deposits
      let bulkDepositToList = [];
      for (let i = 0; i < 10; i++) {
        bulkDepositToList.push(util.addressValue(accs[i], 10000000));
      }
      // bulk depositTo
      const tx = await s.bulkDepositTo(bulkDepositToList);

      // lets assume case b == d, then each use should be getting 2.5mil instantly (no roundoffs)
      // lets assume the case of one particular user acc[0]
      await s.lock();
      await s.start(getBestBlockTimestamp() - 36 * secsPerMonth); // set block time in the past

      const oldBalance = await c.token.balanceOf(accs[0]);
      const withdrawTx = await s.withdraw();
      const newBalance = await c.token.balanceOf(accs[0]);

      //console.log("oldBalance = " + oldBalance.toNumber() + ", newBalance = " + newBalance.toNumber());

      assert.equal(oldBalance.toNumber(), 0);
      assert.equal(newBalance.toNumber(), expected);
    });

    it("should only withdraw monthly payments again within same period", async () => {
      // dummy is for increment blocks, this test only works under testrpc
      const _dummy = await DummyMock.deployed();
      const [s, c] = await Promise.all([Savings.new(), deployERC20Amount(accs, 100000000)]);
      const expectedSpecial = 2500000;
      const expectedMonthly = 208333;

      await s.setToken(c.token.address);
      await s.init(36);
      await c.token.approve(s.address, 100000000);

      // everyone deposits
      let bulkDepositToList = [];
      for (let i = 0; i < 10; i++) {
        bulkDepositToList.push(util.addressValue(accs[i], 10000000));
      }
      // bulk depositTo
      const tx = await s.bulkDepositTo(bulkDepositToList);

      // lets assume case b == d, then each use should be getting 2.5mil instantly (no roundoffs)
      // lets assume the case of one particular user acc[0]
      await s.lock();
      await s.start(getBestBlockTimestamp());

      // withdraw 25% + first period part
      await s.withdraw(); 
      const specialBalance1 = await c.token.balanceOf(accs[0]);
      assert.equal(specialBalance1.toNumber(), expectedSpecial + expectedMonthly);

      // nothing more to widthdraw due to widthin same period
      await s.withdraw();
      const specialBalance2 = await c.token.balanceOf(accs[0]);
      assert.equal(specialBalance2.toNumber(), expectedSpecial + expectedMonthly);

    });
    
    // this test case has been tested on previous one
    // it("should not allow repeated withdrawals of special payments", async () => {
    //   // dummy is for increment blocks, this test only works under testrpc
    //   const _dummy = await DummyMock.deployed();
    //   const [s, c] = await Promise.all([Savings.new(), deployERC20Amount(accs, 100000000)]);
    //   const expectedSpecial = 2500000;

    //   await s.setToken(c.token.address);
    //   await s.init(36);
    //   await c.token.approve(s.address, 100000000);

    //   // everyone deposits
    //   let bulkDepositToList = [];
    //   for (let i = 0; i < 10; i++) {
    //     bulkDepositToList.push(util.addressValue(accs[i], 10000000));
    //   }
    //   // bulk depositTo
    //   const tx = await s.bulkDepositTo(bulkDepositToList);

    //   // lets assume case b == d, then each use should be getting 2.5mil instantly (no roundoffs)
    //   // lets assume the case of one particular user acc[0]
    //   await s.lock();
    //   await s.start(getBestBlockTimestamp());

    //   await s.withdraw(); // 1 tx
    //   const newBalance = await c.token.balanceOf(accs[0]);
    //   assert.equal(newBalance.toNumber(), expectedSpecial);

    //   // no events are emitted for withdrawal, so we cant really confirm
    //   // just confirm through balance
    //   await s.withdraw();

    //   const newerBalance = await c.token.balanceOf(accs[0]);
    //   assert.equal(newerBalance.toNumber(), expectedSpecial);
    // });

    // duplicated 
    // it("should not allow repeated withdrawals of monthly payments", async () => {
    //   // dummy is for increment blocks, this test only works under testrpc
    //   const _dummy = await DummyMock.deployed();
    //   const [s, c] = await Promise.all([Savings.new(), deployERC20Amount(accs, 100000000)]);
    //   const expectedSpecial = 2500000;
    //   const expectedMonthly = 208333;

    //   await s.setToken(c.token.address);
    //   await s.init(36);
    //   await c.token.approve(s.address, 100000000);

    //   // everyone deposits
    //   let bulkDepositToList = [];
    //   for (let i = 0; i < 10; i++) {
    //     bulkDepositToList.push(util.addressValue(accs[i], 10000000));
    //   }
    //   // bulk depositTo
    //   const tx = await s.bulkDepositTo(bulkDepositToList);

    //   // lets assume case b == d, then each use should be getting 2.5mil instantly (no roundoffs)
    //   // lets assume the case of one particular user acc[0]
    //   await s.lock();
    //   await s.start(getBestBlockTimestamp());

    //   await s.withdraw(); // 1 tx
    //   const newBalance = await c.token.balanceOf(accs[0]);
    //   assert.equal(newBalance.toNumber(), expectedSpecial + expectedMonthly);

    //   // no events are emitted for withdrawal, so we cant really confirm
    //   // just confirm through balance
    //   await s.withdraw();

    //   const newerBalance = await c.token.balanceOf(accs[0]);
    //   assert.equal(newerBalance.toNumber(), expectedSpecial + expectedMonthly);
    // });

    // has been commented before, based on current logic: first period [n n + 2592000 - 1)
    // there is no way to test only withdraw special 25%
    // it("should allow a user to withdraw special, then withdraw tokens on a monthly schedule", async () => {
    //   // dummy is for increment blocks, this test only works under testrpc
    //   const _dummy = await DummyMock.deployed();
    //   const [s, c] = await Promise.all([Savings.new(), deployERC20Amount(accs, 100000000)]);
    //   const expectedSpecial = 2500000;
    //   const expectedMonthly = 208333;

    //   await s.setToken(c.token.address);
    //   await s.init(36);
    //   await c.token.approve(s.address, 100000000);

    //   // everyone deposits
    //   let bulkDepositToList = [];
    //   for (let i = 0; i < 10; i++) {
    //     bulkDepositToList.push(util.addressValue(accs[i], 10000000));
    //   }
    //   // bulk depositTo
    //   const tx = await s.bulkDepositTo(bulkDepositToList);

    //   // lets assume case b == d, then each use should be getting 2.5mil instantly (no roundoffs)
    //   // lets assume the case of one particular user acc[0]
    //   await s.lock();
    //   await s.start(getBestBlockTimestamp());

    //   await s.withdraw(); // 1 tx
    //   const newBalance = await c.token.balanceOf(accs[0]);
    //   assert.equal(newBalance.toNumber(), expectedSpecial);

    //   let totalValue = expectedSpecial;
    //   for (let i = 0; i < 36; i++) {
    //     for (let j = 0; j < 9; j++) {
    //       await _dummy.increment.sendTransaction({from: accs[0], gasPrice: 1});
    //     }

    //     await s.withdraw();
    //     totalValue += expectedMonthly;

    //     const balance = await c.token.balanceOf(accs[0]);
    //     console.log("totalValue: " + totalValue.toString() + " balance: " + balance.toString())
    //     assert.equal(balance, totalValue);
    //   }
    // });
  });

  describe("#bulkWithdrawTo()", () => {
    it("should allow all users to withdraw special", async () => {
      // dummy is for incremen t blocks, this test only works under testrpc
      const _dummy = await DummyMock.deployed();
      const [s, c] = await Promise.all([Savings.new(), deployERC20Amount(accs, 100000000)]);
      const expectedSpecial = 2500000;
      const expectedMonthly = 208333;

      await s.setToken(c.token.address);
      await s.init(36);
      await c.token.approve(s.address, 100000000);

      // everyone deposits
      let bulkDepositToList = [];
      for (let i = 0; i < 10; i++) {
        bulkDepositToList.push(util.addressValue(accs[i], 10000000));
      }
      // bulk depositTo
      const tx = await s.bulkDepositTo(bulkDepositToList);

      // lets assume case b == d, then each use should be getting 2.5mil instantly (no roundoffs)
      // lets assume the case of one particular user acc[0]
      await s.lock();
      await s.start(getBestBlockTimestamp() + 55555);

      let addressList = [];
      for (let i = 0; i < 10; i++) {
        addressList.push(accs[i]);
      }

      await s.bulkWithdraw(addressList);
      for (let i = 1; i < 10; i++) {
        const balance = await c.token.balanceOf(addressList[i]);
        assert.equal(balance.toNumber(), (new BigNumber(expectedSpecial)).plus(100000000).toNumber());
      }
    });
  });

  describe("#multiMint()", () => {
    it("should mint deposits (multiMint)", async () => {
      // does not require any real token interaction
      // assume that we transferred the right amount!
      const s = await Savings.new();
      s.init(36);
      await s.multiMint(0, [util.addressValue(accs[0], 100)]);
      const deposited = await s.deposited(accs[0]);
      const totalfv = await s.totalfv();
      assert.equal(deposited.toNumber(), 100);
      assert.equal(totalfv.toNumber(), 100);
    });

    it("should mint a batch of deposits (multiMint)", async () => {
      const s = await Savings.new();
      let addressValues = []
      let addresses = []
      for (let i = 0; i < 100; i++) {
        const a = "0x" + util.numberToAddress(i);
        addresses.push(a);
        addressValues.push(util.addressValue(a, i));
      }
      const tx = await s.multiMint(0, addressValues);

      for (let i = 0; i < 100; i++) {
        assert.equal((await s.deposited(addresses[i])).toNumber(), i);
      }
    });

    it("should not mint deposits with the wrong minting nonce", async () => {
      const s = await Savings.new();
      const tx = await s.multiMint(1, [util.addressValue(accs[0], 100)]);
      assert.equal(tx.logs.length, 0);
    });

    it("should not mint deposits if not owner", async () => {
      const s = await Savings.new();
      try {
        const tx = await s.multiMint.sendTransaction(
          1,
          [util.addressValue(accs[0], 100)],
          {from: accs[1]});
      } catch (err) {
        return;
      }
      assert.fail("expected error because not owner");
    });
  });

  describe("#pause()", () => {
    it("should not be able to deposit after pause()", async() => {
      const [s, c] = await Promise.all([Savings.new(), deployERC20Amount(accs, 100000000)]);
      await Promise.all([s.setToken(c.token.address), s.init(36)]);

      await c.token.approve(s.address, 100000000);

      // pause this contract
      s.pause();

      // try depositTo()
      try {
          await s.deposit(100000000);
          fail("should have reverted");
      } catch(e) {
      }
      try {
          await s.depositTo(acc[1], 100000000);
          fail("should have reverted");
      } catch(e) {
      }
    });

    it("should not be able to widthdraw after pause()", async() => {
      const [s, c] = await Promise.all([Savings.new(), deployERC20Amount(accs, 100000000)]);
      await Promise.all([s.setToken(c.token.address), s.init(36)]);

      await c.token.approve(s.address, 100000000);

      // everyone deposits
      let bulkDepositToList = [];
      for (let i = 0; i < 10; i++) {
        bulkDepositToList.push(util.addressValue(accs[i], 10000000));
      }
      // bulk depositTo
      const tx = await s.bulkDepositTo(bulkDepositToList);

      await s.lock();
      await s.start(getBestBlockTimestamp());

      // pause this contract
      s.pause();

      try {
          await s.withdraw();
          fail("should have reverted");
      } catch(e) {
      }
      try {
          await s.withdrawTo(acc[1]);
          fail("should have reverted");
      } catch(e) {
      }
    });
  });

});
