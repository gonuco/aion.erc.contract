# Token

Source file [../../sales/contracts/Token.sol](../../sales/contracts/Token.sol).

<br />

<hr />

```javascript
// Copyright New Alchemy Limited, 2017. All rights reserved.
// BK Ok
pragma solidity>=0.4.10;

// Just the bits of ERC20 that we need.
// BK Ok
contract Token {
    // BK Ok
    function balanceOf(address addr) returns(uint);
    // BK Ok
    function transfer(address to, uint amount) returns(bool);
}
```
