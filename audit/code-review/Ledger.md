# Ledger

Source file [../../token/contracts/Ledger.sol](../../token/contracts/Ledger.sol).

<br />

<hr />

```javascript
// Copyright New Alchemy Limited, 2017. All rights reserved.

pragma solidity >=0.4.10;

import './SafeMath.sol';
import './Owned.sol';
import './Finalizable.sol';
import './Controller.sol';

contract Ledger is Owned, SafeMath, Finalizable {
    Controller public controller;
    mapping(address => uint) public balanceOf;
    mapping (address => mapping (address => uint)) public allowance;
    uint public totalSupply;
    uint public mintingNonce;
    bool public mintingStopped;

    /**
     * @notice: not yet used
     */
    mapping(uint256 => bytes32) public proofs;

    /**
     * @notice: not yet used
     */
    mapping(address => uint256) public locked;

    /**
     * @notice: not yet used
     */
    mapping(bytes32 => bytes32) public metadata;

    /**
     * Set by the controller to indicate where the transfers should go to on a burn
     */
    address public burnAddress;

    /**
     * Mapping allowing us to identify the bridge nodes, in the current setup
     * manipulation of this mapping is only accessible by the parameter.
     */
    mapping(address => bool) public bridgeNodes;

    // functions below this line are onlyOwner

    function Ledger() {
    }

    function setController(address _controller) onlyOwner notFinalized {
        controller = Controller(_controller);
    }

    /**
     * @dev         To be called once minting is complete, disables minting.  
     */
    function stopMinting() onlyOwner {
        mintingStopped = true;
    }

    /**
     * @dev         Used to mint a batch of currency at once.
     * 
     * @notice      This gives us a maximum of 2^96 tokens per user.
     * @notice      Expected packed structure is [ADDR(20) | VALUE(12)].
     *
     * @param       nonce   The minting nonce, an incorrect nonce is rejected.
     * @param       bits    An array of packed bytes of address, value mappings.  
     *
     */
    function multiMint(uint nonce, uint256[] bits) onlyOwner {
        require(!mintingStopped);
        if (nonce != mintingNonce) return;
        mintingNonce += 1;
        uint256 lomask = (1 << 96) - 1;
        uint created = 0;
        for (uint i=0; i<bits.length; i++) {
            address a = address(bits[i]>>96);
            uint value = bits[i]&lomask;
            balanceOf[a] = balanceOf[a] + value;
            controller.ledgerTransfer(0, a, value);
            created += value;
        }
        totalSupply += created;
    }

    // functions below this line are onlyController

    modifier onlyController() {
        require(msg.sender == address(controller));
        _;
    }

    function transfer(address _from, address _to, uint _value) onlyController returns (bool success) {
        if (balanceOf[_from] < _value) return false;

        balanceOf[_from] = safeSub(balanceOf[_from], _value);
        balanceOf[_to] = safeAdd(balanceOf[_to], _value);
        return true;
    }

    function transferFrom(address _spender, address _from, address _to, uint _value) onlyController returns (bool success) {
        if (balanceOf[_from] < _value) return false;

        var allowed = allowance[_from][_spender];
        if (allowed < _value) return false;

        balanceOf[_to] = safeAdd(balanceOf[_to], _value);
        balanceOf[_from] = safeSub(balanceOf[_from], _value);
        allowance[_from][_spender] = safeSub(allowed, _value);
        return true;
    }

    function approve(address _owner, address _spender, uint _value) onlyController returns (bool success) {
        // require user to set to zero before resetting to nonzero
        if ((_value != 0) && (allowance[_owner][_spender] != 0)) {
            return false;
        }

        allowance[_owner][_spender] = _value;
        return true;
    }

    function increaseApproval (address _owner, address _spender, uint _addedValue) onlyController returns (bool success) {
        uint oldValue = allowance[_owner][_spender];
        allowance[_owner][_spender] = safeAdd(oldValue, _addedValue);
        return true;
    }

    function decreaseApproval (address _owner, address _spender, uint _subtractedValue) onlyController returns (bool success) {
        uint oldValue = allowance[_owner][_spender];
        if (_subtractedValue > oldValue) {
            allowance[_owner][_spender] = 0;
        } else {
            allowance[_owner][_spender] = safeSub(oldValue, _subtractedValue);
        }
        return true;
    }


    function setProof(uint256 _key, bytes32 _proof) onlyController {
        proofs[_key] = _proof;
    }

    function setLocked(address _key, uint256 _value) onlyController {
        locked[_key] = _value;
    }

    function setMetadata(bytes32 _key, bytes32 _value) onlyController {
        metadata[_key] = _value;
    }

    /**
     * Burn related functionality
     */

    /**
     * @dev        sets the burn address to the new value
     *
     * @param      _address  The address
     *
     */
    function setBurnAddress(address _address) onlyController {
        burnAddress = _address;
    }

    function setBridgeNode(address _address, bool enabled) onlyController {
        bridgeNodes[_address] = enabled;
    }
}

```
