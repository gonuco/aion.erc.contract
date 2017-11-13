# Savings Contract

TRS (Savings.sol) deployed on the mainnet under two addresses. They were compiled with the following options:

~~~~
solc --combined-json abi,bin,hashes,metadata --optimize -o build/ Savings.sol
~~~~

This resulted in the combined.json in this folder.

### Deployment

The contracts have been deployed, and are at address:

~~~~
TRS Deployment Addresses:
* TRS36: 0xB9FEABe628447D88a979A8417de36F2091Ff7c08
* TRS12: 0xF1C4b0a5286FF03cbA41b7FCAA92545bf34F9b63
~~~~

The initialization functionality (set periods) has been called:
~~~~
init(uint256)

https://etherscan.io/tx/0x39bf75570ae12812bd3c18bac72696e8e229002d70051b1b0a58c70190306077

https://etherscan.io/tx/0x085e33a61ac5fdb328b3720bc5bbd07da5187a74d52a10b6e45a86cc27616da7
~~~~

The token has also been set:
~~~~
setToken(address)

https://etherscan.io/tx/0x2da64c319aa21a94dd0fe8c0539e2e55e96888026433435edb57993b62a00ad7

https://etherscan.io/tx/0xb3baa147443e26b7e6b97d18425c14ae2a38e7a927286577dcbfc894eb39d179
~~~~