const gas = require('../gas.js');

describe("gas utilities", () => {
  it("should get ethereum price to CAD", async () => {
    const price = await gas.ethPrice();
    console.log(price);
  });
});