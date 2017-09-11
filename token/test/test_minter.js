let util = require('./util.js');

contract('Minter', (accs) => {
  /**
   * Test the minting process, which contains the following steps:
   *
   * 0) (NOT TESTED) Minter collect <address, amount> info;
   * 1) Foundation transfer ownership of ledger to minter;
   * 2) Minter mint the coins and verify the balances of each address;
   * 3) Minter transfer ownership back to foundation.
   */
  it("should not be able to mint", (done) => {
    util.deployAll().then((c) => {
      // transfer ownership
      c.ledger.changeOwner(accs[1]).then((txid) => {
        return c.ledger.acceptOwnership({from: accs[1]});
      }).then((txid) => {

        // check owner
        return c.ledger.owner();
      }).then((ret) => {
        assert(ret, accs[1]);

        // multimint
        const bits = [
          util.addressValue("0x1122334455667788112233445566778800000001", 1),
          util.addressValue("0x1122334455667788112233445566778800000002", 2)
        ];
        return c.ledger.multiMint(0, bits, {from: accs[1]});
      }).then((txid) => {

        // transfer ownership
        return c.ledger.changeOwner(accs[0], {from: accs[1]});
      }).then((txid) => {
        return c.ledger.acceptOwnership();
      }).then((txid) => {

        // check owner
        return c.ledger.owner();
      }).then((ret) => {
        assert(ret, accs[0]);

        // check balance
        return c.ledger.balanceOf("0x1122334455667788112233445566778800000001");
      }).then((ret) => {
        assert(ret, 1);
        return c.ledger.balanceOf("0x1122334455667788112233445566778800000002");
      }).then((ret) => {
        assert(ret, 2);
        done();
      });
    });
  });
});
