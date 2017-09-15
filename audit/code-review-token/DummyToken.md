# DummyToken

Source file [../../token/contracts/DummyToken.sol](../../token/contracts/DummyToken.sol).

<br />

<hr />

```javascript
pragma solidity >=0.4.10;

/**
 * FOR TESTING PURPOSES ONLY
 * DO NOT AUDIT
 */
contract DummyToken {

    event DebugTransferEvent();
    event DebugBalanceOfEvent();

    function transfer(address _to, uint _value) returns (bool) {
        DebugTransferEvent();
        return true;
    }

    function balanceOf(address owner) returns(uint) {
        DebugBalanceOfEvent();
        return 42;
    }
}
```
