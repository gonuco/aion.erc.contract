# Receiver

Source file [../../sales/contracts/Receiver.sol](../../sales/contracts/Receiver.sol).

<br />

<hr />

```javascript
// Copyright New Alchemy Limited, 2017. All rights reserved.
// BK Ok - Consider updating
pragma solidity >=0.4.10;

// BK Next 2 Ok
import './Token.sol';
import './Sale.sol';

// Receiver is the contract that takes contributions
// BK Ok
contract Receiver {
    // BK Next 3 Ok
    event StartSale();
    event EndSale();
    event EtherIn(address from, uint amount);

    // BK Ok - Owned
    address public owner;    // contract owner
    // BK Ok - Owned
    address public newOwner; // new contract owner for two-way ownership handshake
    // BK Ok
    string public notice;    // arbitrary public notice text

    // BK Ok
    Sale public sale;

    // BK Ok
    function Receiver() {
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

    // BK Ok
    modifier onlySale() {
        // BK Ok
        require(msg.sender == address(sale));
        // BK Ok
        _;
    }

    // BK Ok - Constant function
    function live() constant returns(bool) {
        // BK Ok
        return sale.live();
    }

    // callback from sale contract when the sale begins
    // BK Ok - Emitting event only
    function start() onlySale {
        // BK Ok
        StartSale();
    }

    // callback from sale contract when sale ends
    // BK Ok - Emitting event only
    function end() onlySale {
        // BK Ok
        EndSale();
    }

    // BK Ok
    function () payable {
        // forward everything to the sale contract
        // BK Ok - Log event
        EtherIn(msg.sender, msg.value);
        // BK Ok - Transferring ETH to trusted contract
        require(sale.call.value(msg.value)());
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

    // set the target sale address
    // BK Ok - Only owner can execute
    function setSale(address s) onlyOwner {
        // BK Ok
        sale = Sale(s);
    }

    // Ether gets sent to the main sale contract,
    // but tokens get sent here, so we still need
    // withdrawal methods.

    // withdraw tokens to owner
    // BK Ok - Only owner can call
    function withdrawToken(address token) onlyOwner {
        // BK Ok
        Token t = Token(token);
        // BK Ok
        require(t.transfer(msg.sender, t.balanceOf(this)));
    }

    // refund early/late tokens
    // BK Ok - Only owner can call
    function refundToken(address token, address sender, uint amount) onlyOwner {
        // BK Ok
        Token t = Token(token);
        // BK Ok
        require(t.transfer(sender, amount));
    }
}


```
