# SafeMath

Source file [../../token/contracts/SafeMath.sol](../../token/contracts/SafeMath.sol).

<br />

<hr />

```javascript
// Copyright New Alchemy Limited, 2017. All rights reserved.

// BK Ok - Consider updating
pragma solidity >=0.4.10;

// from Zeppelin
// BK Ok
contract SafeMath {
    // BK Ok
    function safeMul(uint a, uint b) internal returns (uint) {
        // BK Ok
        uint c = a * b;
        // BK Ok
        require(a == 0 || c / a == b);
        // BK Ok
        return c;
    }

    // BK Ok
    function safeSub(uint a, uint b) internal returns (uint) {
        // BK Ok
        require(b <= a);
        // BK Ok
        return a - b;
    }

    // BK Ok
    function safeAdd(uint a, uint b) internal returns (uint) {
        // BK Ok
        uint c = a + b;
        // BK Ok
        require(c>=a && c>=b);
        // BK Ok
        return c;
    }
}
```
