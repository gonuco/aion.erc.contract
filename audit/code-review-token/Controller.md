# Controller

Source file [../../token/contracts/Controller.sol](../../token/contracts/Controller.sol).

<br />

<hr />

```javascript
// Copyright New Alchemy Limited, 2017. All rights reserved.

// BK Ok - Consider updating
pragma solidity >=0.4.10;

// BK Next 5 Ok
import './Owned.sol';
import './Finalizable.sol';
import './Ledger.sol';
import './Token.sol';
import './ControllerEventDefinitions.sol';

/**
 * @title Controller for business logic between the ERC20 API and State
 *
 * Controller is responsible for the business logic that sits in between
 * the Ledger (model) and the Token (view). Presently, adherence to this model
 * is not strict, but we expect future functionality (Burning, Claiming) to adhere
 * to this model more closely.
 * 
 * The controller must be linked to a Token and Ledger to become functional.
 * 
 */
// BK Ok
contract Controller is Owned, Finalizable, ControllerEventDefinitions {
    // BK Ok
    Ledger public ledger;
    // BK Ok
    Token public token;
    // BK Ok
    address public burnAddress;

    // BK Ok - Constructor
    function Controller() {
    }

    // functions below this line are onlyOwner


    // BK Ok - Only owner can execute
    function setToken(address _token) onlyOwner {
        // BK Ok
        token = Token(_token);
    }

    // BK Ok - Only owner can execute
    function setLedger(address _ledger) onlyOwner {
        // BK Ok
        ledger = Ledger(_ledger);
    }

    /**
     * @dev         Sets the burn address burn values get moved to. Only call
     *              after token and ledger contracts have been hooked up. Ensures
     *              that all three values are set atomically.
     *             
     * @notice      New Functionality
     *
     * @param       _address    desired address
     *
     */
    // BK Ok - Only Owner can execute
    function setBurnAddress(address _address) onlyOwner {
        burnAddress = _address;
        ledger.setBurnAddress(_address);
        token.setBurnAddress(_address);
    }

    modifier onlyToken() {
        require(msg.sender == address(token));
        _;
    }

    modifier onlyLedger() {
        require(msg.sender == address(ledger));
        _;
    }

    function totalSupply() constant returns (uint) {
        return ledger.totalSupply();
    }

    function balanceOf(address _a) constant returns (uint) {
        return ledger.balanceOf(_a);
    }

    function allowance(address _owner, address _spender) constant returns (uint) {
        return ledger.allowance(_owner, _spender);
    }

    // functions below this line are onlyLedger

    // let the ledger send transfer events (the most obvious case
    // is when we mint directly to the ledger and need the Transfer()
    // events to appear in the token)
    function ledgerTransfer(address from, address to, uint val) onlyLedger {
        token.controllerTransfer(from, to, val);
    }

    // functions below this line are onlyToken

    function transfer(address _from, address _to, uint _value) onlyToken returns (bool success) {
        return ledger.transfer(_from, _to, _value);
    }

    function transferFrom(address _spender, address _from, address _to, uint _value) onlyToken returns (bool success) {
        return ledger.transferFrom(_spender, _from, _to, _value);
    }

    function approve(address _owner, address _spender, uint _value) onlyToken returns (bool success) {
        return ledger.approve(_owner, _spender, _value);
    }

    function increaseApproval (address _owner, address _spender, uint _addedValue) onlyToken returns (bool success) {
        return ledger.increaseApproval(_owner, _spender, _addedValue);
    }

    function decreaseApproval (address _owner, address _spender, uint _subtractedValue) onlyToken returns (bool success) {
        return ledger.decreaseApproval(_owner, _spender, _subtractedValue);
    }

    /**
     * End Original Contract
     * Below is new functionality
     */

    /**
     * @dev        Enables burning on the token contract
     */
    function enableBurning() onlyOwner {
        token.enableBurning();
    }

    /**
     * @dev        Disables burning on the token contract
     */
    function disableBurning() onlyOwner {
        token.disableBurning();
    }

    // public functions

    /**
     * @dev         
     *
     * @param       _from       account the value is burned from
     * @param       _to         the address receiving the value
     * @param       _amount     the value amount
     * 
     * @return      success     operation successful or not.
     */ 
    function burn(address _from, bytes32 _to, uint _amount) onlyToken returns (bool success) {
        if (ledger.transfer(_from, burnAddress, _amount)) {
            ControllerBurn(_from, _to, _amount);
            token.controllerBurn(_from, _to, _amount);
            return true;
        }
        return false;
    }

    /**
     * @dev         Implementation for claim mechanism. Note that this mechanism has not yet
     *              been implemented. This function is only here for future expansion capabilities.
     *              Presently, just returns false to indicate failure.
     *              
     * @notice      Only one of claimByProof() or claim() will potentially be activated in the future.
     *              Depending on the functionality required and route selected. 
     *
     * @param       _claimer    The individual claiming the tokens (also the recipient of said tokens).
     * @param       data        The input data required to release the tokens.
     * @param       success     The proofs associated with the data, to indicate the legitimacy of said data.
     * @param       number      The block number the proofs and data correspond to.
     *
     * @return      success     operation successful or not.
     * 
     */
    function claimByProof(address _claimer, bytes32[] data, bytes32[] proofs, uint256 number)
        onlyToken
        returns (bool success) {
        return false;
    }

    /**
     * @dev         Implementation for an alternative claim mechanism, in which the participant
     *              is not required to confirm through proofs. Note that this mechanism has not
     *              yet been implemented.
     *              
     * @notice      Only one of claimByProof() or claim() will potentially be activated in the future.
     *              Depending on the functionality required and route selected.
     * 
     * @param       _claimer    The individual claiming the tokens (also the recipient of said tokens).
     * 
     * @return      success     operation successful or not.
     */
    function claim(address _claimer) onlyToken returns (bool success) {
        return false;
    }
}
```
