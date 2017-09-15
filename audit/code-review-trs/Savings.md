# Savings

Source file [../../trs/contracts/Savings.sol](../../trs/contracts/Savings.sol).

<br />

<hr />

```javascript
// Copyright New Alchemy Limited, 2017. All rights reserved.

pragma solidity >=0.4.10;

contract Token {
	function transferFrom(address from, address to, uint amount) returns(bool);
	function transfer(address to, uint amount) returns(bool);
	function balanceOf(address addr) constant returns(uint);
}

// Savings is a contract that releases
// tokens on a fixed schedule, and allocates
// bonus tokens upon withdrawal on a pro-rata
// basis determined by the ratio of deposited tokens.
//
// DO NOT SEND TOKENS TO THIS CONTRACT. Use the deposit() or depositTo() method.
// As an exception, tokens sent to this contract before locking are the
// bonus tokens that are distributed.
contract Savings {
	// periods is the raw number of withdrawal periods
	uint constant public periods = 36;
	// t0multiple is the numerator that determines what fraction
	// of total distributions is distributed in the first period,
	// where that fraction is (t0multiple / periods)
	uint constant public t0special = 12;
	uint constant public interval = 10;  // block interval (FIXME: pick a number)

	event Deposit(address indexed who, uint amount);

	address public owner;
	address public newOwner;

	bool public locked;
	uint public startblock;

	Token public token;

	// face value deposited by an address before locking
	mapping (address => uint) public deposited;

	// total face value deposited; sum of deposited
	uint public totalfv;

	// total tokens owned by the contract after locking
	uint public total;

	// number of times each address has withdrawn
	mapping (address => uint8) public withdrawals;

	function Savings() {
		assert(t0special > 0);
		assert(periods > 0);
		owner = msg.sender;
	}

	modifier onlyOwner() {
		require(msg.sender == owner);
		_;
	}

	function changeOwner(address addr) onlyOwner {
		newOwner = addr;
	}

	function acceptOwnership() {
		require(msg.sender == newOwner);
		owner = newOwner;
	}

	function setToken(address tok) onlyOwner {
		token = Token(tok);
	}

	// lock is called by the owner to lock the savings
	// contract so that no more deposits may be made
	function lock() onlyOwner {
		locked = true;
	}

	// start starts disbursement of savings;
	// it should be called after lock() once all
	// of the bonus tokens are sent to this contract
	// and multiMint has been called.
	function start(uint blockDelta) onlyOwner {
		assert(locked && startblock == 0);
		startblock = block.number + blockDelta;
		total = token.balanceOf(this);
	}

	// if someone accidentally transfers tokens to this contract,
	// the owner can return them as long as distribution hasn't started
	function sendTokens(address addr, uint amount) onlyOwner {
		require(startblock == 0);
		token.transfer(addr, amount);
	}

	function () {
		revert();
	}

	// what withdrawal period are we in?
	// returns the period number from [0, periods)
	function period() constant returns(uint) {
		require(startblock != 0);

		// set a bottom limit of 0
		if (startblock > block.number)
			return 0;

		uint p = (block.number - startblock) / interval;
		if (p >= periods)
			p = periods-1;
		return p;
	}

	// deposit your tokens to be saved
	//
	// the despositor must have approve()'d the tokens
	// to be transferred by this contract
	function deposit(uint tokens) {
		depositTo(msg.sender, tokens);
	}


	// deposit tokens to be redeemed by another address
	function depositTo(address beneficiary, uint tokens) {
		require(!locked);
		require(token.transferFrom(msg.sender, this, tokens));
	    deposited[beneficiary] += tokens;
		totalfv += tokens;
		Deposit(beneficiary, tokens);
	}

	// convenience function for owner: deposit on behalf of many
	function bulkDepositTo(uint256[] bits) onlyOwner {
		uint256 lomask = (1 << 96) - 1;
		for (uint i=0; i<bits.length; i++) {
			address a = address(bits[i]>>96);
			uint val = bits[i]&lomask;
			depositTo(a, val);
		}
	}

	// withdraw withdraws tokens to the sender
	//
	// withdraw can be called at most once per redemption period
	function withdraw() returns(bool) {
		return withdrawTo(msg.sender);
	}

	function withdrawTo(address addr) returns(bool) {
		if (!locked || startblock == 0)
			return false; // can't withdraw before locking

		uint b = total;
		uint d = totalfv;
		uint p = period();
		uint8 w = withdrawals[addr];

		// the sender can only withdraw once per period,
		// and only 'periods' times
		if (w > (p + 1) || w >= (periods + 1))
			return false;

		// covers the corner case where repeated withdrawals
		// are attempted before the first period is started
		if (w == 1 && (block.number < startblock))
			return false;

		// total amount owed, including bonus:
		// (deposited[addr] / d) is the fraction of deposited tokens
		// b is bonus plus total deposited
		//
		// since sum(deposited) = d, then
		//       sum(deposited) * (b / d) = d * (b / d)
		//       sum((deposited * b) / d) = b
		//
		// so this is guaranteed to distribute all of the tokens,
		// minus any roundoff error that accumulates from the
		// division operations
		assert(b >= d);
		uint owed = (deposited[addr] * b) / d;

		uint special = 0;
		if (w == 0) {
			special = t0special;
			w = 1;
		}

		// increment p by 2 to account for the (w == 0) being 
		// a special state
		uint ps = 2 + p - w;
		// if this is before the monthly start time, simply set ps to 0
		if (block.number < startblock) {
			ps = 0;
		}

		// (ps / totalperiods) is fraction of total to be distributed;
		// owed is amount to be distributed;
		// (ps / totalperiods) * owed =
		uint amount = ((ps + special) * owed) / (t0special + periods);

		withdrawals[addr] = w + uint8(ps);
		require(token.transfer(addr, amount));
		return true;
	}

	// force withdrawal to many addresses
	function bulkWithdraw(address[] addrs) {
		for (uint i=0; i<addrs.length; i++)
			withdrawTo(addrs[i]);
	}

	// Code off the chain informs this contract about
	// tokens that were minted to it on behalf of a depositor.
	//
	// Note: the function signature here is known to New Alchemy's
	// tooling, which is why it is arguably misnamed.
	uint public mintingNonce;
	function multiMint(uint nonce, uint256[] bits) onlyOwner {
		require(startblock == 0); // we should not have started disbursement yet
		if (nonce != mintingNonce) return;
		mintingNonce += 1;
		uint256 lomask = (1 << 96) - 1;
		uint sum = 0;
		for (uint i=0; i<bits.length; i++) {
			address a = address(bits[i]>>96);
			uint value = bits[i]&lomask;
			deposited[a] += value;
			sum += value;
			Deposit(a, value);
		}
		totalfv += sum;
	}

}

```
