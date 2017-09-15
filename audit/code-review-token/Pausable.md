# Pausable

Source file [../../token/contracts/Pausable.sol](../../token/contracts/Pausable.sol).

<br />

<hr />

```javascript
// Copyright New Alchemy Limited, 2017. All rights reserved.

// BK Ok - Consider updating
pragma solidity >=0.4.10;

// BK Ok
import './Owned.sol';

// BK Ok
contract Pausable is Owned {
    // BK Ok
    bool public paused;

    // BK Ok
    function pause() onlyOwner {
        // BK Ok
        paused = true;
    }

    // BK - CamelCase unPause()?
    // BK Ok
    function unpause() onlyOwner {
        // BK Ok
        paused = false;
    }

    // BK Ok
    modifier notPaused() {
        // BK Ok
        require(!paused);
        // BK Ok
        _;
    }
}
```
