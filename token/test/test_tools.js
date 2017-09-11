let foundation = require('./foundation_tools.js');

describe('tools', () => {
  it("should output the correct length", (done) => {
    // no need to deploy contracts here
    // fake a ledger here
    let ledger = [];

    for (i = 0; i < 100; i++) {
      ledger.push({addr: i, value: i});
    }

    let outputLedger = []
    let ledgerFn = (addr) => {
      return new Promise((resolve, reject) => {
        outputLedger.push("hello");
        resolve(true);
      });
    }

    foundation.confirmBatch(ledger, ledgerFn).then((res) => {
      if (outputLedger.length != 100)
        assert.fail("output length mismatch");

      done();
    }, (err) => {
      assert.fail("expected the same verifications");
      done();
    });
  });

  it("should reject on any errors thrown by array promise fn", (done) => {
    let rejectFn = (input) => {
      return new Promise((resolve, reject) => {
        reject(true);
      });
    }

    foundation.confirmBatch([1], rejectFn).catch((res) => {
      console.log("caught expected rejection");
      done();
    });

  });
});