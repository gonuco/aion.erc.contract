const Savings = artifacts.require("Savings.sol");
const Token = artifacts.require("TokenMock.sol");
const Controller = artifacts.require("ControllerMock.sol");
const Ledger = artifacts.require("LedgerMock.sol");
const DummyMock = artifacts.require("DummyMock.sol");

// TODO: swap to own utility once complete
const util = require('erc-utils');
const BigNumber = web3.BigNumber;



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

  describe("#interval()", () => {
    it("should have an interval of 10", async () => {
      const _savings = await Savings.new();
      const interval = await _savings.interval();
      assert.equal(interval, 10);
    });
  });

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

      try {
        await s.start(0).sendTransaction({from: accs[1]});
      } catch (err) {
        return;
      }

      assert.fail("should have thrown invalid opcode exception");
      return;
    });
  });

  describe("#period()", () => {
    it("should return the correct period", async () => {
      // dummy is for increment blocks, this test only works under testrpc
      const _dummy = await DummyMock.deployed();

      const [s, c] = await Promise.all([Savings.new(), deployERC20Mint(accs)]);
      await s.setToken(c.token.address);
      await s.lock();
      await s.start(0);

      // lets say everyone deposits 10 tokens
      const p1 = await s.period();

      assert.equal(p1.toNumber(), 0);

      for (let per = 1; per < 36; per++) {
        for (let i = 0; i < 10; i++)
          await _dummy.increment.sendTransaction({from: accs[0], gasPrice: 1});
        
        const p2 = await s.period();
        assert.equal(p2.toNumber(), per);
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


  /**
   * Withdrawal Suite
   */

  describe("#withdraw()", () => {
    it("should be able to instantly withdraw 25% after start", async() => {
      const [s, c] = await Promise.all([Savings.new(), deployERC20Amount(accs, 100000000)]);

      await s.setToken(c.token.address);
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
      await s.start(1000);
      const oldBalance = await c.token.balanceOf(accs[0]);
      const withdrawTx = await s.withdraw();
      const newBalance = await c.token.balanceOf(accs[0]);

      assert.equal(oldBalance.toNumber(), 0);
      assert.equal(newBalance.toNumber(), 2500000);
    });

    it("should be able to withdraw 25% + t0 if we withdraw during the first period t0", async () => {
      const [s, c] = await Promise.all([Savings.new(), deployERC20Amount(accs, 100000000)]);
      const expected = 2708333;

      await s.setToken(c.token.address);
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
      await s.start(0);
      
      const oldBalance = await c.token.balanceOf(accs[0]);
      const withdrawTx = await s.withdraw();
      const newBalance = await c.token.balanceOf(accs[0]);
      
      assert.equal(oldBalance.toNumber(), 0);
      assert.equal(newBalance.toNumber(), expected);
    });

    it("should be able to withdraw the whole amount, if we withdraw only during the last period (36)", async () => {
      // dummy is for increment blocks, this test only works under testrpc
      const _dummy = await DummyMock.deployed();
      const [s, c] = await Promise.all([Savings.new(), deployERC20Amount(accs, 100000000)]);
      const expected = 10000000;

      await s.setToken(c.token.address);
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
      await s.start(0);
      
      const oldBalance = await c.token.balanceOf(accs[0]);

      for (let i = 0; i < 360; i++)
        await _dummy.increment.sendTransaction({from: accs[0], gasPrice: 1});

      const withdrawTx = await s.withdraw();
      const newBalance = await c.token.balanceOf(accs[0]);
      
      assert.equal(oldBalance.toNumber(), 0);
      assert.equal(newBalance.toNumber(), expected);
    });

    it("should only withdraw monthly payments if the first special payment has been withdrawn", async () => {
      // dummy is for increment blocks, this test only works under testrpc
      const _dummy = await DummyMock.deployed();
      const [s, c] = await Promise.all([Savings.new(), deployERC20Amount(accs, 100000000)]);
      const expectedSpecial = 2500000;
      const expectedMonthly = 208333;

      await s.setToken(c.token.address);
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
      await s.start(10);

      await s.withdraw(); // 1 tx
      const specialBalance = await c.token.balanceOf(accs[0]);
      assert.equal(specialBalance.toNumber(), expectedSpecial);

      for (let i = 0; i < 9; i++) {
        _dummy.increment.sendTransaction({from: accs[0], gasPrice: 1});
      }

      await s.withdraw();
      const incrementedBalance = await c.token.balanceOf(accs[0]);
      assert.equal(incrementedBalance.toNumber(), expectedSpecial + expectedMonthly);

    });

    it("should not allow repeated withdrawals of special payments", async () => {
      // dummy is for increment blocks, this test only works under testrpc
      const _dummy = await DummyMock.deployed();
      const [s, c] = await Promise.all([Savings.new(), deployERC20Amount(accs, 100000000)]);
      const expectedSpecial = 2500000;

      await s.setToken(c.token.address);
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
      await s.start(100);

      await s.withdraw(); // 1 tx
      const newBalance = await c.token.balanceOf(accs[0]);
      assert.equal(newBalance.toNumber(), expectedSpecial);

      // no events are emitted for withdrawal, so we cant really confirm
      // just confirm through balance
      await s.withdraw();

      const newerBalance = await c.token.balanceOf(accs[0]);
      assert.equal(newerBalance.toNumber(), expectedSpecial);
    });

    it("should not allow repeated withdrawals of monthly payments", async () => {
      // dummy is for increment blocks, this test only works under testrpc
      const _dummy = await DummyMock.deployed();
      const [s, c] = await Promise.all([Savings.new(), deployERC20Amount(accs, 100000000)]);
      const expectedSpecial = 2500000;
      const expectedMonthly = 208333;

      await s.setToken(c.token.address);
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
      await s.start(0);

      await s.withdraw(); // 1 tx
      const newBalance = await c.token.balanceOf(accs[0]);
      assert.equal(newBalance.toNumber(), expectedSpecial + expectedMonthly);

      // no events are emitted for withdrawal, so we cant really confirm
      // just confirm through balance
      await s.withdraw();

      const newerBalance = await c.token.balanceOf(accs[0]);
      assert.equal(newerBalance.toNumber(), expectedSpecial + expectedMonthly);
    });

    it("should allow a user to withdraw special, then withdraw tokens on a monthly schedule", async () => {
      // dummy is for increment blocks, this test only works under testrpc
      const _dummy = await DummyMock.deployed();
      const [s, c] = await Promise.all([Savings.new(), deployERC20Amount(accs, 100000000)]);
      const expectedSpecial = 2500000;
      const expectedMonthly = 208333;

      await s.setToken(c.token.address);
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
      await s.start(10);

      await s.withdraw(); // 1 tx
      const newBalance = await c.token.balanceOf(accs[0]);
      assert.equal(newBalance.toNumber(), expectedSpecial);

      let totalValue = expectedSpecial;
      for (let i = 0; i < 36; i++) {
        for (let j = 0; j < 9; j++) {
          await _dummy.increment.sendTransaction({from: accs[0], gasPrice: 1});
        }

        await s.withdraw();
        totalValue += expectedMonthly;

        const balance = await c.token.balanceOf(accs[0]);
        assert.equal(balance, totalValue);
      }
    });
  });

  describe("#bulkWithdrawTo()", () => {
    it("should allow all users to withdraw special", async () => {
      // dummy is for incremen t blocks, this test only works under testrpc
      const _dummy = await DummyMock.deployed();
      const [s, c] = await Promise.all([Savings.new(), deployERC20Amount(accs, 100000000)]);
      const expectedSpecial = 2500000;
      const expectedMonthly = 208333;

      await s.setToken(c.token.address);
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
      await s.start(10);

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

});