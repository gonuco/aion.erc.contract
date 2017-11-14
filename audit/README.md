# Aion Token Contract Audit

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
[b671849](https://github.com/gonuco/aion.erc.contract/commit/b671849624602cbde70dd6e6c5ca022ba7fdfee1),
[a93b81d](https://github.com/gonuco/aion.erc.contract/commit/a93b81d63ee986d5830a60e7640809ed3d09d213) and
[eefdc59](https://github.com/gonuco/aion.erc.contract/commit/eefdc596d2812272b05b144bb163f69fcb42aeca).

Note that the crowdsale contract will collect funds but will not issue tokens immediately. Nuco has an application
that will collect the crowdsale contract contribution events and will use this to generate the token balances in
the token contract.

No potential vulnerabilities have been identified in the crowdsale, token and savings contract.

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
  * [Test 3 36 Months](#test-3-36-months)
  * [Test 4 12 Months](#test-4-12-months)
  * [Test 5 12 Periods Of 30 Seconds](#test-5-12-periods-of-30-seconds)
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

* **LOW IMPORTANCE** Add events to log withdrawals to keep track of withdrawals and improve traceability

  * [x] Added in [eefdc59](https://github.com/gonuco/aion.erc.contract/commit/eefdc596d2812272b05b144bb163f69fcb42aeca)

<br />

<hr />

## Potential Vulnerabilities

No potential vulnerabilities have been identified in the crowdsale, token and savings contract.

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

### Test 3 36 Months
The following functions were tested using the script [test/03_test3.sh](test/03_test3.sh) with the summary results saved
in [test/test3results.txt](test/test3results.txt) and the detailed output saved in [test/test3output.txt](test/test3output.txt):

* [x] Deploy the *token/Controller*, *token/Token* and *token/Ledger* contracts
* [x] Link the *token/Controller*, *token/Token* and *token/Ledger* contracts together
* [x] Mint tokens
* [x] Deploy the *trs/Savings* contract
* [x] For the Savings contract, `.setTokens(...)` and `.init(36)`
* [x] Transfer 10,000 tokens to the Savings contract
* [x] `lock()`, `finalizeInit()` and `start(...)` the Savings contract
* [x] Print out `periodAt(...)`, `availableForWithdrawalAt(...)` and `_withdrawTo(...)` for the next 4 years, every 10 days. Results below:

      1507263611 Fri, 06 Oct 2017 04:20:11 UTC 0, 250000000000000000, 250000000000
      1508127611 Mon, 16 Oct 2017 04:20:11 UTC 1, 270833333333333333, 270833333333
      1508991611 Thu, 26 Oct 2017 04:20:11 UTC 1, 270833333333333333, 270833333333
      1509855611 Sun, 05 Nov 2017 04:20:11 UTC 1, 270833333333333333, 270833333333
      1510719611 Wed, 15 Nov 2017 04:20:11 UTC 2, 291666666666666666, 291666666666
      1511583611 Sat, 25 Nov 2017 04:20:11 UTC 2, 291666666666666666, 291666666666
      1512447611 Tue, 05 Dec 2017 04:20:11 UTC 2, 291666666666666666, 291666666666
      1513311611 Fri, 15 Dec 2017 04:20:11 UTC 3, 312500000000000000, 312500000000
      1514175611 Mon, 25 Dec 2017 04:20:11 UTC 3, 312500000000000000, 312500000000
      1515039611 Thu, 04 Jan 2018 04:20:11 UTC 3, 312500000000000000, 312500000000
      1515903611 Sun, 14 Jan 2018 04:20:11 UTC 4, 333333333333333333, 333333333333
      1516767611 Wed, 24 Jan 2018 04:20:11 UTC 4, 333333333333333333, 333333333333
      1517631611 Sat, 03 Feb 2018 04:20:11 UTC 4, 333333333333333333, 333333333333
      1518495611 Tue, 13 Feb 2018 04:20:11 UTC 5, 354166666666666666, 354166666666
      1519359611 Fri, 23 Feb 2018 04:20:11 UTC 5, 354166666666666666, 354166666666
      1520223611 Mon, 05 Mar 2018 04:20:11 UTC 5, 354166666666666666, 354166666666
      1521087611 Thu, 15 Mar 2018 04:20:11 UTC 6, 375000000000000000, 375000000000
      1521951611 Sun, 25 Mar 2018 04:20:11 UTC 6, 375000000000000000, 375000000000
      1522815611 Wed, 04 Apr 2018 04:20:11 UTC 6, 375000000000000000, 375000000000
      1523679611 Sat, 14 Apr 2018 04:20:11 UTC 7, 395833333333333333, 395833333333
      1524543611 Tue, 24 Apr 2018 04:20:11 UTC 7, 395833333333333333, 395833333333
      1525407611 Fri, 04 May 2018 04:20:11 UTC 7, 395833333333333333, 395833333333
      1526271611 Mon, 14 May 2018 04:20:11 UTC 8, 416666666666666666, 416666666666
      1527135611 Thu, 24 May 2018 04:20:11 UTC 8, 416666666666666666, 416666666666
      1527999611 Sun, 03 Jun 2018 04:20:11 UTC 8, 416666666666666666, 416666666666
      1528863611 Wed, 13 Jun 2018 04:20:11 UTC 9, 437500000000000000, 437500000000
      1529727611 Sat, 23 Jun 2018 04:20:11 UTC 9, 437500000000000000, 437500000000
      1530591611 Tue, 03 Jul 2018 04:20:11 UTC 9, 437500000000000000, 437500000000
      1531455611 Fri, 13 Jul 2018 04:20:11 UTC 10, 458333333333333333, 458333333333
      1532319611 Mon, 23 Jul 2018 04:20:11 UTC 10, 458333333333333333, 458333333333
      1533183611 Thu, 02 Aug 2018 04:20:11 UTC 10, 458333333333333333, 458333333333
      1534047611 Sun, 12 Aug 2018 04:20:11 UTC 11, 479166666666666666, 479166666666
      1534911611 Wed, 22 Aug 2018 04:20:11 UTC 11, 479166666666666666, 479166666666
      1535775611 Sat, 01 Sep 2018 04:20:11 UTC 11, 479166666666666666, 479166666666
      1536639611 Tue, 11 Sep 2018 04:20:11 UTC 12, 500000000000000000, 500000000000
      1537503611 Fri, 21 Sep 2018 04:20:11 UTC 12, 500000000000000000, 500000000000
      1538367611 Mon, 01 Oct 2018 04:20:11 UTC 12, 500000000000000000, 500000000000
      1539231611 Thu, 11 Oct 2018 04:20:11 UTC 13, 520833333333333333, 520833333333
      1540095611 Sun, 21 Oct 2018 04:20:11 UTC 13, 520833333333333333, 520833333333
      1540959611 Wed, 31 Oct 2018 04:20:11 UTC 13, 520833333333333333, 520833333333
      1541823611 Sat, 10 Nov 2018 04:20:11 UTC 14, 541666666666666666, 541666666666
      1542687611 Tue, 20 Nov 2018 04:20:11 UTC 14, 541666666666666666, 541666666666
      1543551611 Fri, 30 Nov 2018 04:20:11 UTC 14, 541666666666666666, 541666666666
      1544415611 Mon, 10 Dec 2018 04:20:11 UTC 15, 562500000000000000, 562500000000
      1545279611 Thu, 20 Dec 2018 04:20:11 UTC 15, 562500000000000000, 562500000000
      1546143611 Sun, 30 Dec 2018 04:20:11 UTC 15, 562500000000000000, 562500000000
      1547007611 Wed, 09 Jan 2019 04:20:11 UTC 16, 583333333333333333, 583333333333
      1547871611 Sat, 19 Jan 2019 04:20:11 UTC 16, 583333333333333333, 583333333333
      1548735611 Tue, 29 Jan 2019 04:20:11 UTC 16, 583333333333333333, 583333333333
      1549599611 Fri, 08 Feb 2019 04:20:11 UTC 17, 604166666666666666, 604166666666
      1550463611 Mon, 18 Feb 2019 04:20:11 UTC 17, 604166666666666666, 604166666666
      1551327611 Thu, 28 Feb 2019 04:20:11 UTC 17, 604166666666666666, 604166666666
      1552191611 Sun, 10 Mar 2019 04:20:11 UTC 18, 625000000000000000, 625000000000
      1553055611 Wed, 20 Mar 2019 04:20:11 UTC 18, 625000000000000000, 625000000000
      1553919611 Sat, 30 Mar 2019 04:20:11 UTC 18, 625000000000000000, 625000000000
      1554783611 Tue, 09 Apr 2019 04:20:11 UTC 19, 645833333333333333, 645833333333
      1555647611 Fri, 19 Apr 2019 04:20:11 UTC 19, 645833333333333333, 645833333333
      1556511611 Mon, 29 Apr 2019 04:20:11 UTC 19, 645833333333333333, 645833333333
      1557375611 Thu, 09 May 2019 04:20:11 UTC 20, 666666666666666666, 666666666666
      1558239611 Sun, 19 May 2019 04:20:11 UTC 20, 666666666666666666, 666666666666
      1559103611 Wed, 29 May 2019 04:20:11 UTC 20, 666666666666666666, 666666666666
      1559967611 Sat, 08 Jun 2019 04:20:11 UTC 21, 687500000000000000, 687500000000
      1560831611 Tue, 18 Jun 2019 04:20:11 UTC 21, 687500000000000000, 687500000000
      1561695611 Fri, 28 Jun 2019 04:20:11 UTC 21, 687500000000000000, 687500000000
      1562559611 Mon, 08 Jul 2019 04:20:11 UTC 22, 708333333333333333, 708333333333
      1563423611 Thu, 18 Jul 2019 04:20:11 UTC 22, 708333333333333333, 708333333333
      1564287611 Sun, 28 Jul 2019 04:20:11 UTC 22, 708333333333333333, 708333333333
      1565151611 Wed, 07 Aug 2019 04:20:11 UTC 23, 729166666666666666, 729166666666
      1566015611 Sat, 17 Aug 2019 04:20:11 UTC 23, 729166666666666666, 729166666666
      1566879611 Tue, 27 Aug 2019 04:20:11 UTC 23, 729166666666666666, 729166666666
      1567743611 Fri, 06 Sep 2019 04:20:11 UTC 24, 750000000000000000, 750000000000
      1568607611 Mon, 16 Sep 2019 04:20:11 UTC 24, 750000000000000000, 750000000000
      1569471611 Thu, 26 Sep 2019 04:20:11 UTC 24, 750000000000000000, 750000000000
      1570335611 Sun, 06 Oct 2019 04:20:11 UTC 25, 770833333333333333, 770833333333
      1571199611 Wed, 16 Oct 2019 04:20:11 UTC 25, 770833333333333333, 770833333333
      1572063611 Sat, 26 Oct 2019 04:20:11 UTC 25, 770833333333333333, 770833333333
      1572927611 Tue, 05 Nov 2019 04:20:11 UTC 26, 791666666666666666, 791666666666
      1573791611 Fri, 15 Nov 2019 04:20:11 UTC 26, 791666666666666666, 791666666666
      1574655611 Mon, 25 Nov 2019 04:20:11 UTC 26, 791666666666666666, 791666666666
      1575519611 Thu, 05 Dec 2019 04:20:11 UTC 27, 812500000000000000, 812500000000
      1576383611 Sun, 15 Dec 2019 04:20:11 UTC 27, 812500000000000000, 812500000000
      1577247611 Wed, 25 Dec 2019 04:20:11 UTC 27, 812500000000000000, 812500000000
      1578111611 Sat, 04 Jan 2020 04:20:11 UTC 28, 833333333333333333, 833333333333
      1578975611 Tue, 14 Jan 2020 04:20:11 UTC 28, 833333333333333333, 833333333333
      1579839611 Fri, 24 Jan 2020 04:20:11 UTC 28, 833333333333333333, 833333333333
      1580703611 Mon, 03 Feb 2020 04:20:11 UTC 29, 854166666666666666, 854166666666
      1581567611 Thu, 13 Feb 2020 04:20:11 UTC 29, 854166666666666666, 854166666666
      1582431611 Sun, 23 Feb 2020 04:20:11 UTC 29, 854166666666666666, 854166666666
      1583295611 Wed, 04 Mar 2020 04:20:11 UTC 30, 875000000000000000, 875000000000
      1584159611 Sat, 14 Mar 2020 04:20:11 UTC 30, 875000000000000000, 875000000000
      1585023611 Tue, 24 Mar 2020 04:20:11 UTC 30, 875000000000000000, 875000000000
      1585887611 Fri, 03 Apr 2020 04:20:11 UTC 31, 895833333333333333, 895833333333
      1586751611 Mon, 13 Apr 2020 04:20:11 UTC 31, 895833333333333333, 895833333333
      1587615611 Thu, 23 Apr 2020 04:20:11 UTC 31, 895833333333333333, 895833333333
      1588479611 Sun, 03 May 2020 04:20:11 UTC 32, 916666666666666666, 916666666666
      1589343611 Wed, 13 May 2020 04:20:11 UTC 32, 916666666666666666, 916666666666
      1590207611 Sat, 23 May 2020 04:20:11 UTC 32, 916666666666666666, 916666666666
      1591071611 Tue, 02 Jun 2020 04:20:11 UTC 33, 937500000000000000, 937500000000
      1591935611 Fri, 12 Jun 2020 04:20:11 UTC 33, 937500000000000000, 937500000000
      1592799611 Mon, 22 Jun 2020 04:20:11 UTC 33, 937500000000000000, 937500000000
      1593663611 Thu, 02 Jul 2020 04:20:11 UTC 34, 958333333333333333, 958333333333
      1594527611 Sun, 12 Jul 2020 04:20:11 UTC 34, 958333333333333333, 958333333333
      1595391611 Wed, 22 Jul 2020 04:20:11 UTC 34, 958333333333333333, 958333333333
      1596255611 Sat, 01 Aug 2020 04:20:11 UTC 35, 979166666666666666, 979166666666
      1597119611 Tue, 11 Aug 2020 04:20:11 UTC 35, 979166666666666666, 979166666666
      1597983611 Fri, 21 Aug 2020 04:20:11 UTC 35, 979166666666666666, 979166666666
      1598847611 Mon, 31 Aug 2020 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1599711611 Thu, 10 Sep 2020 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1600575611 Sun, 20 Sep 2020 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1601439611 Wed, 30 Sep 2020 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1602303611 Sat, 10 Oct 2020 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1603167611 Tue, 20 Oct 2020 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1604031611 Fri, 30 Oct 2020 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1604895611 Mon, 09 Nov 2020 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1605759611 Thu, 19 Nov 2020 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1606623611 Sun, 29 Nov 2020 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1607487611 Wed, 09 Dec 2020 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1608351611 Sat, 19 Dec 2020 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1609215611 Tue, 29 Dec 2020 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1610079611 Fri, 08 Jan 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1610943611 Mon, 18 Jan 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1611807611 Thu, 28 Jan 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1612671611 Sun, 07 Feb 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1613535611 Wed, 17 Feb 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1614399611 Sat, 27 Feb 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1615263611 Tue, 09 Mar 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1616127611 Fri, 19 Mar 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1616991611 Mon, 29 Mar 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1617855611 Thu, 08 Apr 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1618719611 Sun, 18 Apr 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1619583611 Wed, 28 Apr 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1620447611 Sat, 08 May 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1621311611 Tue, 18 May 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1622175611 Fri, 28 May 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1623039611 Mon, 07 Jun 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1623903611 Thu, 17 Jun 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1624767611 Sun, 27 Jun 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1625631611 Wed, 07 Jul 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1626495611 Sat, 17 Jul 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1627359611 Tue, 27 Jul 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1628223611 Fri, 06 Aug 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1629087611 Mon, 16 Aug 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1629951611 Thu, 26 Aug 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1630815611 Sun, 05 Sep 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1631679611 Wed, 15 Sep 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000
      1632543611 Sat, 25 Sep 2021 04:20:11 UTC 36, 1000000000000000000, 1000000000000

<br />

### Test 4 12 Months
The following functions were tested using the script [test/04_test4.sh](test/04_test4.sh) with the summary results saved
in [test/test4results.txt](test/test4results.txt) and the detailed output saved in [test/test4output.txt](test/test4output.txt):

* [x] Deploy the *token/Controller*, *token/Token* and *token/Ledger* contracts
* [x] Link the *token/Controller*, *token/Token* and *token/Ledger* contracts together
* [x] Mint tokens
* [x] Deploy the *trs/Savings* contract
* [x] For the Savings contract, `.setTokens(...)` and `.init(12)`
* [x] Transfer 10,000 tokens to the Savings contract
* [x] `lock()`, `finalizeInit()` and `start(...)` the Savings contract
* [x] Print out `periodAt(...)`, `availableForWithdrawalAt(...)` and `_withdrawTo(...)` for the next 400 days, every 10 days. Results below:

      
      1507264309 Fri, 06 Oct 2017 04:31:49 UTC 0, 250000000000000000, 250000000000
      1508128309 Mon, 16 Oct 2017 04:31:49 UTC 1, 312500000000000000, 312500000000
      1508992309 Thu, 26 Oct 2017 04:31:49 UTC 1, 312500000000000000, 312500000000
      1509856309 Sun, 05 Nov 2017 04:31:49 UTC 1, 312500000000000000, 312500000000
      1510720309 Wed, 15 Nov 2017 04:31:49 UTC 2, 375000000000000000, 375000000000
      1511584309 Sat, 25 Nov 2017 04:31:49 UTC 2, 375000000000000000, 375000000000
      1512448309 Tue, 05 Dec 2017 04:31:49 UTC 2, 375000000000000000, 375000000000
      1513312309 Fri, 15 Dec 2017 04:31:49 UTC 3, 437500000000000000, 437500000000
      1514176309 Mon, 25 Dec 2017 04:31:49 UTC 3, 437500000000000000, 437500000000
      1515040309 Thu, 04 Jan 2018 04:31:49 UTC 3, 437500000000000000, 437500000000
      1515904309 Sun, 14 Jan 2018 04:31:49 UTC 4, 500000000000000000, 500000000000
      1516768309 Wed, 24 Jan 2018 04:31:49 UTC 4, 500000000000000000, 500000000000
      1517632309 Sat, 03 Feb 2018 04:31:49 UTC 4, 500000000000000000, 500000000000
      1518496309 Tue, 13 Feb 2018 04:31:49 UTC 5, 562500000000000000, 562500000000
      1519360309 Fri, 23 Feb 2018 04:31:49 UTC 5, 562500000000000000, 562500000000
      1520224309 Mon, 05 Mar 2018 04:31:49 UTC 5, 562500000000000000, 562500000000
      1521088309 Thu, 15 Mar 2018 04:31:49 UTC 6, 625000000000000000, 625000000000
      1521952309 Sun, 25 Mar 2018 04:31:49 UTC 6, 625000000000000000, 625000000000
      1522816309 Wed, 04 Apr 2018 04:31:49 UTC 6, 625000000000000000, 625000000000
      1523680309 Sat, 14 Apr 2018 04:31:49 UTC 7, 687500000000000000, 687500000000
      1524544309 Tue, 24 Apr 2018 04:31:49 UTC 7, 687500000000000000, 687500000000
      1525408309 Fri, 04 May 2018 04:31:49 UTC 7, 687500000000000000, 687500000000
      1526272309 Mon, 14 May 2018 04:31:49 UTC 8, 750000000000000000, 750000000000
      1527136309 Thu, 24 May 2018 04:31:49 UTC 8, 750000000000000000, 750000000000
      1528000309 Sun, 03 Jun 2018 04:31:49 UTC 8, 750000000000000000, 750000000000
      1528864309 Wed, 13 Jun 2018 04:31:49 UTC 9, 812500000000000000, 812500000000
      1529728309 Sat, 23 Jun 2018 04:31:49 UTC 9, 812500000000000000, 812500000000
      1530592309 Tue, 03 Jul 2018 04:31:49 UTC 9, 812500000000000000, 812500000000
      1531456309 Fri, 13 Jul 2018 04:31:49 UTC 10, 875000000000000000, 875000000000
      1532320309 Mon, 23 Jul 2018 04:31:49 UTC 10, 875000000000000000, 875000000000
      1533184309 Thu, 02 Aug 2018 04:31:49 UTC 10, 875000000000000000, 875000000000
      1534048309 Sun, 12 Aug 2018 04:31:49 UTC 11, 937500000000000000, 937500000000
      1534912309 Wed, 22 Aug 2018 04:31:49 UTC 11, 937500000000000000, 937500000000
      1535776309 Sat, 01 Sep 2018 04:31:49 UTC 11, 937500000000000000, 937500000000
      1536640309 Tue, 11 Sep 2018 04:31:49 UTC 12, 1000000000000000000, 1000000000000
      1537504309 Fri, 21 Sep 2018 04:31:49 UTC 12, 1000000000000000000, 1000000000000
      1538368309 Mon, 01 Oct 2018 04:31:49 UTC 12, 1000000000000000000, 1000000000000
      1539232309 Thu, 11 Oct 2018 04:31:49 UTC 12, 1000000000000000000, 1000000000000
      1540096309 Sun, 21 Oct 2018 04:31:49 UTC 12, 1000000000000000000, 1000000000000
      1540960309 Wed, 31 Oct 2018 04:31:49 UTC 12, 1000000000000000000, 1000000000000

<br />

### Test 5 12 Periods Of 30 Seconds
The following functions were tested using the script [test/05_test5.sh](test/05_test5.sh) with the summary results saved
in [test/test5results.txt](test/test5results.txt) and the detailed output saved in [test/test5output.txt](test/test5output.txt):

* [x] Deploy the *token/Controller*, *token/Token* and *token/Ledger* contracts
* [x] Link the *token/Controller*, *token/Token* and *token/Ledger* contracts together
* [x] Mint tokens
* [x] Deploy the *trs/Savings* contract, with `intervalSecs = 30 days` changed to `intervalSecs = 30 seconds;`
* [x] For the Savings contract, `.setTokens(...)` and `.init(12)`
* [x] Transfer 10,000 tokens to the Savings contract, multisig top up with 1,000 tokens
* [x] `lock()`, `finalizeInit()` and `start(...)` the Savings contract
* [x] Print out `periodAt(...)`, `availableForWithdrawalAt(...)` and `_withdrawTo(...)` for the next 15 x 30 seconds period, every 30 seconds
* [x] Withdraw tokens for the 15 x 30 seconds periods, every 30 seconds. See [test/test5results.txt](test/test5results.txt) for the results.

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
* [x] [code-review-sales/Token.md](code-review-sales/Token.md)
  * [x] contract Token 

Files from [../trs/contracts](../trs/contracts):

* [x] [code-review-trs/Savings.md](code-review-trs/Savings.md)
  * [x] contract Token 
  * [x] contract Savings 

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

Files from [../trs/contracts](../trs/contracts):

* [ ] [code-review-trs/Migrations.md](code-review-trs/Migrations.md)
  * [ ] contract Migrations 

<br />

<br />

(c) BokkyPooBah / Bok Consulting Pty Ltd for Cindicator - Oct 06 2017. The MIT Licence.