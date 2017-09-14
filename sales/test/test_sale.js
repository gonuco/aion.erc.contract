Sale = artifacts.require('./Sale.sol');
Receiver = artifacts.require('./Receiver.sol');

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

  /**
   * Deposit Suite
   */
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
    const endTime = startTime + 10;
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


  /**
   * Withdraw Suite
   */

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
