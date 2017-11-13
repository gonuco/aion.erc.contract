/**
 * Test suite dedicated to the withdraw functionality
 */
const Savings = artifacts.require("Savings.sol");
const Token = artifacts.require("TokenMock.sol");
const Controller = artifacts.require("ControllerMock.sol");
const Ledger = artifacts.require("LedgerMock.sol");
const DummyMock = artifacts.require("DummyMock.sol");

const assert = require('chai').assert;
const BN = require('bn.js');

// TODO: swap to own utility once complete
const util = require('erc-utils');
const BigNumber = web3.BigNumber;
const secsPerMonth = 2592000;
function getBestBlockTimestamp(){
  return web3.eth.getBlock(web3.eth.blockNumber).timestamp;
}

/**
* Truffle is still using web3 0.4.12 internally, which defaults to BigNumber.js,
* convert to BN.js until web3 is updated.
*/
const toBN = (bignum) => {
  return new BN(bignum.toString(), 10);
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
  let addressValueList = [];
  for (let i = 0; i < 10; i++) {
    addressValueList.push(util.addressValue(accs[i], amount));
  }

  await l.multiMint(0, addressValueList);
  return {token: t, controller: c, ledger: l};
}


contract("Contract withdraw", (accs) => {
  describe("withdrawal fraction and amount", () => {
    let s;
    let c;
    let start;
    let total = 360000000;
    let userTotal = 36000000;
    let t0special = 0;
    let period = 36;
    let timeOffset = 50000;
    let month = 60 * 60 * 24 * 30;

    before(async () => {
      // deploy the necessary contracts, since _withdrawTo() wont incur
      // any state changes, we can safely use one contract
      [_s, _c] = await Promise.all([Savings.new(), deployERC20Amount(accs, total)]);
      s = _s;
      c = _c;

      await Promise.all([s.setToken(c.token.address), s.init(period, t0special)]);
      await s.finalizeInit();

      // everyone deposits 1m
      let bulkDepositToList = [];
      for (let i = 0; i < 10; i++) {
        bulkDepositToList.push(util.addressValue(accs[i], userTotal));
      }

      await c.token.approve(s.address, total);
      await s.bulkDepositTo(bulkDepositToList);
      await s.lock();
      await s.start(getBestBlockTimestamp() + timeOffset); // doesnt matter
      start = getBestBlockTimestamp();
    });

    it("should calculate the monthly fraction 1/36 return", async () => {
      const power = (new BN(10)).pow(new BN(18));
      const dem = new BN(36);

      let frac = [];
      for (let i = 0; i < 36; i++) {
        frac.push(power.mul(new BN(i + 1)).div(dem));
      }

      const monthlyStart = start + timeOffset;

      for (let i = 0; i < 36; i++) {
        // check that contract outputs same ratio
        const cFrac = await s.availableForWithdrawalAt(monthlyStart + (i * month));
        assert.equal(cFrac.toNumber(), frac[i]);
      }
    });

    /**
     * Decouples some of the state, unfortunately some state variables
     * (constants) are still set.
     * 
     * Because no special, first month should be 1/36 of the deposited
     * value.
     */
    it("should calculate monthly 1/36 return", async () => {
      // 8 decimal place precision division
      const num = new BN(100000000);
      const dem = new BN(3600000000);

      const monthly = (new BN(userTotal)).mul(num).div(dem);
      
      // special withdraw should be zero
      const specialWithdrawal = await s._withdrawTo(
        userTotal, 0, start, total);

      assert.equal(specialWithdrawal.toNumber(), 0);
      const monthlyStart = start + timeOffset;

      let lastMonthTotal = 0;
      let withdrawnString = "";
      for (let i = 0; i < 36; i++) {
        const monthlyWithdrawal = await s._withdrawTo(
          userTotal, lastMonthTotal, monthlyStart + (i * month), total);
        lastMonthTotal += monthlyWithdrawal.toNumber();
        withdrawnString += " " + monthlyWithdrawal.toString(); 
      }
      console.log("monthly: " + withdrawnString);
      console.log("total: " + lastMonthTotal);
      assert.equal(lastMonthTotal, userTotal);
    });
  });

  describe("withdrawal fraction and amount, updated total", () => {
    let s;
    let c;
    let start;
    let total = 360000000;
    let userTotal = 36000000;
    let t0special = 0;
    let period = 36;
    let timeOffset = 50000;
    let month = 60 * 60 * 24 * 30;

    before(async () => {
      // deploy the necessary contracts, since _withdrawTo() wont incur
      // any state changes, we can safely use one contract
      [_s, _c] = await Promise.all([Savings.new(), deployERC20Amount(accs, total)]);
      s = _s;
      c = _c;

      await Promise.all([s.setToken(c.token.address), s.init(period, t0special)]);
      await s.finalizeInit();

      // everyone deposits 1m
      let bulkDepositToList = [];
      for (let i = 0; i < 10; i++) {
        bulkDepositToList.push(util.addressValue(accs[i], userTotal));
      }

      await c.token.approve(s.address, total);
      await s.bulkDepositTo(bulkDepositToList);
      await s.lock();
      await s.start(getBestBlockTimestamp() + timeOffset); // doesnt matter
      start = getBestBlockTimestamp();
    });

    it("should have correct fractions, with updated total", async () => {
      const power = (new BN(10)).pow(new BN(18));
      const dem = new BN(36);

      let frac = [];
      for (let i = 0; i < 36; i++) {
        frac.push(power.mul(new BN(i + 1)).div(dem));
      }

      const monthlyStart = start + timeOffset;

      for (let i = 0; i < 18; i++) {
        // check that contract outputs same ratio
        const cFrac = await s.availableForWithdrawalAt(monthlyStart + (i * month));
        assert.equal(cFrac.toNumber(), frac[i]);
      }
      // update the total!
      await c.token.transfer(s.address, total);
      for (let i = 18; i < 36; i++) {
        const cFrac = await s.availableForWithdrawalAt(monthlyStart + (i * month));
        assert.equal(cFrac.toNumber(), frac[i]);
      }
    });
  });
});