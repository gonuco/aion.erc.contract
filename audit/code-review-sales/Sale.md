# Sale

Source file [../../sales/contracts/Sale.sol](../../sales/contracts/Sale.sol).

<br />

<hr />

```javascript
// Copyright New Alchemy Limited, 2017. All rights reserved.
// BK Ok - Consider updating
pragma solidity >=0.4.10;

// BK Next 2 Ok
import './Token.sol';
import './Receiver.sol';

// BK Ok
contract Sale {
    // once the balance of this contract exceeds the
    // soft-cap, the sale should stay open for no more
    // than this amount of time
    // BK Ok
    uint public constant SOFTCAP_TIME = 4 hours;

    // BK Ok - Owned
    address public owner;    // contract owner
    // BK Ok - Owned
    address public newOwner; // new contract owner for two-way ownership handshake
    // BK Ok
    string public notice;    // arbitrary public notice text
    // BK Next 4 Ok
    uint public start;       // start time of sale
    uint public end;         // end time of sale
    uint public cap;         // Ether hard cap
    uint public softcap;     // Ether soft cap
    // BK Ok
    bool public live;        // sale is live right now

    // BK Next 3 Ok
    Receiver public r0;
    Receiver public r1;
    Receiver public r2;

    function Sale() {
        // BK Ok - Owned
        owner = msg.sender;
    }

    // BK Ok - Owned
    modifier onlyOwner() {
        // BK Ok
        require(msg.sender == owner);
        // BK Ok
        _;
    }

    // tell the receivers that the sale has begun
    // BK Ok - Internal
    function emitBegin() internal {
        // BK Next 3 Ok
        r0.start();
        r1.start();
        r2.start();
    }

    // tell the receivers that the sale is over
    // BK Ok - Internal
    function emitEnd() internal {
        // BK Next 3 Ok
        r0.end();
        r1.end();
        r2.end();
    }

    // BK Ok - Payable
    function () payable {
        // only accept contributions from receiver contracts
        // BK Ok
        require(msg.sender == address(r0) || msg.sender == address(r1) || msg.sender == address(r2));
        // BK Ok
        require(block.timestamp >= start);

        // if we've gone past the softcap, make sure the sale
        // stays open for no longer than SOFTCAP_TIME past the current block
        // BK Ok
        if (this.balance > softcap && block.timestamp < end && (end - block.timestamp) > SOFTCAP_TIME)
            // BK Ok
            end = block.timestamp + SOFTCAP_TIME;

        // If we've reached end-of-sale conditions, accept
        // this as the last contribution and emit the EndSale event.
        // (Technically this means we allow exactly one contribution
        // after the end of the sale.)
        // Conversely, if we haven't started the sale yet, emit
        // the StartSale event.
        // BK Ok
        if (block.timestamp > end || this.balance > cap) {
            // BK Ok
            require(live);
            // BK Ok
            live = false;
            // BK Ok
            emitEnd();
        // BK Ok
        } else if (!live) {
            // BK Ok
            live = true;
            // BK Ok
            emitBegin();
        }
    }

    // BK Ok - Only owner can execute
    function init(uint _start, uint _end, uint _cap, uint _softcap) onlyOwner {
        // BK Next 4 Ok
        start = _start;
        end = _end;
        cap = _cap;
        softcap = _softcap;
    }

    // BK Ok - Only owner can execute
    function setReceivers(address a, address b, address c) onlyOwner {
        // BK Next 3 Ok
        r0 = Receiver(a);
        r1 = Receiver(b);
        r2 = Receiver(c);
    }

    // 1st half of ownership change
    // BK Ok - Owned
    function changeOwner(address next) onlyOwner {
        // BK Ok
        newOwner = next;
    }

    // 2nd half of ownership change
    // BK Ok - Owned
    function acceptOwnership() {
        // BK Ok
        require(msg.sender == newOwner);
        // BK Ok
        owner = msg.sender;
        // BK Ok
        newOwner = 0;
        // BK NOTE - Should emit an event log like `event OwnershipTransferred(address indexed _from, address indexed _to);`
    }

    // put some text in the contract
    // BK Ok - Only owner can execute
    function setNotice(string note) onlyOwner {
        // BK Ok
        notice = note;
    }

    // withdraw all of the Ether
    // BK Ok - Only owner can execute
    function withdraw() onlyOwner {
        // BK Ok
        msg.sender.transfer(this.balance);
    }

    // withdraw some of the Ether
    // BK Ok - Only owner can execute
    function withdrawSome(uint value) onlyOwner {
        // BK Ok
        require(value <= this.balance);
        // BK Ok
        msg.sender.transfer(value);
    }

    // withdraw tokens to owner
    // BK Ok - Only owner can execute
    function withdrawToken(address token) onlyOwner {
        // BK Ok
        Token t = Token(token);
        // BK Ok
        require(t.transfer(msg.sender, t.balanceOf(this)));
    }

    // refund early/late tokens
    // BK Ok - Only owner can execute
    function refundToken(address token, address sender, uint amount) onlyOwner {
        // BK Ok
        Token t = Token(token);
        // BK Ok
        require(t.transfer(sender, amount));
    }
}


```
