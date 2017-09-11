let util = require('./util.js');


contract("Controller", (accs) => {

  it("should set the burnAddress for all contracts", (done) => {
    util.deployAll().then((c) => {
      c.controller.setBurnAddress(accs[0]).then((txid) => {
        return c.token.burnAddress();
      }).then((res) => {
        assert.equal(res, accs[0]);
        return c.controller.burnAddress();
      }).then((res) => {
        assert.equal(res, accs[0]);
        return c.ledger.burnAddress();
      }).then((res) => {
        assert.equal(res, accs[0]);
        done();
      });
    });
  });

  it("should not be able to set the burnAddress unless owner", (done) => {
    util.deployAll().then((c) => {
      c.controller.setBurnAddress.sendTransaction(accs[0], {from: accs[1]}).catch((err) => {
        console.log("error caught, cannot set burn address unless owner");
        done();
      });
    });
  });
});
