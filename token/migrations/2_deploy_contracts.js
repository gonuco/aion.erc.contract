var Ledger = artifacts.require("./Ledger.sol");
var Controller = artifacts.require("./Controller.sol");
var Token = artifacts.require("./Token.sol");

module.exports = function(deployer) {
    deployer.deploy(Ledger);
    deployer.deploy(Controller);
    deployer.deploy(Token);
};
