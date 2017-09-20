# Aion Token Contract Audit

## Summary

[Nuco](https://nuco.io/) is developing a token contract for it's [Aion network](https://aion.network/).

Bok Consulting Pty Ltd was commissioned to perform an audit on the Ethereum smart contracts for Nuco's Aion token.

This audit has been conducted on Nuco's source code in commit
[4c2dcc9](https://github.com/gonuco/aion.erc.contract/commit/4c2dcc92b4ba404211deb3bf0559eaa8d43b2e84),
[17cfee9](https://github.com/gonuco/aion.erc.contract/commit/17cfee99792ba31f63e541445e8d6878a169e9c8),
[09632c2](https://github.com/gonuco/aion.erc.contract/commit/09632c24a322daa37c112c1d6349faa10888cc45) and
[c64525e](https://github.com/gonuco/aion.erc.contract/commit/c64525ee9f071a15e1cbe14f51390cddc3dda90a).

<br />

<hr />

## Table Of Contents

* [Summary](#summary)
* [Recommendations](#recommendations)
* [Code Review](#code-review)
  * [Code Not Reviewed](#code-not-reviewed)

<br />

<hr />

## Recommendations

* **LOW IMPORTANCE** Consider whether the code to check for the [Short Address Attack](https://blog.coinfabrik.com/smart-contract-short-address-attack-mitigation-failure/)
  is required. Here's [OpenZeppelin's Short Address Attack removal](https://github.com/OpenZeppelin/zeppelin-solidity/commit/e33d9bb41be136f12bc734aef1aa6fffbf54fa40)
* **LOW IMPORTANCE** As stated in your main [README.md](../README.md), your target Solidity version is 0.4.15 . Consider updating your Solidity
  files to `pragma solidity >=0.4.15;` for people only reading your published source code (.e.g. from EtherScan.io)
* **LOW IMPORTANCE** Consider making `Owned.newOwner` public and for the `acceptOwnership(...)` function to emit an event.
  See [example](https://github.com/bokkypoobah/GimliTokenContractAudit/blob/master/sol/Ownable.sol#L6-L32). It would also be good to add
  `newOwner = 0x0;` after a successful change in ownership. This will help improve the process and traceability of the ownership changes.
  The same applies to the dispersed *Owned* code in *sales/Receiver*, *sales/Sale* and *trs/Savings*
* **LOW IMPORTANCE** Consider renaming `Pausable.unpause()` to `Pausable.unPause()`
* **LOW IMPORTANCE** Consider emitting an event log in `TokenReceivable.claimTokens(...)`
* **LOW IMPORTANCE** The *token/Owned* functionality is mixed into *sales/Receiver*, *sales/Sale* and *trs/Savings*.
  Consider inheriting from *token/Owned* to simplify the code and separating functionality instead of reimplementing
  the functionality in each of *sales/Receiver*, *sales/Sale* and *trs/Savings*
* **LOW IMPORTANCE** Subtraction from the source account and allocance should be executed before the addition to the
  destination account
* **MEDIUM IMPORTANCE** *sales/Sale* currently accumulates any contributed ethers in the contract until the owner calls
  `withdrawSome()` or `withdraw()`. While the logic in *sales/Sale* is simple and seems be secure, this is a bespoke
  contract with little amount of review and testing conducted. Consider transferring ethers contributed to the contract
  immediately to a multisig or hardware wallet as these are more thoroughly tested wallets, to further reduce the risk
  of any potential vulnerabilities in these contracts.

<br />

<hr />

## Code Review

Files from [../token/contracts](../token/contracts):

* [x] [code-review-token/Owned.md](code-review-token/Owned.md)
  * [x] contract Owned 
* [x] [code-review-token/SafeMath.md](code-review-token/SafeMath.md)
  * [x] contract SafeMath 
* [x] [code-review-token/Finalizable.md](code-review-token/Finalizable.md)
  * [x] contract Finalizable is Owned 
* [x] [code-review-token/Pausable.md](code-review-token/Pausable.md)
  * [x] contract Pausable is Owned 
* [x] [code-review-token/IToken.md](code-review-token/IToken.md)
  * [x] contract IToken 
* [x] [code-review-token/EventDefinitions.md](code-review-token/EventDefinitions.md)
  * [x] contract EventDefinitions 
* [x] [code-review-token/ControllerEventDefinitions.md](code-review-token/ControllerEventDefinitions.md)
  * [x] contract ControllerEventDefinitions 
* [x] [code-review-token/TokenReceivable.md](code-review-token/TokenReceivable.md)
  * [x] contract TokenReceivable is Owned 
* [ ] [code-review-token/Ledger.md](code-review-token/Ledger.md)
  * [ ] contract Ledger is Owned, SafeMath, Finalizable 
* [ ] [code-review-token/Token.md](code-review-token/Token.md)
  * [ ] contract Token is Finalizable, TokenReceivable, SafeMath, EventDefinitions, Pausable 
* [ ] [code-review-token/Controller.md](code-review-token/Controller.md)
  * [ ] contract Controller is Owned, Finalizable, ControllerEventDefinitions 

Files from [../sales/contracts](../sales/contracts):

* [x] [code-review-sales/Receiver.md](code-review-sales/Receiver.md)
  * [x] contract Receiver 
* [x] [code-review-sales/Sale.md](code-review-sales/Sale.md)
  * [x] contract Sale 

Files from [../trs/contracts](../trs/contracts):

* [ ] [code-review-trs/Savings.md](code-review-trs/Savings.md)
  * [ ] contract Token 
  * [ ] contract Savings 

<br />

### Code Not Reviewed

The following contracts are for testing and the testing framework:

Files from [../token/contracts](../token/contracts):

* [ ] [code-review-token/Migrations.md](code-review-token/Migrations.md)
  * [ ] contract Migrations 
* [ ] [code-review-token/DummyToken.md](code-review-token/DummyToken.md)
  * [ ] contract DummyToken 

Files from [../sales/contracts](../sales/contracts):

* [ ] [code-review-sales/Migrations.md](code-review-sales/Migrations.md)
  * [ ] contract Migrations 
* [ ] [code-review-sales/Token.md](code-review-sales/Token.md)
  * [ ] contract Token 

Files from [../trs/contracts](../trs/contracts):

* [ ] [code-review-trs/Migrations.md](code-review-trs/Migrations.md)
  * [ ] contract Migrations 
