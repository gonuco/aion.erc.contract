const Savings = artifacts.require("./Savings.sol");
const TokenMock = artifacts.require("./TokenMock.sol");
const ControllerMock = artifacts.require("./ControllerMock.sol");
const LedgerMock = artifacts.require("./LedgerMock.sol");
const DummyMock = artifacts.require("./DummyMock.sol");

module.exports = function(deployer) {
  deployer.deploy(Savings);
  deployer.deploy(TokenMock);
  deployer.deploy(ControllerMock);
  deployer.deploy(LedgerMock);
  deployer.deploy(DummyMock);
};
