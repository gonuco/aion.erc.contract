# Owned

Source file [../../token/contracts/Owned.sol](../../token/contracts/Owned.sol).

<br />

<hr />

```javascript
// Copyright New Alchemy Limited, 2017. All rights reserved.

// BK Ok - Consider updating
pragma solidity >=0.4.10;

// BK Ok
contract Owned {
    // BK Ok
    address public owner;
    // BK NOTE - Consider making public
    // BK Ok
    address newOwner;

    // BK Ok - Constructor
    function Owned() {
        // BK Ok
        owner = msg.sender;
    }

    // BK Ok
    modifier onlyOwner() {
        // BK Ok
        require(msg.sender == owner);
        // BK Ok
        _;
    }

    // BK Ok
    function changeOwner(address _newOwner) onlyOwner {
        // BK Ok
        newOwner = _newOwner;
    }

    // BK Ok
    function acceptOwnership() {
        // BK Ok
        if (msg.sender == newOwner) {
            // BK NOTE - Should emit an event log like `event OwnershipTransferred(address indexed _from, address indexed _to);`
            // BK Ok
            owner = newOwner;
            // BK NOTE - Can set `newOwner = 0x0;`
        }
    }
}
```
