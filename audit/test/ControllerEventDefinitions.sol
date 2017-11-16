pragma solidity >=0.4.10;

contract ControllerEventDefinitions {
    /**
     * An internal burn event, emitted by the controller contract
     * which the bridges could be listening to.
     */
    event ControllerBurn(address indexed from, bytes32 indexed to, uint value);
}