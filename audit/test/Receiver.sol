// Copyright New Alchemy Limited, 2017. All rights reserved.
pragma solidity >=0.4.10;

import './Token.sol';
import './Sale.sol';

// Receiver is the contract that takes contributions
contract Receiver {
    event StartSale();
    event EndSale();
    event EtherIn(address from, uint amount);

    address public owner;    // contract owner
    address public newOwner; // new contract owner for two-way ownership handshake
    string public notice;    // arbitrary public notice text

    Sale public sale;

    function Receiver() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlySale() {
        require(msg.sender == address(sale));
        _;
    }

    function live() constant returns(bool) {
        return sale.live();
    }

    // callback from sale contract when the sale begins
    function start() onlySale {
        StartSale();
    }

    // callback from sale contract when sale ends
    function end() onlySale {
        EndSale();
    }

    function () payable {
        // forward everything to the sale contract
        EtherIn(msg.sender, msg.value);
        require(sale.call.value(msg.value)());
    }

    // 1st half of ownership change
    function changeOwner(address next) onlyOwner {
        newOwner = next;
    }

    // 2nd half of ownership change
    function acceptOwnership() {
        require(msg.sender == newOwner);
        owner = msg.sender;
        newOwner = 0;
    }

    // put some text in the contract
    function setNotice(string note) onlyOwner {
        notice = note;
    }

    // set the target sale address
    function setSale(address s) onlyOwner {
        sale = Sale(s);
    }

    // Ether gets sent to the main sale contract,
    // but tokens get sent here, so we still need
    // withdrawal methods.

    // withdraw tokens to owner
    function withdrawToken(address token) onlyOwner {
        Token t = Token(token);
        require(t.transfer(msg.sender, t.balanceOf(this)));
    }

    // refund early/late tokens
    function refundToken(address token, address sender, uint amount) onlyOwner {
        Token t = Token(token);
        require(t.transfer(sender, amount));
    }
}

