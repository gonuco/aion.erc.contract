# IToken

Source file [../../token/contracts/IToken.sol](../../token/contracts/IToken.sol).

<br />

<hr />

```javascript
// Copyright New Alchemy Limited, 2017. All rights reserved.

// BK Ok - Consider updating
pragma solidity >=0.4.10;

// BK Ok
contract IToken {
    // BK Ok
    function transfer(address _to, uint _value) returns (bool);
    // BK Ok
    function balanceOf(address owner) returns(uint);
}
```
