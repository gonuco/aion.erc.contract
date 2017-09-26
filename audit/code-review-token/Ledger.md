# Ledger

Source file [../../token/contracts/Ledger.sol](../../token/contracts/Ledger.sol).

<br />

<hr />

```javascript
// Copyright New Alchemy Limited, 2017. All rights reserved.

// BK Ok - Consider updating
pragma solidity >=0.4.10;

// BK Next 4 Ok
import './SafeMath.sol';
import './Owned.sol';
import './Finalizable.sol';
import './Controller.sol';

// BK Ok
contract Ledger is Owned, SafeMath, Finalizable {
    // BK Ok
    Controller public controller;
    // BK Ok
    mapping(address => uint) public balanceOf;
    // BK Ok
    mapping (address => mapping (address => uint)) public allowance;
    // BK Ok
    uint public totalSupply;
    // BK Ok
    uint public mintingNonce;
    // BK Ok
    bool public mintingStopped;

    /**
     * @notice: not yet used
     */
    // BK Ok
    mapping(uint256 => bytes32) public proofs;

    /**
     * @notice: not yet used
     */
    // BK Ok - Not used currently
    mapping(address => uint256) public locked;

    /**
     * @notice: not yet used
     */
    // BK Ok - Not used currently
    mapping(bytes32 => bytes32) public metadata;

    /**
     * Set by the controller to indicate where the transfers should go to on a burn
     */
    // BK Ok - Not used currently
    address public burnAddress;

    /**
     * Mapping allowing us to identify the bridge nodes, in the current setup
     * manipulation of this mapping is only accessible by the parameter.
     */
    // BK Ok - Not used currently
    mapping(address => bool) public bridgeNodes;

    // functions below this line are onlyOwner

    // BK Ok - Constructor
    function Ledger() {
    }

    // BK Ok - Only owner can set controller when not finalised
    function setController(address _controller) onlyOwner notFinalized {
        // BK Ok
        controller = Controller(_controller);
    }

    /**
     * @dev         To be called once minting is complete, disables minting.  
     */
    // BK Ok
    function stopMinting() onlyOwner {
        // BK Ok
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
    // BK CHECK bit operations
    function multiMint(uint nonce, uint256[] bits) onlyOwner {
        // BK Ok
        require(!mintingStopped);
        // BK Ok
        if (nonce != mintingNonce) return;
        // BK Ok
        mintingNonce += 1;
        // BK CHECK
        uint256 lomask = (1 << 96) - 1;
        // BK Ok
        uint created = 0;
        // BK Ok
        for (uint i=0; i<bits.length; i++) {
            // BK CHECK
            address a = address(bits[i]>>96);
            // BK CHECK
            uint value = bits[i]&lomask;
            // BK Ok
            balanceOf[a] = balanceOf[a] + value;
            // BK CHECK - Check event generated correctly
            controller.ledgerTransfer(0, a, value);
            // BK Ok
            created += value;
        }
        // BK Ok
        totalSupply += created;
    }

    // functions below this line are onlyController

    // BK Ok
    modifier onlyController() {
        // BK Ok
        require(msg.sender == address(controller));
        // BK Ok
        _;
    }

    // BK Ok - Only controller can execute
    function transfer(address _from, address _to, uint _value) onlyController returns (bool success) {
        // BK Ok - Insufficient balance
        if (balanceOf[_from] < _value) return false;

        // BK Ok
        balanceOf[_from] = safeSub(balanceOf[_from], _value);
        // BK Ok
        balanceOf[_to] = safeAdd(balanceOf[_to], _value);
        // BK Ok
        return true;
    }

    // BK Ok - Only controller can execute
    function transferFrom(address _spender, address _from, address _to, uint _value) onlyController returns (bool success) {
        // BK Ok - Insufficient balance
        if (balanceOf[_from] < _value) return false;

        // BK Ok
        var allowed = allowance[_from][_spender];
        // BK Ok - Insufficient allowance
        if (allowed < _value) return false;

        // BK NOTE - The addition statement should be executed after the subtraction statements generally
        // BK Ok
        balanceOf[_to] = safeAdd(balanceOf[_to], _value);
        // BK Ok
        balanceOf[_from] = safeSub(balanceOf[_from], _value);
        // BK Ok
        allowance[_from][_spender] = safeSub(allowed, _value);
        // BK Ok
        return true;
    }

    // BK Ok - Only controller can execute
    function approve(address _owner, address _spender, uint _value) onlyController returns (bool success) {
        // require user to set to zero before resetting to nonzero
        // BK Ok
        if ((_value != 0) && (allowance[_owner][_spender] != 0)) {
            // BK Ok - Could throw
            return false;
        }

        // BK Ok
        allowance[_owner][_spender] = _value;
        // BK Ok
        return true;
    }

    // BK Ok - Only controller can execute
    function increaseApproval (address _owner, address _spender, uint _addedValue) onlyController returns (bool success) {
        // BK Ok
        uint oldValue = allowance[_owner][_spender];
        // BK Ok
        allowance[_owner][_spender] = safeAdd(oldValue, _addedValue);
        // BK Ok
        return true;
    }

    // BK Ok - Only controller can execute
    function decreaseApproval (address _owner, address _spender, uint _subtractedValue) onlyController returns (bool success) {
        // BK Ok
        uint oldValue = allowance[_owner][_spender];
        // BK Ok
        if (_subtractedValue > oldValue) {
            // BK Ok
            allowance[_owner][_spender] = 0;
        // BK Ok
        } else {
            // BK Ok
            allowance[_owner][_spender] = safeSub(oldValue, _subtractedValue);
        }
        // BK Ok
        return true;
    }


    // BK Ok - Only controller can execute
    function setProof(uint256 _key, bytes32 _proof) onlyController {
        // BK Ok
        proofs[_key] = _proof;
    }

    // BK Ok - Only controller can execute
    function setLocked(address _key, uint256 _value) onlyController {
        // BK Ok
        locked[_key] = _value;
    }

    // BK Ok - Only controller can execute
    function setMetadata(bytes32 _key, bytes32 _value) onlyController {
        // BK Ok
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
    // BK Ok - Only controller can execute
    function setBurnAddress(address _address) onlyController {
        // BK Ok
        burnAddress = _address;
    }

    // BK Ok - Only controller can execute
    function setBridgeNode(address _address, bool enabled) onlyController {
        // BK Ok
        bridgeNodes[_address] = enabled;
    }
}

```
