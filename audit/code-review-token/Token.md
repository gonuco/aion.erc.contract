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

contract Token is Finalizable, TokenReceivable, SafeMath, EventDefinitions, Pausable {
    // Set these appropriately before you deploy
    string constant public name = "FixMeBeforeDeploying";
    uint8 constant public decimals = 8;
    string constant public symbol = "FIXME";
    Controller public controller;
    string public motd;
    event Motd(string message);

    address public burnAddress; //@ATTENTION: set this to a correct value
    bool public burnable = false;

    // functions below this line are onlyOwner

    // set "message of the day"
    function setMotd(string _m) onlyOwner {
        motd = _m;
        Motd(_m);
    }

    function setController(address _c) onlyOwner notFinalized {
        controller = Controller(_c);
    }

    // functions below this line are public

    function balanceOf(address a) constant returns (uint) {
        return controller.balanceOf(a);
    }

    function totalSupply() constant returns (uint) {
        return controller.totalSupply();
    }

    function allowance(address _owner, address _spender) constant returns (uint) {
        return controller.allowance(_owner, _spender);
    }

    function transfer(address _to, uint _value) notPaused returns (bool success) {
        if (controller.transfer(msg.sender, _to, _value)) {
            Transfer(msg.sender, _to, _value);
            return true;
        }
        return false;
    }

    function transferFrom(address _from, address _to, uint _value) notPaused returns (bool success) {
        if (controller.transferFrom(msg.sender, _from, _to, _value)) {
            Transfer(_from, _to, _value);
            return true;
        }
        return false;
    }

    function approve(address _spender, uint _value) notPaused returns (bool success) {
        // promote safe user behavior
        if (controller.approve(msg.sender, _spender, _value)) {
            Approval(msg.sender, _spender, _value);
            return true;
        }
        return false;
    }

    function increaseApproval (address _spender, uint _addedValue) notPaused returns (bool success) {
        if (controller.increaseApproval(msg.sender, _spender, _addedValue)) {
            uint newval = controller.allowance(msg.sender, _spender);
            Approval(msg.sender, _spender, newval);
            return true;
        }
        return false;
    }

    function decreaseApproval (address _spender, uint _subtractedValue) notPaused returns (bool success) {
        if (controller.decreaseApproval(msg.sender, _spender, _subtractedValue)) {
            uint newval = controller.allowance(msg.sender, _spender);
            Approval(msg.sender, _spender, newval);
            return true;
        }
        return false;
    }

    // modifier onlyPayloadSize(uint numwords) {
    //     assert(msg.data.length >= numwords * 32 + 4);
    //     _;
    // }

    // functions below this line are onlyController

    modifier onlyController() {
        assert(msg.sender == address(controller));
        _;
    }

    // In the future, when the controller supports multiple token
    // heads, allow the controller to reconstitute the transfer and
    // approval history.

    function controllerTransfer(address _from, address _to, uint _value) onlyController {
        Transfer(_from, _to, _value);
    }

    function controllerApprove(address _owner, address _spender, uint _value) onlyController {
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
    function controllerBurn(address _from, bytes32 _to, uint256 _value) onlyController {
        Burn(_from, _to, _value);
    }

    function controllerClaim(address _claimer, uint256 _value) onlyController {
        Claimed(_claimer, _value);
    }

    /**
     * @dev        Sets the burn address to a new value
     *
     * @param      _address  The address
     *
     */
    function setBurnAddress(address _address) onlyController {
        burnAddress = _address;
    }

    /**
     * @dev         Enables burning through burnable bool
     *
     */
    function enableBurning() onlyController {
        burnable = true;
    }

    /**
     * @dev         Disables burning through burnable bool
     *
     */
    function disableBurning() onlyController {
        burnable = false;
    }

    /**
     * @dev         Indicates that burning is enabled
     */
    modifier burnEnabled() {
        require(burnable == true);
        _;
    }

    /**
     * @dev         burn function, changed from original implementation. Public facing API
     *              indicating who the token holder wants to burn currency to and the amount.
     *
     * @param       _amount  The amount
     *
     */
    function burn(bytes32 _to, uint _amount) notPaused burnEnabled returns (bool success) {
        return controller.burn(msg.sender, _to, _amount);
    }

    /**
     * @dev         claim (quantumReceive) allows the user to "prove" some an ICT to the contract
     *              thereby thereby releasing the tokens into their account
     * 
     */
    function claimByProof(bytes32[] data, bytes32[] proofs, uint256 number) notPaused burnEnabled returns (bool success) {
        return controller.claimByProof(msg.sender, data, proofs, number);
    }

    /**
     * @dev         Simplified version of claim, just requires user to call to claim.
     *              No proof is needed, which version is chosen depends on our bridging model.
     *
     * @return      
     */
    function claim() notPaused burnEnabled returns (bool success) {
        return controller.claim(msg.sender);
    }
}
```
