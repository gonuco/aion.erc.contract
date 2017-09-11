# Aion Token Contract Audit

## Summary

TODO

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

<br />

<hr />

## Code Review

* [x] [code-review/Owned.md](code-review/Owned.md)
  * [x] contract Owned 
* [ ] [code-review/SafeMath.md](code-review/SafeMath.md)
  * [ ] contract SafeMath 
* [ ] [code-review/Finalizable.md](code-review/Finalizable.md)
  * [ ] contract Finalizable is Owned 
* [ ] [code-review/ControllerEventDefinitions.md](code-review/ControllerEventDefinitions.md)
  * [ ] contract ControllerEventDefinitions 
* [ ] [code-review/Controller.md](code-review/Controller.md)
  * [ ] contract Controller is Owned, Finalizable, ControllerEventDefinitions 
* [ ] [code-review/IToken.md](code-review/IToken.md)
  * [ ] contract IToken 
* [ ] [code-review/Ledger.md](code-review/Ledger.md)
  * [ ] contract Ledger is Owned, SafeMath, Finalizable 
* [ ] [code-review/Pausable.md](code-review/Pausable.md)
  * [ ] contract Pausable is Owned 
* [ ] [code-review/TokenReceivable.md](code-review/TokenReceivable.md)
  * [ ] contract TokenReceivable is Owned 
* [ ] [code-review/EventDefinitions.md](code-review/EventDefinitions.md)
  * [ ] contract EventDefinitions 
* [ ] [code-review/Token.md](code-review/Token.md)
  * [ ] contract Token is Finalizable, TokenReceivable, SafeMath, EventDefinitions, Pausable 

<br />

### Code Not Reviewed

The following contracts are for testing and the testing framework:

* [ ] [code-review/Migrations.md](code-review/Migrations.md)
  * [ ] contract Migrations 
* [ ] [code-review/DummyToken.md](code-review/DummyToken.md)
  * [ ] contract DummyToken 
