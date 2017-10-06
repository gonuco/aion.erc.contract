# Token

Source file [../../sales/contracts/Token.sol](../../sales/contracts/Token.sol).

<br />

<hr />

```javascript
// Copyright New Alchemy Limited, 2017. All rights reserved.
pragma solidity>=0.4.10;

// Just the bits of ERC20 that we need.
contract Token {
    function balanceOf(address addr) returns(uint);
    function transfer(address to, uint amount) returns(bool);
}
```
