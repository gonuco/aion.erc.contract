// Copyright New Alchemy Limited, 2017. All rights reserved.
pragma solidity >=0.4.10;

contract Token {
	function transferFrom(address from, address to, uint amount) returns(bool);
	function transfer(address to, uint amount) returns(bool);
	function balanceOf(address addr) constant returns(uint);
}


/**
 * Savings is a contract that releases Tokens on a predefined
 * schedule, and allocates bonus tokens upon withdrawal on a
 * proportional basis, determined by the ratio of deposited tokens
 * to total owned tokens.
 *
 * The distribution schedule consists of a monthly withdrawal schedule
 * responsible for distribution 75% of the total savings, and a
 * one-off withdrawal event available before or at the start of the
 * withdrawal schedule, distributing 25% of the total savings.
 *
 * To be exact, upon contract deployment there may be a period of time in which
 * only the one-off withdrawal event is available, define this period of time as:
 * [timestamp(start), timestamp(startBlockTimestamp)),
 *
 * Then the periodic withdrawal range is defined as:
 * [timestamp(startBlockTimestamp), +inf)
 *
 * DO NOT SEND TOKENS TO THIS CONTRACT. Use the deposit() or depositTo() method.
 * As an exception, tokens transferred to this contract before locking are the
 * bonus tokens that are distributed.
 */
contract Savings {
	/**
	 * Periods is the total monthly withdrawable amount, not counting the
	 * special withdrawal. Periods MUST be divisible by 3, as
	 * t0special = periods / 3.
	 */
	uint public periods;

	/**
	 * t0special is an additional multiplier that determines what
	 * fraction of the total distribution is distributed in the
	 * one-off withdrawal event. It is used in conjunction with
	 * a periodic multiplier (p) to determine the total savings withdrawable
	 * to the user at that point in time.
	 *
	 * The value is not set, it is calculated based on periods
	 */
	uint public t0special;

	uint constant public intervalSecs = 30 days;
	uint constant public precision = 10 ** 18;

	event Deposit(address indexed who, uint amount);

	address public owner;
	address public newOwner;

	bool public inited;
	bool public locked;
	uint public startBlockTimestamp = 0;

	Token public token;

	// face value deposited by an address before locking
	mapping (address => uint) public deposited;

	// total face value deposited; sum of deposited
	uint public totalfv;

	// total tokens owned by the contract after locking
	uint public total;

	// the total value withdrawn
	mapping (address => uint256) public withdrawn;

	// pause indicator
	bool public paused;

	function Savings() {
		owner = msg.sender;
	}

	modifier notPaused() { require(!paused); _; }

	modifier onlyOwner() { require(msg.sender == owner); _; }

	modifier preLock() { require(!locked && startBlockTimestamp == 0); _; }

	/**
	 * Lock called, deposits no longer available.
	 */
	modifier postLock() { require(locked); _; }

	/**
	 * Prestart, state is after lock, before start
	 */
	modifier preStart() { require(locked && startBlockTimestamp == 0); _; }

	/**
	 * Start called, the savings contract is now finalized, and withdrawals
	 * are now permitted.
	 */
	modifier postStart() { require(locked && startBlockTimestamp != 0); _; }

	/**
	 * Uninitialized state, before init is called. Mainly used as a guard to
	 * finalize periods and t0special.
	 */
	modifier notInitialized() { require(!inited); _; }

	/**
	 * Post initialization state, mainly used to guarantee that
	 * periods and t0special have been set properly before starting
	 * the withdrawal process.
	 */
	modifier initialized() { require(inited); _; }

	/**
	 * Pause functionality is intended to be final
	 */
	function pause() onlyOwner {
		paused = true;
	}

	/**
	 * Initialization function, should be called after contract deployment. The
	 * addition of this function allows contract compilation to be simplified
	 * to one contract, instead of two.
	 *
	 * periods and t0special are finalized, and effectively invariant, after
	 * init is called for the first time.
	 */
	function init(uint _periods) onlyOwner notInitialized {
		require(_periods != 0 && (_periods % 3) == 0);
		periods = _periods;
		t0special = _periods / 3;
	}

	function finalizeInit() onlyOwner notInitialized {
		inited = true;
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

	/**
	 * Lock is called by the owner to lock the savings contract
	 * so that no more deposits may be made.
	 */
	function lock() onlyOwner {
		locked = true;
	}

	/**
	 * Starts the distribution of savings, it should be called
	 * after lock(), once all of the bonus tokens are send to this contract,
	 * and multiMint has been called.
	 */
	function start(uint _startBlockTimestamp) onlyOwner initialized preStart {
		startBlockTimestamp = _startBlockTimestamp;
		total = token.balanceOf(this);
	}

	/**
	 * Check withdrawal is live, useful for checking whether
	 * the savings contract is "live", withdrawal enabled, started.
	 */
	function isStarted() constant returns(bool) {
		return locked && startBlockTimestamp != 0;
	}

	// if someone accidentally transfers tokens to this contract,
	// the owner can return them as long as distribution hasn't started

	/**
	 * Used to refund users who accidentaly transferred tokens to this
	 * contract, only available before contract is locked
	 */
	function sendTokens(address addr, uint amount) onlyOwner preLock {
		token.transfer(addr, amount);
	}

	/**
	 * Revert under all conditions for fallback, cheaper mistakes
	 * in the future?
	 */
	function() {
		revert();
	}

	/**
	 * Calculates the monthly period, starting after the startBlockTimestamp,
	 * periodAt will return 0 for all timestamps before startBlockTimestamp.
	 *
	 * Therefore period 0 is the range of time in which we have called start(),
	 * but have not yet passed startBlockTimestamp. Period 1 is the
	 * first monthly period, and so-forth all the way until the last
	 * period == periods.
	 *
	 * NOTE: not guarded since no state modifications are made. However,
	 * it will return invalid data before the postStart state. It is
	 * up to the user to manually check that the contract is in
	 * postStart state.
	 */
	function periodAt(uint _blockTimestamp) constant returns(uint) {
		/**
		 * Lower bound, consider period 0 to be the time between
		 * start() and startBlockTimestamp
		 */
		if (startBlockTimestamp > _blockTimestamp)
			return 0;

		/**
		 * Calculate the appropriate period, and set an upper bound of
		 * periods - 1.
		 */
		uint p = ((_blockTimestamp - startBlockTimestamp) / intervalSecs) + 1;
		if (p > periods)
			p = periods;
		return p;
	}

	// what withdrawal period are we in?
	// returns the period number from [0, periods)
	function period() constant returns(uint) {
		return periodAt(block.timestamp);
	}

	// deposit your tokens to be saved
	//
	// the despositor must have approve()'d the tokens
	// to be transferred by this contract
	function deposit(uint tokens) notPaused {
		depositTo(msg.sender, tokens);
	}


	function depositTo(address beneficiary, uint tokens) preLock notPaused {
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
	// withdraw can be called at most once per redemption period
	function withdraw() notPaused returns(bool) {
		return withdrawTo(msg.sender);
	}

	/**
	 * Calculates the fraction of total (one-off + monthly) withdrawable
	 * given the current timestamp. No guards due to function being constant.
	 * Will output invalid data until the postStart state. It is up to the user
	 * to manually confirm contract is in postStart state.
	 */
	function availableForWithdrawalAt(uint256 blockTimestamp) constant returns (uint256) {
		/**
		 * Calculate the total withdrawable, giving a numerator with range:
		 * [0.25 * 10 ** 18, 1 * 10 ** 18]
		 */
		return ((t0special + periodAt(blockTimestamp)) * precision) / (t0special + periods);
	}

	/**
	 * Business logic of _withdrawTo, the code is separated this way mainly for
	 * testing. We can inject and test parameters freely without worrying about the
	 * blockchain model.
	 *
	 * NOTE: Since function is constant, no guards are applied. This function will give
	 * invalid outputs unless in postStart state. It is up to user to manually check
	 * that the correct state is given (isStart() == true)
	 */
	function _withdrawTo(uint _deposit, uint _withdrawn, uint _blockTimestamp) constant returns (uint) {
		uint256 fraction = availableForWithdrawalAt(_blockTimestamp);

		/**
		 * There are concerns that the multiplication could possibly
		 * overflow, however this should not be the case if we calculate
		 * the upper bound based on our known parameters:
		 *
		 * Lets assume the minted token amount to be 500 million (reasonable),
		 * given a precision of 8 decimal places, we get:
		 * deposited[addr] = 5 * (10 ** 8) * (10 ** 8) = 5 * (10 ** 16)
		 *
		 * The max for fraction = 10 ** 18, and the max for total is
		 * also 5 * (10 ** 16).
		 *
		 * Therefore:
		 * deposited[addr] * fraction * total = 2.5 * (10 ** 51)
		 *
		 * The maximum for a uint256 is = 1.15 * (10 ** 77)
		 */
		uint256 withdrawable = ((_deposit * fraction * total) / totalfv) / precision;

		// check that we can withdraw something
		if (withdrawable > _withdrawn) {
			return withdrawable - _withdrawn;
		}
		return 0;
	}

	/**
	 * Public facing withdrawTo, injects business logic with
	 * the correct model.
	 */
	function withdrawTo(address addr) postStart notPaused returns (bool) {
		uint _d = deposited[addr];
		uint _w = withdrawn[addr];

		uint diff = _withdrawTo(_d, _w, block.timestamp);

		// no withdrawal could be made
		if (diff == 0) {
			return false;
		}

		// check that we cannot withdraw more than max
		require((diff + _w) <= ((_d * total) / totalfv));

		// transfer and increment
		require(token.transfer(addr, diff));

		withdrawn[addr] += diff;
		return true;
	}

	// force withdrawal to many addresses
	function bulkWithdraw(address[] addrs) notPaused {
		for (uint i=0; i<addrs.length; i++)
			withdrawTo(addrs[i]);
	}

	// Code off the chain informs this contract about
	// tokens that were minted to it on behalf of a depositor.
	//
	// Note: the function signature here is known to New Alchemy's
	// tooling, which is why it is arguably misnamed.
	uint public mintingNonce;
	function multiMint(uint nonce, uint256[] bits) onlyOwner preLock {

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
