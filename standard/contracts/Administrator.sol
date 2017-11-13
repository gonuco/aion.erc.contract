/**
 * Copyright (C) 2017 Aion Foundation
 */
pragma solidity ^0.4.15;

import {Owned} from './Owned.sol';

/**
 * Represents a contract that supports validated third parties, a basic use for this
 * would be a contract administrator that requires a third party perform some action.
 * 
 * Instead of the third party requiring ownership of the contract (potentially exposing
 * the contract to malicious activities), the owner defines certain actions the
 * party can take through the modifier.
 */
contract Administrator is Owned {
    
    mapping(address => bool) public admins;

    /**
     * Modifier implicitly assumes that Owner is automatically
     * an administrator, this fact cannot be changed.
     */
    modifier onlyAdministrator(address _address) {
        require(_address == owner || admins[_address]);
        _;
    }

    function addAdmin(address _address)
        onlyOwner
        external
    {
        require(_address != owner && !(admins[_address]));
        admins[_address] = true;
    }

    function delAdmin(address _address)
        onlyOwner
        external
    {
        require(_address != owner && admins[_address]);
        admins[_address] = false;
    }
}