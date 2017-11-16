// Copyright New Alchemy Limited, 2017. All rights reserved.

pragma solidity >=0.4.10;

import './Owned.sol';

contract Finalizable is Owned {
    bool public finalized;

    function finalize() onlyOwner {
        finalized = true;
    }

    modifier notFinalized() {
        require(!finalized);
        _;
    }
}