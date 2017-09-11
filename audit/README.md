# Aion Token Contract Audit

## Summary

[Nuco](https://nuco.io/) is developing a token contract for it's [Aion network](https://aion.network/).

Bok Consulting Pty Ltd was commissioned to perform an audit on the Ethereum smart contracts for Nuco's Aion token.

This audit has been conducted on Nuco's source code in commit
[4c2dcc9](https://github.com/gonuco/aion.erc.contract/commit/4c2dcc92b4ba404211deb3bf0559eaa8d43b2e84).

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
  `newOwner = 0x0;` after a successful change in ownership. This will help improve the process and traceability of the ownership changes
* **LOW IMPORTANCE** Consider renaming `Pausable.unpause()` to `Pausable.unPause()`
* **LOW IMPORTANCE** Consider emitting an event log in `TokenReceivable.claimTokens(...)`

<br />

<hr />

## Code Review

* [x] [code-review/Owned.md](code-review/Owned.md)
  * [x] contract Owned 
* [x] [code-review/SafeMath.md](code-review/SafeMath.md)
  * [x] contract SafeMath 
* [x] [code-review/Finalizable.md](code-review/Finalizable.md)
  * [x] contract Finalizable is Owned 
* [x] [code-review/Pausable.md](code-review/Pausable.md)
  * [x] contract Pausable is Owned 
* [x] [code-review/IToken.md](code-review/IToken.md)
  * [x] contract IToken 
* [x] [code-review/EventDefinitions.md](code-review/EventDefinitions.md)
  * [x] contract EventDefinitions 
* [x] [code-review/ControllerEventDefinitions.md](code-review/ControllerEventDefinitions.md)
  * [x] contract ControllerEventDefinitions 
* [x] [code-review/TokenReceivable.md](code-review/TokenReceivable.md)
  * [x] contract TokenReceivable is Owned 
* [ ] [code-review/Ledger.md](code-review/Ledger.md)
  * [ ] contract Ledger is Owned, SafeMath, Finalizable 
* [ ] [code-review/Token.md](code-review/Token.md)
  * [ ] contract Token is Finalizable, TokenReceivable, SafeMath, EventDefinitions, Pausable 
* [ ] [code-review/Controller.md](code-review/Controller.md)
  * [ ] contract Controller is Owned, Finalizable, ControllerEventDefinitions 

<br />

### Code Not Reviewed

The following contracts are for testing and the testing framework:

* [ ] [code-review/Migrations.md](code-review/Migrations.md)
  * [ ] contract Migrations 
* [ ] [code-review/DummyToken.md](code-review/DummyToken.md)
  * [ ] contract DummyToken 
