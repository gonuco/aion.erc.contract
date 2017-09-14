const Sale = artifacts.require("./Sale.sol");
const Receiver = artifacts.require("./Receiver.sol");

module.exports = function(deployer) {
    deployer.deploy(Sale);
    deployer.deploy(Receiver);
};