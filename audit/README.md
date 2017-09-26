# Aion Token Contract Audit

<br />

## Summary

[Nuco](https://nuco.io/) is developing a token contract for it's [Aion network](https://aion.network/).

Bok Consulting Pty Ltd was commissioned to perform an audit on the Ethereum smart contracts for Nuco's Aion token.

This audit has been conducted on Nuco's source code in commit
[4c2dcc9](https://github.com/gonuco/aion.erc.contract/commit/4c2dcc92b4ba404211deb3bf0559eaa8d43b2e84),
[17cfee9](https://github.com/gonuco/aion.erc.contract/commit/17cfee99792ba31f63e541445e8d6878a169e9c8),
[09632c2](https://github.com/gonuco/aion.erc.contract/commit/09632c24a322daa37c112c1d6349faa10888cc45),
[c64525e](https://github.com/gonuco/aion.erc.contract/commit/c64525ee9f071a15e1cbe14f51390cddc3dda90a) and
[c3e7469](https://github.com/gonuco/aion.erc.contract/commit/c3e7469bacfa60e0acf0328adb5246e88c5ed94f).

Note that the crowdsale contract will collect funds but will not issue tokens immediately. Nuco has an application
that will collect the crowdsale contract contribution events and will use this to generate the token balances in
the token contract.

No potential vulnerabilities have been identified in the crowdsale contract.

<br />

### Crowdsale Mainnet Addresses

`{TBA}`

<br />

### Crowdsale Contract

The crowdsale contract consists of a single *sales/Sale* contract linked to 3 *sales/Receiver* contract. Participants
contribute funds to any of the 3 receivers and the funds will be collected in the sale contract.

<br />

### Token Contract

<br />

### Savings Contract

<br />

<hr />

## Table Of Contents

* [Summary](#summary)
  * [Crowdsale Mainnet Addresses](#crowdsale-mainnet-addresses)
  * [Crowdsale Contract](#crowdsale-contract)
  * [Token Contract](#token-contract)
  * [Savings Contract](#savings-contract)
* [Recommendations](#recommendations)
* [Potential Vulnerabilities](#potential-vulnerabilities)
* [Scope](#scope)
* [Limitations](#limitations)
* [Due Diligence](#due-diligence)
* [Risks](#risks)
* [Testing](#testing)
  * [Test 1](#test-1)
  * [Test 2](#test-2)
* [Code Review](#code-review)
  * [Code Not Reviewed](#code-not-reviewed)

<br />

<hr />

## Recommendations

* **LOW IMPORTANCE** Consider whether the code to check for the [Short Address Attack](https://blog.coinfabrik.com/smart-contract-short-address-attack-mitigation-failure/)
  is required. Here's [OpenZeppelin's Short Address Attack removal](https://github.com/OpenZeppelin/zeppelin-solidity/commit/e33d9bb41be136f12bc734aef1aa6fffbf54fa40)

  * [x] Removed in [c3e7469](https://github.com/gonuco/aion.erc.contract/commit/c3e7469bacfa60e0acf0328adb5246e88c5ed94f)

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
  of any potential vulnerabilities in these contracts
*  **LOW IMPORTANCE** *trs/Savings* locks tokens based on block numbers. The actual time when accounts can withdraw their tokens
  can vary a lot, depending on the time between blocks. Use the Unix timestamp and `block.timestamp` instead of `block.number` and the
  withdrawal schedule will be predictable
* **LOW IMPORTANCE** There are a few warnings emitted by the compiler as listed below. These warnings can be removed by commenting
  out the parameter names, like `function claimByProof(address /* _claimer */, bytes32[] /* data */, bytes32[] /* proofs */, uint256 /* number */)`:

      Controller.sol:165:27: Warning: Unused local variable
          function claimByProof(address _claimer, bytes32[] data, bytes32[] proofs, uint256 number)
                                ^--------------^
      Controller.sol:165:45: Warning: Unused local variable
          function claimByProof(address _claimer, bytes32[] data, bytes32[] proofs, uint256 number)
                                                  ^------------^
      Controller.sol:165:61: Warning: Unused local variable
          function claimByProof(address _claimer, bytes32[] data, bytes32[] proofs, uint256 number)
                                                                  ^--------------^
      Controller.sol:165:79: Warning: Unused local variable
          function claimByProof(address _claimer, bytes32[] data, bytes32[] proofs, uint256 number)
                                                                                    ^------------^
      Controller.sol:183:20: Warning: Unused local variable
          function claim(address _claimer) onlyToken returns (bool success) {
                         ^--------------^

<br />

<hr />

## Potential Vulnerabilities

TODO: Check - No potential vulnerabilities have been identified in the crowdsale and token contract.

<br />

<hr />

## Scope

This audit is into the technical aspects of the crowdsale contracts. The primary aim of this audit is to ensure that funds
contributed to these contracts are not easily attacked or stolen by third parties. The secondary aim of this audit is that
ensure the coded algorithms work as expected. This audit does not guarantee that that the code is bugfree, but intends to
highlight any areas of weaknesses.

<br />

<hr />

## Limitations

This audit makes no statements or warranties about the viability of the Nuco's business proposition, the individuals
involved in this business or the regulatory regime for the business model.

<br />

<hr />

## Due Diligence

As always, potential participants in any crowdsale are encouraged to perform their due diligence on the business proposition
before funding any crowdsales.

Potential participants are also encouraged to only send their funds to the official crowdsale Ethereum address, published on
the crowdsale beneficiary's official communication channel.

Scammers have been publishing phishing address in the forums, twitter and other communication channels, and some go as far as
duplicating crowdsale websites. Potential participants should NOT just click on any links received through these messages.
Scammers have also hacked the crowdsale website to replace the crowdsale contract address with their scam address.
 
Potential participants should also confirm that the verified source code on EtherScan.io for the published crowdsale address
matches the audited source code, and that the deployment parameters are correctly set, including the constant parameters.

<br />

<hr />

## Risks

* The risk of funds getting stolen or hacked from the *sales/Sale* contract is low as the contributed funds are accumulated
  in this simple contract with little room for vulnerabilities. This risk can be reduced even further by transferring all
  contributed funds immediately into a multisig or hardware wallet.

<br />

<hr />

## Testing

### Test 1
The following functions were tested using the script [test/01_test1.sh](test/01_test1.sh) with the summary results saved
in [test/test1results.txt](test/test1results.txt) and the detailed output saved in [test/test1output.txt](test/test1output.txt):

* [x] Deploy the *sales/Sale* and three *sales/Receiver* contracts
* [x] Link the *sales/Sale* and three *sales/Receiver* contracts together
* [x] Contribute to one *sales/Receiver* contract
* [x] `withdrawSome(...)` and `withdraw(...)` the ethers from the *sales/Sale* contract

<br />

### Test 2
The following functions were tested using the script [test/02_test2.sh](test/02_test2.sh) with the summary results saved
in [test/test2results.txt](test/test2results.txt) and the detailed output saved in [test/test2output.txt](test/test2output.txt):

* [x] Deploy the *token/Controller*, *token/Token* and *token/Ledger* contracts
* [x] Link the *token/Controller*, *token/Token* and *token/Ledger* contracts together
* [x] Mint tokens
* [x] `transfer(...)` and `transferFrom(...)` tokens

<br />

### Test 3
The following functions were tested using the script [test/03_test3.sh](test/03_test3.sh) with the summary results saved
in [test/test3results.txt](test/test3results.txt) and the detailed output saved in [test/test3output.txt](test/test3output.txt):

* [ ] Test the Savings contract

<br />

Details of the testing environment can be found in [test](test).

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
