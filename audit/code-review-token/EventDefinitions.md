# EventDefinitions

Source file [../../token/contracts/EventDefinitions.sol](../../token/contracts/EventDefinitions.sol).

<br />

<hr />

```javascript
// Copyright New Alchemy Limited, 2017. All rights reserved.

// BK Ok - Consider updating
pragma solidity >=0.4.10;

// BK Ok
contract EventDefinitions {
    // BK Ok
    event Transfer(address indexed from, address indexed to, uint value);
    // BK Ok
    event Approval(address indexed owner, address indexed spender, uint value);
    // BK Ok - Note the bytes32
    event Burn(address indexed from, bytes32 indexed to, uint value);
    // BK Ok
    event Claimed(address indexed claimer, uint value);
}
```
