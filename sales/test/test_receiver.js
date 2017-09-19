const Sale = artifacts.require('Sale.sol');
const Receiver = artifacts.require('Receiver.sol');

const util = require('erc-utils');


// TODO
contract("Receiver", (accs) => {
  describe("#Receiver()", () => {
    it("should set owner to the msg.sender", async () => {
      const r = await Receiver.new();
      const owner = await r.owner();
      assert.equal(owner, accs[0]);
    });
  });

  // working test cases are covered in test_sale.js
  describe("#start()", () => {
    it("should not be able to start if not sale", async () => {
      const r = await Receiver.new();
      const s = await Sale.new();
      await r.setSale(s.address);

      try {
        await r.start();
      } catch (err) {
        return;
      }

      assert.fail("expected error");
    });
  });

  describe("#end()", () => {
    it("should not be able to end if not sale", async () => {
      const r = await Receiver.new();
      const s = await Sale.new();
      await r.setSale(s.address);

      try {
        await r.end();
      } catch (err) {
        return;
      }

      assert.fail("expected error");
    });
  });

  describe("#changeOwner()", () => {
    it("should not be able to changeOwner, when not the owner", async () => {
      const r = await Receiver.new();
      try {
        await r.changeOwner.sendTransaction(accs[1], {from: accs[1]});
      } catch (err) {
        const owner = await r.owner();
        assert.equal(owner, accs[0]);
        return;
      }
      const owner = await r.owner();
      assert.equal(owner, accs[0]);
    });

    it("should be able to change owner", async () => {
      const r = await Receiver.new();
      await r.changeOwner(accs[1]);
      const newOwner = await r.newOwner();
      assert.equal(newOwner, accs[1]);
    });
  });

  describe("#acceptOwnership()", () => {
    it("should not be able to accept ownership if not newOwner", async () => {
      const r = await Receiver.new();
      await r.changeOwner(accs[1]);

      try {
        await r.acceptOwnership.sendTransaction({from: accs[2]});
      } catch (err) {
        // check either path
        const owner = await r.owner();
        assert.equal(owner, accs[0]);
        return;
      }
      // check either pass (this path should not happen)
      const owner = await r.owner();
      assert.equal(owner, accs[0]);
    });

    it("should be able to accept ownership", async () => {
      const r = await Receiver.new();
      await r.changeOwner(accs[1]);
      await r.acceptOwnership.sendTransaction({from: accs[1]});
      const owner = await r.owner();
      assert.equal(owner, accs[1]);
    });
  });

  describe("#withdrawToken()", () => {
    it("should be able to withdraw tokens (mock)", async () => {
      const c = await util.deployMVC(Token, Controller, Ledger)
      const r = await Receiver.new();
      await c.ledger.multiMint(0, [util.addressValue(r.address, 1000)]);

      const ReceiverBalance = await c.token.balanceOf(r.address);
      assert.equal(ReceiverBalance, 1000); // do some preliminary checks
      
      // now try to transfer he currency through
      // the Receiver contract
      await r.withdrawToken(c.token.address);

      const [newBalance, newReceiverBalance] = await Promise.all([
        c.token.balanceOf(accs[0]),
        c.token.balanceOf(r.address)
      ]);

      assert.equal(newBalance.toNumber(), 1000);
      assert.equal(newReceiverBalance.toNumber(), 0);
    });

    it("should not be able to withdraw tokens if not owner", async () => {
      const c = await util.deployMVC(Token, Controller, Ledger)
      const r = await Receiver.new();
      await c.ledger.multiMint(0, [util.addressValue(r.address, 1000)]);

      const ReceiverBalance = await c.token.balanceOf(r.address);
      assert.equal(ReceiverBalance.toNumber(), 1000); // do some preliminary checks
      
      // now try to transfer he currency through
      // the Receiver contract
      const oldBalance = await c.token.balanceOf(accs[1]);
      try {
        await r.withdrawToken.sendTransaction(c.token.address, {from: accs[1]});
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
      const r = await Receiver.new();
      await c.ledger.multiMint(0, [util.addressValue(r.address, 1000)]);

      const ReceiverBalance = await c.token.balanceOf(r.address);
      const oldBalance = await c.token.balanceOf(accs[2]);
      try {
        await r.refundToken.sendTransaction(c.token.address, accs[2], 1000, {from: accs[1]});
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
      const r = await Receiver.new();
      await c.ledger.multiMint(0, [util.addressValue(r.address, 1000)]);

      const ReceiverBalance = await c.token.balanceOf(r.address);

      await r.refundToken(c.token.address, accs[2], 1000);
      const newBalance = await c.token.balanceOf(accs[2]);
      assert.equal(newBalance.toNumber(), 1000);
    });
  });
});