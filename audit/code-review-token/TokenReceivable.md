# TokenReceivable

Source file [../../token/contracts/TokenReceivable.sol](../../token/contracts/TokenReceivable.sol).

<br />

<hr />

```javascript
// Copyright New Alchemy Limited, 2017. All rights reserved.

// BK Ok - Consider updating
pragma solidity >=0.4.10;

// BK Next 2 Ok
import './Owned.sol';
import './IToken.sol';

// In case someone accidentally sends token to one of these contracts,
// add a way to get them back out.
// BK Ok
contract TokenReceivable is Owned {
    // BK Ok - Only owner can execute
    function claimTokens(address _token, address _to) onlyOwner returns (bool) {
        // BK Ok
        IToken token = IToken(_token);
        // BK NOTE - Consider emitting an event log `ClaimedTokens(_token, address, balance);`
        // BK Ok
        return token.transfer(_to, token.balanceOf(this));
    }
}

```
