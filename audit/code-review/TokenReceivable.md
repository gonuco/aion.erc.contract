# TokenReceivable

Source file [../../token/contracts/TokenReceivable.sol](../../token/contracts/TokenReceivable.sol).

<br />

<hr />

```javascript
// Copyright New Alchemy Limited, 2017. All rights reserved.

pragma solidity >=0.4.10;

import './Owned.sol';
import './IToken.sol';

// In case someone accidentally sends token to one of these contracts,
// add a way to get them back out.
contract TokenReceivable is Owned {
    function claimTokens(address _token, address _to) onlyOwner returns (bool) {
        IToken token = IToken(_token);
        return token.transfer(_to, token.balanceOf(this));
    }
}

```
