pragma solidity >=0.4.10;

import '../Savings.sol';

// NOT PART OF AUDIT
contract SavingsMock is Savings {
    // keep everything same, just override variable
    uint constant public periods = 4;
    uint constant public interval = 10;
}