let util = require('./util.js');

contract('User', (accs) => {
  /**
   * This test suite tests how users interact with exchange, to buy/sell Aion token.
   *
   * Accounts:
   * [0]: UserA
   * [1]: Exchange
   * [2]: UserB
   *
   * Procedures:
   * 1) UserA can transfer token to the exchange, which will emit an event. After receiving
   *    the evnet, the Exchange will check the balance of receiving address (exchange assigns
   *    dedicated address for the user to deposit).
   * 2) Users can buy/sell token on exchange. NOT PART OF THE TEST
   * 3) UserB can withdraw the token he/she bought on the exchange, which require the exchange
   *    transfer token to the address of UserB.
   */
  it("should be able to exchange", (done) => {
    let totalSupply = 5000;
    let amount = 200;

    util.deployAll().then((c) => {
      let transferEvent = c.token.Transfer();

      // distribute tokens to userA
      c.ledger.multiMint(0, [util.addressValue(accs[0], totalSupply)]).then((txid) => {

        // transfer to exchange
        return c.token.transfer(accs[1], amount);
      }).then((txid) => {

        // a transfer event is emitted and caught by exchange
        return transferEvent.get();
      }).then((events) => {
        assert.equal(events[0].args.from, accs[0]);
        assert.equal(events[0].args.to, accs[1]);
        assert.equal(events[0].args.value.c[0], amount);

        // exchange verify the balance
        return c.token.balanceOf(accs[1], {from: accs[1]});
      }).then((ret) => {
        assert.equal(ret, amount);

        //============================================================
        // exchange update user balance database
        // userA and userB do exchange on the exchange's website
        //============================================================

        // exchange transfer token to userB afer a request of withdraw
        return c.token.transfer(accs[2], amount, {from: accs[1]});
      }).then((txid) => {

        // userB check the balance of his account
        return c.token.balanceOf(accs[2], {from: accs[2]});
      }).then((ret) => {
        assert.equal(ret, amount);
        done();
      });
    });
  });
});
