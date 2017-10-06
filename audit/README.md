# Aion Token Contract Audit

Status: Checking the revamped *trs/Savings* contracts. Crowdsale and token contracts have been completed.

<br />

## Summary

[Nuco](https://nuco.io/) is developing a token contract for it's [Aion network](https://aion.network/).

Bok Consulting Pty Ltd was commissioned to perform an audit on the Ethereum smart contracts for Nuco's Aion token.

This audit has been conducted on Nuco's source code in commit
[4c2dcc9](https://github.com/gonuco/aion.erc.contract/commit/4c2dcc92b4ba404211deb3bf0559eaa8d43b2e84),
[17cfee9](https://github.com/gonuco/aion.erc.contract/commit/17cfee99792ba31f63e541445e8d6878a169e9c8),
[09632c2](https://github.com/gonuco/aion.erc.contract/commit/09632c24a322daa37c112c1d6349faa10888cc45),
[c64525e](https://github.com/gonuco/aion.erc.contract/commit/c64525ee9f071a15e1cbe14f51390cddc3dda90a),
[c3e7469](https://github.com/gonuco/aion.erc.contract/commit/c3e7469bacfa60e0acf0328adb5246e88c5ed94f),
[a0c0042](https://github.com/gonuco/aion.erc.contract/commit/a0c0042651a88919ed948f73cb6f2976bf9015f2),
[b671849](https://github.com/gonuco/aion.erc.contract/commit/b671849624602cbde70dd6e6c5ca022ba7fdfee1) and
[a93b81d](https://github.com/gonuco/aion.erc.contract/commit/a93b81d63ee986d5830a60e7640809ed3d09d213).

Note that the crowdsale contract will collect funds but will not issue tokens immediately. Nuco has an application
that will collect the crowdsale contract contribution events and will use this to generate the token balances in
the token contract.

No potential vulnerabilities have been identified in the crowdsale contract.

`TODO` - CHECK the savings contract.

Note that the savings contract has a `nullify()` function that will freeze most functionality in the contract, including any token balances
that have been deposited into the savings contract. The developer stated that Nuco would compensate token holders with locked tokens in 
the savings contracts through some other means as the withdrawal logic could be compromised in situations where the last resort `nullify()`
function needs to be executed.

<br />

### Crowdsale Mainnet Addresses

`{TBA}`

<br />

### Crowdsale Contract

The crowdsale contract consists of a single *sales/Sale* contract linked to 3 *sales/Receiver* contract. Participants
contribute funds to any of the 3 receivers and the funds will be collected in the sale contract. Events for each contribution are logged
and Nuco's application will generated the appropriate token balances in the token contract.

When the total amount contributed exceeds the soft cap, the end date/time of the crowdsale is brought forward to
`current time + SOFTCAP_TIME` (this constant is set to 4 hours in the contracts). Any amount of ethers can be contributed to the
crowdsale contract in this period.

<br />

### Token Contract

The token contract is [ERC20 token standard](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20-token-standard.md)
compliant with the following features:

* `decimals` is correctly defined as `uint8` instead of `uint256`
* `transfer(...)` and `transferFrom(...)` will return false if there is an error instead of throwing an error. A 0 value transfer will
  return true
* `transfer(...)` and `transferFrom(...)` have not been built with a check on the size of the data being passed. This check is
  not an effective check anyway - refer to [Smart Contract Short Address Attack Mitigation Failure](https://blog.coinfabrik.com/smart-contract-short-address-attack-mitigation-failure/)
* `approve(...)` does require that a non-zero approval limit be set to 0 before a new non-zero limit can be set. Refer to
  [this](https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729) for further information

<br />

### Savings Contract

The savings contract has some slightly complex calculation to determine the amounts that an account can withdraw at different periods.
These calculations are based on block numbers instead of Unix time and would be skewed by changes in block times. Due to the coming
Ice Age (Difficulty Bomb) and switch to the Proof of Stake, time based on block times will be difficult to estimate.

<br />

<hr />

## Table Of Contents

* [Summary](#summary)
  * [Crowdsale Mainnet Addresses](#crowdsale-mainnet-addresses)
  * [Crowdsale Contract](#crowdsale-contract)
  * [Token Contract](#token-contract)
  * [Savings Contract](#savings-contract)
* [Recommendations](#recommendations)
  * [First Version Recommendations](#first-version-recommendations)
  * [Savings Second Version Recommendations](#savings-second-version-recommendations)
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

### First Version Recommendations

* **LOW IMPORTANCE** Consider whether the code to check for the [Short Address Attack](https://blog.coinfabrik.com/smart-contract-short-address-attack-mitigation-failure/)
  is required. Here's [OpenZeppelin's Short Address Attack removal](https://github.com/OpenZeppelin/zeppelin-solidity/commit/e33d9bb41be136f12bc734aef1aa6fffbf54fa40)

  * [x] Removed in [c3e7469](https://github.com/gonuco/aion.erc.contract/commit/c3e7469bacfa60e0acf0328adb5246e88c5ed94f)

* **LOW IMPORTANCE** As stated in your main [README.md](../README.md), your target Solidity version is 0.4.15 . Consider updating your Solidity
  files to `pragma solidity >=0.4.15;` for people only reading your published source code (.e.g. from EtherScan.io)
  
  * [x] Developer decided against implementing this item

* **LOW IMPORTANCE** Consider making `Owned.newOwner` public and for the `acceptOwnership(...)` function to emit an event.
  See [example](https://github.com/bokkypoobah/GimliTokenContractAudit/blob/master/sol/Ownable.sol#L6-L32). It would also be good to add
  `newOwner = 0x0;` after a successful change in ownership. This will help improve the process and traceability of the ownership changes.
  The same applies to the dispersed *Owned* code in *sales/Receiver*, *sales/Sale* and *trs/Savings*

  * [x] Developer decided against implementing this item
  * [x] Implemented for *trs/Savings* in [a0c0042](https://github.com/gonuco/aion.erc.contract/commit/a0c0042651a88919ed948f73cb6f2976bf9015f2)

* **LOW IMPORTANCE** Consider renaming `Pausable.unpause()` to `Pausable.unPause()`

  * [x] Developer decided against implementing this item

* **LOW IMPORTANCE** Consider emitting an event log in `TokenReceivable.claimTokens(...)`

  * [x] Developer decided against implementing this item

* **LOW IMPORTANCE** The *token/Owned* functionality is mixed into *sales/Receiver*, *sales/Sale* and *trs/Savings*.
  Consider inheriting from *token/Owned* to simplify the code and separating functionality instead of reimplementing
  the functionality in each of *sales/Receiver*, *sales/Sale* and *trs/Savings*

  * [x] Developer decided against implementing this item

* **LOW IMPORTANCE** Subtraction from the source account and allowance should be executed before the addition to the
  destination account, in *token/Ledger*

  * [x] Developer decided against implementing this item

* **MEDIUM IMPORTANCE** *sales/Sale* currently accumulates any contributed ethers in the contract until the owner calls
  `withdrawSome()` or `withdraw()`. While the logic in *sales/Sale* is simple and seems be secure, this is a bespoke
  contract with little amount of review and testing conducted. Consider transferring ethers contributed to the contract
  immediately to a multisig or hardware wallet as these are more thoroughly tested wallets, to further reduce the risk
  of any potential vulnerabilities in these contracts

  * [x] Developer decided against implementing this item

*  **LOW IMPORTANCE** *trs/Savings* locks tokens based on block numbers. The actual time when accounts can withdraw their tokens
  can vary a lot, depending on the time between blocks. Use the Unix timestamp and `block.timestamp` instead of `block.number` and the
  withdrawal schedule will be predictable

  * [x] Revamp of *trs/Savings* in [a0c0042](https://github.com/gonuco/aion.erc.contract/commit/a0c0042651a88919ed948f73cb6f2976bf9015f2) to
    use timestamps

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

  * [x] Developer decided against implementing this item

* **LOW IMPORTANCE** The constants `periods`, `t0special` and `interval` should have uppercase names, e.g. `PERIODS` - in *trs/Savings*

  * [x] Developer decided against implementing this item

* **LOW IMPORTANCE** The comments in *trs/Savings* refer to `t0multiple` but there is no variable with that name

  * [x] Revamp of *trs/Savings* in [a0c0042](https://github.com/gonuco/aion.erc.contract/commit/a0c0042651a88919ed948f73cb6f2976bf9015f2)

<br />

### Savings Second Version Recommendations

There was a revamp of the to use timestamps instead of block numbers to define periods in the *trs/Savings* contract in
[a0c0042](https://github.com/gonuco/aion.erc.contract/commit/a0c0042651a88919ed948f73cb6f2976bf9015f2).

* **HIGH IMPORTANCE** `pause()` can be called by anyone. And there is no corresponding `unPause()`

  * [x] Fixed, renamed to `nullify()`, in [a93b81d](https://github.com/gonuco/aion.erc.contract/commit/a93b81d63ee986d5830a60e7640809ed3d09d213)

<br />

<hr />

## Potential Vulnerabilities

No potential vulnerabilities have been identified in the crowdsale and token contract.

`TODO` - CHECK the savings contract.

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
* [x] [code-review-token/Ledger.md](code-review-token/Ledger.md)
  * [x] contract Ledger is Owned, SafeMath, Finalizable 
* [x] [code-review-token/Token.md](code-review-token/Token.md)
  * [x] contract Token is Finalizable, TokenReceivable, SafeMath, EventDefinitions, Pausable 
* [x] [code-review-token/Controller.md](code-review-token/Controller.md)
  * [x] contract Controller is Owned, Finalizable, ControllerEventDefinitions 

Files from [../sales/contracts](../sales/contracts):

* [x] [code-review-sales/Receiver.md](code-review-sales/Receiver.md)
  * [x] contract Receiver 
* [x] [code-review-sales/Sale.md](code-review-sales/Sale.md)
  * [x] contract Sale 

Files from [../trs/contracts](../trs/contracts):

* [ ] [code-review-trs/Savings.md](code-review-trs/Savings.md)
  * [x] contract Token 
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

<br />

<br />

(c) BokkyPooBah / Bok Consulting Pty Ltd for Cindicator - Sep 29 2017. The MIT Licence.