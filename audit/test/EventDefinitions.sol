// Copyright New Alchemy Limited, 2017. All rights reserved.

pragma solidity >=0.4.10;

contract EventDefinitions {
    event Transfer(address indexed from, address indexed to, uint value);
    event Approval(address indexed owner, address indexed spender, uint value);
    event Burn(address indexed from, bytes32 indexed to, uint value);
    event Claimed(address indexed claimer, uint value);
}