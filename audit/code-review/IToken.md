# IToken

Source file [../../token/contracts/IToken.sol](../../token/contracts/IToken.sol).

<br />

<hr />

```javascript
// Copyright New Alchemy Limited, 2017. All rights reserved.

pragma solidity >=0.4.10;

contract IToken {
    function transfer(address _to, uint _value) returns (bool);
    function balanceOf(address owner) returns(uint);
}
```
