# ControllerEventDefinitions

Source file [../../token/contracts/ControllerEventDefinitions.sol](../../token/contracts/ControllerEventDefinitions.sol).

<br />

<hr />

```javascript
// BK Ok - Consider updating
pragma solidity >=0.4.10;

// BK Ok
contract ControllerEventDefinitions {
    /**
     * An internal burn event, emitted by the controller contract
     * which the bridges could be listening to.
     */
    // BK Ok - Called by Controller.burn(...)
    event ControllerBurn(address indexed from, bytes32 indexed to, uint value);
}
```
