Sale = artifacts.require('./Sale.sol');
Receiver = artifacts.require('./Receiver.sol');

Token = artifacts.require('./mock/TokenMock.sol');
Controller = artifacts.require('./mock/ControllerMock.sol');
Ledger = artifacts.require('./mock/LedgerMock.sol');

const util = require("erc-utils");
const assert = require('chai').assert;
const BigNumber = web3.BigNumber

const timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// TODO: Sales testing not complete
contract("Sale", (accs) => {
  it("should set the initial parameters correctly", async () => {
    const [_sale, _r1, _r2, _r3] = await Promise.all([Sale.new(), Receiver.new(), Receiver.new(), Receiver.new()]);

    await Promise.all([
      _sale.setReceivers(_r1.address, _r2.address, _r3.address),
      _r1.setSale(_sale.address),
      _r2.setSale(_sale.address)
    ]);

    const startDate = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
    const endDate = startDate + 60000; // this is actually in SECONDs oops

    await _sale.init(startDate, endDate, 100, 10);

    const [owner, sd, ed, soft, hard, live, r1Addr, r2Addr, r3Addr, softcap_time] = await Promise.all([
        _sale.owner(),
        _sale.start(),
        _sale.end(),
        _sale.softcap(),
        _sale.cap(),
        _sale.live(),
        _sale.r0(),
        _sale.r1(),
        _sale.r2(),
        _sale.SOFTCAP_TIME()
      ]);

    assert.equal(owner, accs[0]);
    assert.equal(sd.toNumber(), startDate);
    assert.equal(ed.toNumber(), endDate);
    assert.equal(soft.toNumber(), 10);
    assert.equal(hard.toNumber(), 100);
    assert.equal(live, false);
    assert.equal(r1Addr, _r1.address);
    assert.equal(r2Addr, _r2.address);
    assert.equal(r3Addr, _r3.address);
  });

  describe("#changeOwner()", () => {
    it("should not be able to changeOwner, when not the owner", async () => {
      const _sale = await Sale.new();
      try {
        await _sale.changeOwner.sendTransaction(accs[1], {from: accs[1]});
      } catch (err) {
        const owner = await _sale.owner();
        assert.equal(owner, accs[0]);
        return;
      }
      const owner = await _sale.owner();
      assert.equal(owner, accs[0]);
    });

    it("should be able to change owner", async () => {
      const _sale = await Sale.new();
      await _sale.changeOwner(accs[1]);
      const newOwner = await _sale.newOwner();
      assert.equal(newOwner, accs[1]);
    });
  });

  describe("#acceptOwnership()", () => {
    it("should not be able to accept ownership if not newOwner", async () => {
      const _sale = await Sale.new();
      await _sale.changeOwner(accs[1]);

      try {
        await _sale.acceptOwnership.sendTransaction({from: accs[2]});
      } catch (err) {
        // check either path
        const owner = await _sale.owner();
        assert.equal(owner, accs[0]);
        return;
      }
      // check either pass (this path should not happen)
      const owner = await _sale.owner();
      assert.equal(owner, accs[0]);
    });

    it("should be able to accept ownership", async() => {
      const _sale = await Sale.new();
      await _sale.changeOwner(accs[1]);
      await _sale.acceptOwnership.sendTransaction({from: accs[1]});
      const owner = await _sale.owner();
      assert.equal(owner, accs[1]);
    });
  });

  describe("#withdrawToken()", () => {
    it("should be able to withdraw tokens (mock)", async () => {
      const c = await util.deployMVC(Token, Controller, Ledger)
      const _sale = await Sale.new();
      await c.ledger.multiMint(0, [util.addressValue(_sale.address, 1000)]);

      const saleBalance = await c.token.balanceOf(_sale.address);
      assert.equal(saleBalance, 1000); // do some preliminary checks
      
      // now try to transfer he currency through
      // the sale contract
      await _sale.withdrawToken(c.token.address);

      const [newBalance, newSaleBalance] = await Promise.all([
        c.token.balanceOf(accs[0]),
        c.token.balanceOf(_sale.address)
      ]);

      assert.equal(newBalance.toNumber(), 1000);
      assert.equal(newSaleBalance.toNumber(), 0);
    });

    it("should not be able to withdraw tokens if not owner", async () => {
      const c = await util.deployMVC(Token, Controller, Ledger)
      const _sale = await Sale.new();
      await c.ledger.multiMint(0, [util.addressValue(_sale.address, 1000)]);

      const saleBalance = await c.token.balanceOf(_sale.address);
      assert.equal(saleBalance.toNumber(), 1000); // do some preliminary checks
      
      // now try to transfer he currency through
      // the sale contract
      const oldBalance = await c.token.balanceOf(accs[1]);
      try {
        await _sale.withdrawToken.sendTransaction(c.token.address, {from: accs[1]});
      } catch (err) {
        // do checks that no currency changes occured
        const newBalance = await c.token.balanceOf(accs[1]);
        assert.equal(newBalance.toNumber(), oldBalance.toNumber());
        return;
      }
      const newBalance = await c.token.balanceOf(accs[1]);
      assert.equal(newBalance.toNumber(), oldBalance.toNumber());      
    });
  });

  describe("#refundToken()", () => {
    it("should not refund token to desired account, if not owner", async () => {
      const c = await util.deployMVC(Token, Controller, Ledger)
      const _sale = await Sale.new();
      await c.ledger.multiMint(0, [util.addressValue(_sale.address, 1000)]);

      const saleBalance = await c.token.balanceOf(_sale.address);
      const oldBalance = await c.token.balanceOf(accs[2]);
      try {
        await _sale.refundToken.sendTransaction(c.token.address, accs[2], 1000, {from: accs[1]});
      } catch (err) {
        const newBalance = await c.token.balanceOf(accs[2]);
        assert.equal(oldBalance.toNumber(), newBalance.toNumber());
        return;
      }

      const newBalance = await c.token.balanceOf(accs[2]);
      assert.equal(oldBalance.toNumber(), newBalance.toNumber());
    });

    it("should not be able to refund tokens", async () => {
      const c = await util.deployMVC(Token, Controller, Ledger)
      const _sale = await Sale.new();
      await c.ledger.multiMint(0, [util.addressValue(_sale.address, 1000)]);

      const saleBalance = await c.token.balanceOf(_sale.address);

      await _sale.refundToken(c.token.address, accs[2], 1000);
      const newBalance = await c.token.balanceOf(accs[2]);
      assert.equal(newBalance.toNumber(), 1000);
    });
  });

  /**
   * Deposit Suite
   */
  describe("#live()", () => {
    it("should be live after the first transaction (also check event)", async () => {
      const [_sale, _r1, _r2, _r3] = await Promise.all([
        Sale.new(),
        Receiver.new(),
        Receiver.new(),
        Receiver.new()
      ]);

      await Promise.all([
        _sale.setReceivers(_r1.address, _r2.address, _r3.address),
        _r1.setSale(_sale.address),
        _r2.setSale(_sale.address),
        _r3.setSale(_sale.address)
      ]);

      // now deposit ether through a receiver and withdraw
      const startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      const endTime = startTime + 60000;
      await _sale.init(startTime, endTime, web3.toWei(100, 'ether'), web3.toWei(10, 'ether'));
      const tx = await _r1.sendTransaction({from: accs[1], value: web3.toWei(0.1, 'ether')});

      const found = tx.logs.reduce((s, v) => {
        if (v.event === "StartSale") {
          return s + 1;
        }
        return s;
      }, 0);

      assert.equal(found, 3, "both receivers should emit EndSale events");

      const live = await _sale.live();
      assert.equal(live, true, "should be live after the first transaction is sent");
    });

    it("should not be live after the last transaction", async () => {
      const [_sale, _r1, _r2, _r3] = await Promise.all([
        Sale.new(),
        Receiver.new(),
        Receiver.new(),
        Receiver.new()
      ]);

      await Promise.all([
        _sale.setReceivers(_r1.address, _r2.address, _r3.address),
        _r1.setSale(_sale.address),
        _r2.setSale(_sale.address),
        _r3.setSale(_sale.address)
      ]);

      // now deposit ether through a receiver and withdraw
      const startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      const endTime = startTime + 60000;
      await _sale.init(startTime, endTime, web3.toWei(1, 'ether'), web3.toWei(0.5, 'ether'));

      // first send a transaction to make it "live"
      await _r1.sendTransaction({from: accs[1], value: web3.toWei(0.1, 'ether')});
      const live = await _sale.live();

      assert.equal(live, true, "should be live after the first transaction is sent");

      // second send a transaction to complete sale (1 ether)
      const tx = await _r2.sendTransaction({from: accs[1], value: web3.toWei(1, 'ether')});

      const found = tx.logs.reduce((s, v) => {
        if (v.event === "EndSale") {
          return s + 1;
        }
        return s;
      }, 0);

      assert.equal(found, 3, "all three receivers should emit EndSale events");

      const dead = await _sale.live();
      assert.equal(dead, false, "should not be live after the first transaction is sent");
    });
  });

  describe("#()", () => {
    it("should not be able to deposit before the specified block timestamp", async () => {
      const [_sale, _r1, _r2, _r3] = await Promise.all([
        Sale.new(),
        Receiver.new(),
        Receiver.new(),
        Receiver.new()
      ]);

      await Promise.all([
        _sale.setReceivers(_r1.address, _r2.address, _r3.address),
        _r1.setSale(_sale.address),
        _r2.setSale(_sale.address),
        _r3.setSale(_sale.address)
      ]);

      // now deposit ether through a receiver and withdraw
      // arbitrary
      const startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 60000;
      const endTime = startTime + 120000;
      await _sale.init(startTime, endTime, web3.toWei(1, 'ether'), web3.toWei(0.5, 'ether'));

      try {
        const tx = await _r1.sendTransaction({from: accs[1], value: web3.toWei(0.1, 'ether')}); 
      } catch (err) {
        return;
      }
      assert.fail();
      return;
    });

    // This test will probably ONLY work in TestRPC
    it("should not be able to deposit after the end time is specified", async () => {
      const [_sale, _r1, _r2, _r3] = await Promise.all([
        Sale.new(),
        Receiver.new(),
        Receiver.new(),
        Receiver.new()
      ]);

      await Promise.all([
        _sale.setReceivers(_r1.address, _r2.address, _r3.address),
        _r1.setSale(_sale.address),
        _r2.setSale(_sale.address),
        _r3.setSale(_sale.address)
      ]);

      // now deposit ether through a receiver and withdraw
      // arbitrary
      const startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      const endTime = startTime + 5;
      await _sale.init(startTime, endTime, web3.toWei(1, 'ether'), web3.toWei(0.5, 'ether'));
      await _r1.sendTransaction({from: accs[1], value: web3.toWei(0.1, 'ether')});

      // no we just need to wait for end
      await timeout(10000); // 10 seconds

      // we didnt hit the balance cap here, only the block.timestamp limit
      const tx = await _r1.sendTransaction({from: accs[1], value: web3.toWei(0.1, 'ether')});


      const found = tx.logs.reduce((s, v) => {
        if (v.event === "EndSale") {
          return s + 1;
        }
        return s;
      }, 0);
      assert.equal(found, 3, "both receivers should emit EndSale events");
    });

    it("should not be able to directly pay ether", async () => {
      const _sale = await Sale.new();

      const startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp
      const endTime = startTime + 60000;

      await _sale.init(startTime, endTime, web3.toWei(1, 'ether'), web3.toWei(0.5, 'ether'));
      try {
        const tx = await _sale.sendTransaction({from: accs[1], value: web3.toWei(0.1, 'ether')});
      } catch (err) {
        console.log("error caught should not be able to send ether directly to sales contract");
        return;
      }

      assert.fail("should not be able to directly send ether to sales contract");
      return;
    });
  });


  /**
   * Withdraw Suite
   */

   describe("#withdraw()", () => {
    it("should be able to withdraw deposited ether through receiver", async () => {
      const [_sale, _r1, _r2, _r3] = await Promise.all([
        Sale.new(),
        Receiver.new(),
        Receiver.new(),
        Receiver.new()
      ]);

      await Promise.all([
        _sale.setReceivers(_r1.address, _r2.address, _r3.address),
        _r1.setSale(_sale.address),
        _r2.setSale(_sale.address),
        _r3.setSale(_sale.address)
      ]);

      // now deposit ether through a receiver and withdraw
      const startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      const endTime = startTime + 60000;
      await _sale.init(startTime, endTime, web3.toWei(100, 'ether'), web3.toWei(10, 'ether'));
      await _r1.sendTransaction({from: accs[1], value: web3.toWei(1, 'ether')});

      // we should be able to withdraw it as the owner
      const oldBalance = web3.eth.getBalance(accs[0]);
      const tx = await _sale.withdraw();
      const newBalance = web3.eth.getBalance(accs[0]);
      const gasCost = new BigNumber(tx.receipt.gasUsed).times(web3.eth.getTransaction(tx.tx).gasPrice);
      assert.equal(newBalance.toString(), oldBalance.plus(web3.toWei(1, 'ether')).minus(gasCost).toString());
    });

    it("should not be able to withdraw ether if not owner", async () => {
      const [_sale, _r1, _r2, _r3] = await Promise.all([
        Sale.new(),
        Receiver.new(),
        Receiver.new(),
        Receiver.new()
      ]);

      await Promise.all([
        _sale.setReceivers(_r1.address, _r2.address, _r3.address),
        _r1.setSale(_sale.address),
        _r2.setSale(_sale.address),
        _r3.setSale(_sale.address)
      ]);

      // now deposit ether through a receiver and withdraw
      const startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      const endTime = startTime + 60000;
      await _sale.init(startTime, endTime, web3.toWei(100, 'ether'), web3.toWei(10, 'ether'));
      await _r1.sendTransaction({from: accs[1], value: web3.toWei(1, 'ether')});

      // we're trying to withdraw as accs[1]
      const oldBalance = web3.eth.getBalance(accs[1]);
      try {
        const tx = await _sale.withdraw.sendTransaction({from: accs[1]});
      } catch (err) {
        return;
      }

      // check that balances have not changed
      const newBalance = web3.eth.getBalance(accs[1]);
      assert.equal(oldBalance.toString(), newBalance.toString(), "balances should be equal because withdrawal should fail");
      return;
    });
   });

   describe("#withdrawSome()", () => {
    it("should not be able to partially withdraw if not owner", async () => {
      const [_sale, _r1, _r2, _r3] = await Promise.all([
        Sale.new(),
        Receiver.new(),
        Receiver.new(),
        Receiver.new()
      ]);
      await Promise.all([
        _sale.setReceivers(_r1.address, _r2.address, _r3.address),
        _r1.setSale(_sale.address),
        _r2.setSale(_sale.address),
        _r3.setSale(_sale.address)
      ]);

      // now deposit ether through a receiver and withdraw
      const startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      const endTime = startTime + 60000;
      await _sale.init(startTime, endTime, web3.toWei(100, 'ether'), web3.toWei(10, 'ether'));
      await _r1.sendTransaction({from: accs[1], value: web3.toWei(1, 'ether')});

      let tx;
      try {
        tx = await _sale.withdrawSome.sendTransaction(web3.toWei(1, 'ether'), {from: accs[1]});
      } catch (err) {
        return;
      }

      const gasCost = new BigNumber(tx.receipt.gasUsed).times(web3.eth.getTransaction(tx.tx).gasUsed);
      const expectedBalance = oldBalance.minus(gasCost);
      assert.equal(newBalance.toString(), expectedBalance.toString());
    });

    it("should be able to partially withdraw deposited ether through receiver", async () => {
      const [_sale, _r1, _r2, _r3] = await Promise.all([
        Sale.new(),
        Receiver.new(),
        Receiver.new(),
        Receiver.new()
      ]);

      const wAmount = web3.toWei(0.5, 'ether');

      await Promise.all([
        _sale.setReceivers(_r1.address, _r2.address, _r3.address),
        _r1.setSale(_sale.address),
        _r2.setSale(_sale.address),
        _r3.setSale(_sale.address)
      ]);

      // now deposit ether through a receiver and withdraw
      const startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      const endTime = startTime + 60000;
      await _sale.init(startTime, endTime, web3.toWei(100, 'ether'), web3.toWei(10, 'ether'));
      await _r1.sendTransaction({from: accs[1], value: web3.toWei(1, 'ether')});

      // we should be able to withdraw it as the owner
      const oldBalance = web3.eth.getBalance(accs[0]);
      const tx = await _sale.withdrawSome(wAmount);
      const newBalance = web3.eth.getBalance(accs[0]);
      const gasCost = new BigNumber(tx.receipt.gasUsed).times(web3.eth.getTransaction(tx.tx).gasPrice);
      assert.equal(newBalance.toString(), oldBalance.plus(wAmount).minus(gasCost).toString());
    });
   });
});
