# Token

Source file [../../token/contracts/Token.sol](../../token/contracts/Token.sol).

<br />

<hr />

```javascript
// BK Ok - Consider updating
pragma solidity >=0.4.10;

// BK Next 6 Ok
import './SafeMath.sol';
import './TokenReceivable.sol';
import './Finalizable.sol';
import './EventDefinitions.sol';
import './Pausable.sol';
import './Controller.sol';

// BK Ok
contract Token is Finalizable, TokenReceivable, SafeMath, EventDefinitions, Pausable {
    // Set these appropriately before you deploy
    // BK Next 3 Ok
    string constant public name = "AION";
    uint8 constant public decimals = 8;
    string constant public symbol = "AION";
    // BK Ok
    Controller public controller;
    // BK Next 2 Ok
    string public motd;
    event Motd(string message);

    // BK Next 2 Ok
    address public burnAddress; //@ATTENTION: set this to a correct value
    bool public burnable = false;

    // functions below this line are onlyOwner

    // set "message of the day"
    // BK Ok - Only owner can execute
    function setMotd(string _m) onlyOwner {
        // BK Ok
        motd = _m;
        // BK Ok - Log event
        Motd(_m);
    }

    // BK Ok - Only owner can execute, when not finalised
    function setController(address _c) onlyOwner notFinalized {
        // BK Ok
        controller = Controller(_c);
    }

    // functions below this line are public

    // BK Ok - Constant function
    function balanceOf(address a) constant returns (uint) {
        // BK Ok
        return controller.balanceOf(a);
    }

    // BK Ok - Constant function
    function totalSupply() constant returns (uint) {
        // BK Ok
        return controller.totalSupply();
    }

    // BK Ok - Constant function
    function allowance(address _owner, address _spender) constant returns (uint) {
        // BK Ok
        return controller.allowance(_owner, _spender);
    }

    // BK Ok - Pausable
    function transfer(address _to, uint _value) notPaused returns (bool success) {
        // BK Ok
        if (controller.transfer(msg.sender, _to, _value)) {
            // BK Ok - Log event
            Transfer(msg.sender, _to, _value);
            // BK Ok
            return true;
        }
        // BK Ok
        return false;
    }

    // BK Ok - Pausable
    function transferFrom(address _from, address _to, uint _value) notPaused returns (bool success) {
        // BK Ok
        if (controller.transferFrom(msg.sender, _from, _to, _value)) {
            // BK Ok
            Transfer(_from, _to, _value);
            // BK Ok
            return true;
        }
        // BK Ok
        return false;
    }

    // BK Ok - Pausable
    function approve(address _spender, uint _value) notPaused returns (bool success) {
        // promote safe user behavior
        // BK Ok
        if (controller.approve(msg.sender, _spender, _value)) {
            // BK Ok
            Approval(msg.sender, _spender, _value);
            // BK Ok
            return true;
        }
        // BK Ok
        return false;
    }

    // BK Ok - Pausable
    function increaseApproval (address _spender, uint _addedValue) notPaused returns (bool success) {
        // BK Ok
        if (controller.increaseApproval(msg.sender, _spender, _addedValue)) {
            // BK Ok
            uint newval = controller.allowance(msg.sender, _spender);
            // BK Ok
            Approval(msg.sender, _spender, newval);
            // BK Ok
            return true;
        }
        // BK Ok
        return false;
    }

    // BK Ok - Pausable
    function decreaseApproval (address _spender, uint _subtractedValue) notPaused returns (bool success) {
        // BK Ok
        if (controller.decreaseApproval(msg.sender, _spender, _subtractedValue)) {
            // BK Ok
            uint newval = controller.allowance(msg.sender, _spender);
            // BK Ok
            Approval(msg.sender, _spender, newval);
            // BK Ok
            return true;
        }
        // BK Ok
        return false;
    }

    // modifier onlyPayloadSize(uint numwords) {
    //     assert(msg.data.length >= numwords * 32 + 4);
    //     _;
    // }

    // functions below this line are onlyController

    // BK Ok
    modifier onlyController() {
        // BK Ok
        assert(msg.sender == address(controller));
        // BK Ok
        _;
    }

    // In the future, when the controller supports multiple token
    // heads, allow the controller to reconstitute the transfer and
    // approval history.

    // BK Ok - Only controller - emit Log
    function controllerTransfer(address _from, address _to, uint _value) onlyController {
        // BK Ok
        Transfer(_from, _to, _value);
    }

    // BK Ok - Only controller - emit log
    function controllerApprove(address _owner, address _spender, uint _value) onlyController {
        // BK Ok
        Approval(_owner, _spender, _value);
    }

    /**
     * @dev        Burn event possibly called by the controller on a burn. This is
     *             the public facing event that anyone can track, the bridges listen
     *             to an alternative event emitted by the controller.
     *
     * @param      _from   address that coins are burned from
     * @param      _to     address (on other network) that coins are received by
     * @param      _value  amount of value to be burned
     *
     * @return     { description_of_the_return_value }
     */
    // BK Ok - Only controller - emit log
    function controllerBurn(address _from, bytes32 _to, uint256 _value) onlyController {
        // BK Ok
        Burn(_from, _to, _value);
    }

    // BK Ok - Only controller - emit log
    function controllerClaim(address _claimer, uint256 _value) onlyController {
        // BK Ok
        Claimed(_claimer, _value);
    }

    /**
     * @dev        Sets the burn address to a new value
     *
     * @param      _address  The address
     *
     */
    // BK Ok - Only controller
    function setBurnAddress(address _address) onlyController {
        // BK Ok
        burnAddress = _address;
    }

    /**
     * @dev         Enables burning through burnable bool
     *
     */
    // BK Ok - Only controller
    function enableBurning() onlyController {
        // BK Ok
        burnable = true;
    }

    /**
     * @dev         Disables burning through burnable bool
     *
     */
    // BK Ok - Only controller
    function disableBurning() onlyController {
        // BK Ok
        burnable = false;
    }

    /**
     * @dev         Indicates that burning is enabled
     */
    // BK Ok
    modifier burnEnabled() {
        // BK Ok
        require(burnable == true);
        // BK Ok
        _;
    }

    /**
     * @dev         burn function, changed from original implementation. Public facing API
     *              indicating who the token holder wants to burn currency to and the amount.
     *
     * @param       _amount  The amount
     *
     */
    // BK Ok - Can be paused, burn can be disabled
    function burn(bytes32 _to, uint _amount) notPaused burnEnabled returns (bool success) {
        // BK Ok
        return controller.burn(msg.sender, _to, _amount);
    }

    /**
     * @dev         claim (quantumReceive) allows the user to "prove" some an ICT to the contract
     *              thereby thereby releasing the tokens into their account
     * 
     */
    // BK Ok - Can be paused, using the burn switch
    function claimByProof(bytes32[] data, bytes32[] proofs, uint256 number) notPaused burnEnabled returns (bool success) {
        // BK Ok
        return controller.claimByProof(msg.sender, data, proofs, number);
    }

    /**
     * @dev         Simplified version of claim, just requires user to call to claim.
     *              No proof is needed, which version is chosen depends on our bridging model.
     *
     * @return      
     */
    // BK Ok - Can be paused, using the burn switch
    function claim() notPaused burnEnabled returns (bool success) {
        // BK Ok
        return controller.claim(msg.sender);
    }
}
```
