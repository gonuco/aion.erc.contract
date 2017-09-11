// Copyright New Alchemy Limited, 2017. All rights reserved.

pragma solidity >=0.4.10;

contract Owned {
    address public owner;
    address newOwner;

    function Owned() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function changeOwner(address _newOwner) onlyOwner {
        newOwner = _newOwner;
    }

    function acceptOwnership() {
        if (msg.sender == newOwner) {
            owner = newOwner;
        }
    }
}