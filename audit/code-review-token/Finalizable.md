# Finalizable

Source file [../../token/contracts/Finalizable.sol](../../token/contracts/Finalizable.sol).

<br />

<hr />

```javascript
// Copyright New Alchemy Limited, 2017. All rights reserved.

// BK Ok - Consider updating
pragma solidity >=0.4.10;

// BK Ok
import './Owned.sol';

// BK Ok
contract Finalizable is Owned {
    // BK Ok
    bool public finalized;

    // BK Ok - Only owner can finalise
    function finalize() onlyOwner {
        // BK Ok
        finalized = true;
    }

    // BK Ok
    modifier notFinalized() {
        // BK Ok
        require(!finalized);
        // BK Ok
        _;
    }
}
```
