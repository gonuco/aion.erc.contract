# Savings

Source file [../../trs/contracts/Savings.sol](../../trs/contracts/Savings.sol).

<br />

<hr />

```javascript
// Copyright New Alchemy Limited, 2017. All rights reserved.

// BK Ok - Consider updating
pragma solidity >=0.4.10;

// BK Ok
contract Token {
    // BK Next 3 Ok
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
// BK Ok
contract Savings {
	// periods is the raw number of withdrawal periods	
    // BK NOTE - Should use `PERIODS` instead of `periods`
    // BK Ok
	uint constant public periods = 36;
	// t0multiple is the numerator that determines what fraction
	// of total distributions is distributed in the first period,
	// where that fraction is (t0multiple / periods)
    // BK NOTE - Should use `T0SPECIAL` instead of `t0special`
    // BK Ok
	uint constant public t0special = 12;
    // BK NOTE - Should use `INTERVAL` instead of `interval`
	// BK Ok
	uint constant public interval = 10;  // block interval (FIXME: pick a number)

    // BK Ok
	event Deposit(address indexed who, uint amount);

    // BK Ok - Owned
	address public owner;
    // BK Ok - Owned
	address public newOwner;

    // BK Next 2 Ok
	bool public locked;
	uint public startblock;

    // BK Ok
	Token public token;

	// face value deposited by an address before locking
	// BK Ok
	mapping (address => uint) public deposited;

	// total face value deposited; sum of deposited
	// BK Ok
	uint public totalfv;

	// total tokens owned by the contract after locking
	// BK Ok
	uint public total;

	// number of times each address has withdrawn
	// BK Ok
	mapping (address => uint8) public withdrawals;

    // BK Ok - Constructor
	function Savings() {
	    // BK Ok
		assert(t0special > 0);
		// BK Ok
		assert(periods > 0);
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

    // BK Ok - Owned
	function changeOwner(address addr) onlyOwner {
	    // BK Ok
		newOwner = addr;
	}

    // BK Ok - Owned
	function acceptOwnership() {
	    // BK Ok
		require(msg.sender == newOwner);
		// BK Ok
		owner = newOwner;
        // BK NOTE - Should emit an event log like `event OwnershipTransferred(address indexed _from, address indexed _to);`
	}

    // BK Ok - Only owner can execute
	function setToken(address tok) onlyOwner {
	    // BK Ok
		token = Token(tok);
	}

	// lock is called by the owner to lock the savings
	// contract so that no more deposits may be made
	// BK Ok - Only owner can execute
	function lock() onlyOwner {
	    // BK Ok
		locked = true;
	}

	// start starts disbursement of savings;
	// it should be called after lock() once all
	// of the bonus tokens are sent to this contract
	// and multiMint has been called.
	// BK Ok - Only owner can execute
	function start(uint blockDelta) onlyOwner {
	    // BK Ok
		assert(locked && startblock == 0);
		// BK Ok
		startblock = block.number + blockDelta;
		// BK Ok
		total = token.balanceOf(this);
	}

	// if someone accidentally transfers tokens to this contract,
	// the owner can return them as long as distribution hasn't started
	// BK Ok - Only owner can call this before start block to withdraw tokens from this contract
	function sendTokens(address addr, uint amount) onlyOwner {
	    // BK Ok
		require(startblock == 0);
		// BK Ok
		token.transfer(addr, amount);
	}

    // BK Ok - Cannot send ETH
	function () {
	    // BK Ok
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
	// BK Ok - Anyone can call this to deposit tokens
	function deposit(uint tokens) {
	    // BK Ok
		depositTo(msg.sender, tokens);
	}


	// deposit tokens to be redeemed by another address
	// BK Ok - Anyone can call this to deposit tokens
	function depositTo(address beneficiary, uint tokens) {
	    // BK Ok
		require(!locked);
		// BK Ok
		require(token.transferFrom(msg.sender, this, tokens));
		// BK Ok
	    deposited[beneficiary] += tokens;
	    // BK Ok
		totalfv += tokens;
		// BK Ok
		Deposit(beneficiary, tokens);
	}

	// convenience function for owner: deposit on behalf of many
	// BK Ok - Only owner can call this
	function bulkDepositTo(uint256[] bits) onlyOwner {
	    // BK Ok
		uint256 lomask = (1 << 96) - 1;
		// BK Ok
		for (uint i=0; i<bits.length; i++) {
		    // BK Ok
			address a = address(bits[i]>>96);
			// BK Ok
			uint val = bits[i]&lomask;
			// BK Ok
			depositTo(a, val);
		}
	}

	// withdraw withdraws tokens to the sender
	//
	// withdraw can be called at most once per redemption period
	// BK Ok
	function withdraw() returns(bool) {
	    // BK Ok
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
	// BK Ok - Anyone can call
	function bulkWithdraw(address[] addrs) {
	    // BK Ok
		for (uint i=0; i<addrs.length; i++)
		    // BK Ok
			withdrawTo(addrs[i]);
	}

	// Code off the chain informs this contract about
	// tokens that were minted to it on behalf of a depositor.
	//
	// Note: the function signature here is known to New Alchemy's
	// tooling, which is why it is arguably misnamed.
	uint public mintingNonce;
	// BK Ok - Only owner can execute
	function multiMint(uint nonce, uint256[] bits) onlyOwner {
	    // BK Ok
		require(startblock == 0); // we should not have started disbursement yet
		// BK Ok
		if (nonce != mintingNonce) return;
		// BK Ok
		mintingNonce += 1;
		// BK Ok
		uint256 lomask = (1 << 96) - 1;
		// BK Ok
		uint sum = 0;
		// BK Ok
		for (uint i=0; i<bits.length; i++) {
		    // BK Ok
			address a = address(bits[i]>>96);
            // BK Ok
			uint value = bits[i]&lomask;
            // BK Ok
			deposited[a] += value;
            // BK Ok
			sum += value;
            // BK Ok - Log event
			Deposit(a, value);
		}
		// BK Ok
		totalfv += sum;
	}

}

```
