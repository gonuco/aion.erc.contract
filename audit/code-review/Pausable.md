# Pausable

Source file [../../token/contracts/Pausable.sol](../../token/contracts/Pausable.sol).

<br />

<hr />

```javascript
// Copyright New Alchemy Limited, 2017. All rights reserved.

pragma solidity >=0.4.10;

import './Owned.sol';

contract Pausable is Owned {
    bool public paused;

    function pause() onlyOwner {
        paused = true;
    }

    function unpause() onlyOwner {
        paused = false;
    }

    modifier notPaused() {
        require(!paused);
        _;
    }
}
```
