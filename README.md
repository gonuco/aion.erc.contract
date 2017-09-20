# AION ERC20

Aion ERC20 token, ICO contracts and TRS contracts repository.

## Setup

Current setup is tested using the following configuration:

* EthereumJS TestRPC v4.1.0 (ganache-core: 1.1.1)
* Truffle v3.4.9
* Solidity v0.4.15+commit.bbb8e64f.Linux.g++
* Assuming ``pragma solidity >= 0.4.10``

## Testing

To do unit testing first run ``npm install`` in each directory (to install the local modules), run ``testrpc`` and finally navigate to the token folder and run the truffle tests through ``truffle test``. This document will be updated as more complex environment tests are added.
