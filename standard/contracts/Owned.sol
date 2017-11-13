/**
 * Copyright (C) 2017 Aion Foundation
 */
pragma solidity ^0.4.15;

contract Owned {
    address public owner;
    address public newOwner;

    /**
     * Events
     */
    event ChangedOwner(address indexed new_owner);

    /**
     * Functionality
     */

    function Owned() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function changeOwner(address _newOwner) onlyOwner external {
        newOwner = _newOwner;
    }

    function acceptOwnership() external {
        if (msg.sender == newOwner) {
            owner = newOwner;
            newOwner = 0x0;
            ChangedOwner(owner);
        }
    }
}

contract IOwned {
    function owner() returns (address);
    function changeOwner(address);
    function acceptOwnership();
}