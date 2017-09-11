let Token = artifacts.require("./Token.sol");
let Controller = artifacts.require('./Controller.sol');
let Ledger = artifacts.require("./Ledger.sol");

let deployed = {
  token: null,
  controller: null,
  ledger: null
}

contract('Deployer', function(accounts) {
  it("should be able to deploy/link contracts and transfer ownership", function() {
    // deploy token
    return Token.new().then((instance) => {
      deployed.token = instance;

      // deploy controller
      return Controller.new();
    }).then((instance) => {
      deployed.controller = instance;

      // deploy ledger
      return Ledger.new();
    }).then((instance) => {
      deployed.ledger = instance;

      // check addresses of deployed contracts
      assert.notEqual(deployed.token.address, null);
      assert.notEqual(deployed.controller.address, null);
      assert.notEqual(deployed.ledger.address, null);

      // link controller and ledger
      return deployed.controller.setLedger(deployed.ledger.address);
    }).then((tx) => {
      return deployed.ledger.setController(deployed.controller.address);
    }).then((tx) => {

      // link controller and token
      return deployed.controller.setToken(deployed.token.address);
    }).then((tx) => {
      return deployed.token.setController(deployed.controller.address);
    }).then((tx) => {

      // check linking results
      return deployed.token.controller();
    }).then((ret) => {
      assert.equal(ret, deployed.controller.address);
      return deployed.controller.token();
    }).then((ret) => {
      assert.equal(ret, deployed.token.address);
      return deployed.controller.ledger();
    }).then((ret) => {
      assert.equal(ret, deployed.ledger.address);
      return deployed.token.controller();
    }).then((ret) => {
      assert.equal(ret, deployed.controller.address);

      // transfer ownership of token contract
      return deployed.token.changeOwner(accounts[1]);
    }).then((tx) => {
      return deployed.token.acceptOwnership({from: accounts[1]});
    }).then((tx) => {
      return deployed.token.owner();
    }).then((ret) => {
      assert.equal(ret, accounts[1]);

      // transfer ownership of controller contract
      return deployed.controller.changeOwner(accounts[1]);
    }).then((tx) => {
      return deployed.controller.acceptOwnership({from: accounts[1]});
    }).then((tx) => {
      return deployed.controller.owner();
    }).then((ret) => {
      assert.equal(ret, accounts[1]);

      // transfer ownership of ledger contract
      return deployed.ledger.changeOwner(accounts[1]);
    }).then((tx) => {
      return deployed.ledger.acceptOwnership({from: accounts[1]});
    }).then((tx) => {
      return deployed.ledger.owner();
    }).then((ret) => {
      assert.equal(ret, accounts[1]);
    });
  })
});
