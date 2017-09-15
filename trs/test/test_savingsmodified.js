const Savings = artifacts.require("Savings.sol");
const Token = artifacts.require("TokenMock.sol");
const Controller = artifacts.require("ControllerMock.sol");
const Ledger = artifacts.require("LedgerMock.sol");
const DummyMock = artifacts.require("DummyMock.sol");

// TODO: swap to own utility once complete
const util = require('../../token/test/util.js');


// simpler version of the util
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

  addressValueList = [];
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
  it("should transfer", async () => {
    const c = await deployERC20Mint(accs);
    await c.token.transfer(accs[1], 1);
    await c.token.approve(accs[1], 1);
    await c.token.transferFrom.sendTransaction(accs[0], accs[1], 1, {from: accs[1]});
  });


  it("should have an interval of 10", async () => {
    const _savings = await Savings.new();
    const interval = await _savings.interval();
    assert.equal(interval, 10);
  });

  /**
   * Management Suite
   */
  it("should transfer ownership successfully", async () => {
    const _savings = await Savings.new();
    const currentOwner = await _savings.owner();

    assert.equal(currentOwner, accs[0]);

    await _savings.changeOwner(accs[1]);
    await _savings.acceptOwnership.sendTransaction({from: accs[1]});

    const newCurrentOwner = await _savings.owner();
    const newOwner = await _savings.newOwner();

    assert.equal(newCurrentOwner, accs[1]);
  });

  it("should not be able to transfer ownership when not owner", async () => {
    const _s = await Savings.new();

    try {
      await _s.changeOwner.sendTransaction(accs[1], {from: accs[1]});
    } catch (err) {
      return;
    }

    assert.fail("should have thrown invalid opcode exception");
    return;
  });

  it("should not be able to accept ownership if not named the owner", async () => {
    const _s = await Savings.new();

    try {
      await _s.acceptOwnership.sendTransaction({from: accs[1]});
    } catch (err) {
      return;
    }

    assert.fail("should have thrown invalid opcode exception");
    return;
  });

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

  /**
   * Deposit Suite
   */

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


  /**
   * Withdrawal Suite
   */

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