// Jun 12 2017
var ethPriceUSD = 380.39;

// -----------------------------------------------------------------------------
// Accounts
// -----------------------------------------------------------------------------
var accounts = [];
var accountNames = {};

addAccount(eth.accounts[0], "Account #0 - Miner");
addAccount(eth.accounts[1], "Account #1 - Contract Owner");
addAccount(eth.accounts[2], "Account #2 - Multisig");
addAccount(eth.accounts[3], "Account #3 - Precommit #1");
addAccount(eth.accounts[4], "Account #4 - Precommit #2");
addAccount(eth.accounts[5], "Account #5");
addAccount(eth.accounts[6], "Account #6");
addAccount(eth.accounts[7], "Account #7");
addAccount(eth.accounts[8], "Account #8");
// addAccount(eth.accounts[9], "Account #9 - Crowdfund Wallet");
// addAccount(eth.accounts[10], "Account #10 - Foundation");
// addAccount(eth.accounts[11], "Account #11 - Advisors");
// addAccount(eth.accounts[12], "Account #12 - Directors");
// addAccount(eth.accounts[13], "Account #13 - Early Backers");
// addAccount(eth.accounts[14], "Account #14 - Developers");
// addAccount(eth.accounts[15], "Account #15 - Precommitments");
// addAccount(eth.accounts[16], "Account #16 - Tranche 2 Locked");
// addAccount("0x0000000000000000000000000000000000000000", "Burn Account");



var minerAccount = eth.accounts[0];
var contractOwnerAccount = eth.accounts[1];
var multisig = eth.accounts[2];
var preCommitAccount1 = eth.accounts[3];
var preCommitAccount2 = eth.accounts[4];
var account5 = eth.accounts[5];
var account6 = eth.accounts[6];
var account7 = eth.accounts[7];
var account8 = eth.accounts[8];
// var crowdfundWallet = eth.accounts[9];
// var foundationAccount = eth.accounts[10];
// var advisorsAccount = eth.accounts[11];
// var directorsAccount = eth.accounts[12];
// var earlyBackersAccount = eth.accounts[13];
// var developersAccount = eth.accounts[14];
// var precommitmentsAccount = eth.accounts[15];
// var tranche2Account = eth.accounts[16];

var baseBlock = eth.blockNumber;

function unlockAccounts(password) {
  for (var i = 0; i < eth.accounts.length; i++) {
    personal.unlockAccount(eth.accounts[i], password, 100000);
  }
}

function addAccount(account, accountName) {
  accounts.push(account);
  accountNames[account] = accountName;
}


// -----------------------------------------------------------------------------
// Token Contract
// -----------------------------------------------------------------------------
var tokenContractAddress = null;
var tokenContractAbi = null;

function addTokenContractAddressAndAbi(address, tokenAbi) {
  tokenContractAddress = address;
  tokenContractAbi = tokenAbi;
}


// -----------------------------------------------------------------------------
// Account ETH and token balances
// -----------------------------------------------------------------------------
function printBalances() {
  var token = tokenContractAddress == null || tokenContractAbi == null ? null : web3.eth.contract(tokenContractAbi).at(tokenContractAddress);
  var decimals = token == null ? 18 : token.decimals();
  var i = 0;
  var totalTokenBalance = new BigNumber(0);
  console.log("RESULT:  # Account                                             EtherBalanceChange                          Token Name");
  console.log("RESULT: -- ------------------------------------------ --------------------------- ------------------------------ ---------------------------");
  accounts.forEach(function(e) {
    var etherBalanceBaseBlock = eth.getBalance(e, baseBlock);
    var etherBalance = web3.fromWei(eth.getBalance(e).minus(etherBalanceBaseBlock), "ether");
    var tokenBalance = token == null ? new BigNumber(0) : token.balanceOf(e).shift(-decimals);
    totalTokenBalance = totalTokenBalance.add(tokenBalance);
    console.log("RESULT: " + pad2(i) + " " + e  + " " + pad(etherBalance) + " " + padToken(tokenBalance, decimals) + " " + accountNames[e]);
    i++;
  });
  console.log("RESULT: -- ------------------------------------------ --------------------------- ------------------------------ ---------------------------");
  console.log("RESULT:                                                                           " + padToken(totalTokenBalance, decimals) + " Total Token Balances");
  console.log("RESULT: -- ------------------------------------------ --------------------------- ------------------------------ ---------------------------");
  console.log("RESULT: ");
}

function pad2(s) {
  var o = s.toFixed(0);
  while (o.length < 2) {
    o = " " + o;
  }
  return o;
}

function pad(s) {
  var o = s.toFixed(18);
  while (o.length < 27) {
    o = " " + o;
  }
  return o;
}

function padToken(s, decimals) {
  var o = s.toFixed(decimals);
  var l = parseInt(decimals)+12;
  while (o.length < l) {
    o = " " + o;
  }
  return o;
}


// -----------------------------------------------------------------------------
// Transaction status
// -----------------------------------------------------------------------------
function printTxData(name, txId) {
  var tx = eth.getTransaction(txId);
  var txReceipt = eth.getTransactionReceipt(txId);
  var gasPrice = tx.gasPrice;
  var gasCostETH = tx.gasPrice.mul(txReceipt.gasUsed).div(1e18);
  var gasCostUSD = gasCostETH.mul(ethPriceUSD);
  console.log("RESULT: " + name + " gas=" + tx.gas + " gasUsed=" + txReceipt.gasUsed + " costETH=" + gasCostETH +
    " costUSD=" + gasCostUSD + " @ ETH/USD=" + ethPriceUSD + " gasPrice=" + gasPrice + " block=" + 
    txReceipt.blockNumber + " txIx=" + tx.transactionIndex + " txId=" + txId);
}

function assertEtherBalance(account, expectedBalance) {
  var etherBalance = web3.fromWei(eth.getBalance(account), "ether");
  if (etherBalance == expectedBalance) {
    console.log("RESULT: OK " + account + " has expected balance " + expectedBalance);
  } else {
    console.log("RESULT: FAILURE " + account + " has balance " + etherBalance + " <> expected " + expectedBalance);
  }
}

function gasEqualsGasUsed(tx) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  return (gas == gasUsed);
}

function failIfGasEqualsGasUsed(tx, msg) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  if (gas == gasUsed) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    console.log("RESULT: PASS " + msg);
    return 1;
  }
}

function passIfGasEqualsGasUsed(tx, msg) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  if (gas == gasUsed) {
    console.log("RESULT: PASS " + msg);
    return 1;
  } else {
    console.log("RESULT: FAIL " + msg);
    return 0;
  }
}

function failIfGasEqualsGasUsedOrContractAddressNull(contractAddress, tx, msg) {
  if (contractAddress == null) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    var gas = eth.getTransaction(tx).gas;
    var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
    if (gas == gasUsed) {
      console.log("RESULT: FAIL " + msg);
      return 0;
    } else {
      console.log("RESULT: PASS " + msg);
      return 1;
    }
  }
}


//-----------------------------------------------------------------------------
// Controller Contract
//-----------------------------------------------------------------------------
var controllerContractAddress = null;
var controllerContractAbi = null;

function addControllerContractAddressAndAbi(address, abi) {
  controllerContractAddress = address;
  controllerContractAbi = abi;
}

var controllerFromBlock = 0;
function printControllerContractDetails() {
  console.log("RESULT: controllerContractAddress=" + controllerContractAddress);
  if (controllerContractAddress  != null && controllerContractAbi != null) {
    var contract = eth.contract(controllerContractAbi).at(controllerContractAddress);
    console.log("RESULT: controller.owner=" + contract.owner());
    console.log("RESULT: controller.ledger=" + contract.ledger());
    console.log("RESULT: controller.token=" + contract.token());
    console.log("RESULT: controller.burnAddress=" + contract.burnAddress());
    // console.log("RESULT: controller.newOwner=" + contract.newOwner());
    var decimals = contract.decimals();
    console.log("RESULT: controller.symbol=" + contract.symbol());
    console.log("RESULT: controller.name=" + contract.name());
    console.log("RESULT: controller.decimals=" + decimals);
    console.log("RESULT: controller.totalSupply=" + contract.totalSupply().shift(-18));
    var startDate = contract.STARTDATE();
    console.log("RESULT: controller.totalEthers=" + contract.totalEthers().shift(-18));
    console.log("RESULT: controller.CAP=" + contract.CAP().shift(-18));
    console.log("RESULT: controller.STARTDATE=" + startDate + " " + new Date(startDate * 1000).toUTCString()  + 
        " / " + new Date(startDate * 1000).toGMTString());
    var endDate = contract.ENDDATE();
    console.log("RESULT: controller.ENDDATE=" + endDate + " " + new Date(endDate * 1000).toUTCString()  + 
        " / " + new Date(endDate * 1000).toGMTString());

    var latestBlock = eth.blockNumber;
    var i;

    var tokensBoughtEvent = contract.TokensBought({}, { fromBlock: controllerFromBlock, toBlock: latestBlock });
    i = 0;
    tokensBoughtEvent.watch(function (error, result) {
      console.log("RESULT: TokensBought " + i++ + " #" + result.blockNumber + " buyer=" + result.args.buyer + 
        " ethers=" + web3.fromWei(result.args.ethers, "ether") +
        " newEtherBalance=" + web3.fromWei(result.args.newEtherBalance, "ether") + 
        " tokens=" + result.args.tokens.shift(-decimals) + 
        " multisigTokens=" + result.args.multisigTokens.shift(-decimals) + 
        " newTotalSupply=" + result.args.newTotalSupply.shift(-decimals) + 
        " tokensPerKEther=" + result.args.tokensPerKEther);
    });
    tokensBoughtEvent.stopWatching();

    var approvalEvents = contract.Approval({}, { fromBlock: controllerFromBlock, toBlock: latestBlock });
    i = 0;
    approvalEvents.watch(function (error, result) {
      console.log("RESULT: Approval " + i++ + " #" + result.blockNumber + " _owner=" + result.args._owner + " _spender=" + result.args._spender + " _value=" +
        result.args._value.shift(-decimals));
    });
    approvalEvents.stopWatching();

    var transferEvents = contract.Transfer({}, { fromBlock: controllerFromBlock, toBlock: latestBlock });
    i = 0;
    transferEvents.watch(function (error, result) {
      console.log("RESULT: Transfer " + i++ + " #" + result.blockNumber + ": _from=" + result.args._from + " _to=" + result.args._to +
        " value=" + result.args._value.shift(-decimals));
    });
    transferEvents.stopWatching();

    controllerFromBlock = latestBlock + 1;
  }
}


function addLedgerContractAddressAndAbi(address, abi) {
  ledgerContractAddress = address;
  ledgerContractAbi = abi;
}

var ledgerFromBlock = 0;
function printLedgerContractDetails() {
  console.log("RESULT: ledgerContractAddress=" + ledgerContractAddress);
  if (ledgerContractAddress  != null && ledgerContractAbi != null) {
    var contract = eth.contract(ledgerContractAbi).at(ledgerContractAddress);
    console.log("RESULT: ledger.owner=" + contract.owner());
    console.log("RESULT: ledger.controller=" + contract.controller());
    console.log("RESULT: ledger.totalSupply=" + contract.totalSupply());
    console.log("RESULT: ledger.mintingNonce=" + contract.mintingNonce());
    console.log("RESULT: ledger.mintingStopped=" + contract.mintingStopped());
    // console.log("RESULT: controller.newOwner=" + contract.newOwner());
    var decimals = contract.decimals();
    console.log("RESULT: ledger.symbol=" + contract.symbol());
    console.log("RESULT: ledger.name=" + contract.name());
    console.log("RESULT: ledger.decimals=" + decimals);
    console.log("RESULT: ledger.totalSupply=" + contract.totalSupply().shift(-18));
    var startDate = contract.STARTDATE();
    console.log("RESULT: ledger.totalEthers=" + contract.totalEthers().shift(-18));
    console.log("RESULT: ledger.CAP=" + contract.CAP().shift(-18));
    console.log("RESULT: ledger.STARTDATE=" + startDate + " " + new Date(startDate * 1000).toUTCString()  + 
        " / " + new Date(startDate * 1000).toGMTString());
    var endDate = contract.ENDDATE();
    console.log("RESULT: ledger.ENDDATE=" + endDate + " " + new Date(endDate * 1000).toUTCString()  + 
        " / " + new Date(endDate * 1000).toGMTString());

    var latestBlock = eth.blockNumber;
    var i;

    var tokensBoughtEvent = contract.TokensBought({}, { fromBlock: ledgerFromBlock, toBlock: latestBlock });
    i = 0;
    tokensBoughtEvent.watch(function (error, result) {
      console.log("RESULT: TokensBought " + i++ + " #" + result.blockNumber + " buyer=" + result.args.buyer + 
        " ethers=" + web3.fromWei(result.args.ethers, "ether") +
        " newEtherBalance=" + web3.fromWei(result.args.newEtherBalance, "ether") + 
        " tokens=" + result.args.tokens.shift(-decimals) + 
        " multisigTokens=" + result.args.multisigTokens.shift(-decimals) + 
        " newTotalSupply=" + result.args.newTotalSupply.shift(-decimals) + 
        " tokensPerKEther=" + result.args.tokensPerKEther);
    });
    tokensBoughtEvent.stopWatching();

    var approvalEvents = contract.Approval({}, { fromBlock: ledgerFromBlock, toBlock: latestBlock });
    i = 0;
    approvalEvents.watch(function (error, result) {
      console.log("RESULT: Approval " + i++ + " #" + result.blockNumber + " _owner=" + result.args._owner + " _spender=" + result.args._spender + " _value=" +
        result.args._value.shift(-decimals));
    });
    approvalEvents.stopWatching();

    var transferEvents = contract.Transfer({}, { fromBlock: ledgerFromBlock, toBlock: latestBlock });
    i = 0;
    transferEvents.watch(function (error, result) {
      console.log("RESULT: Transfer " + i++ + " #" + result.blockNumber + ": _from=" + result.args._from + " _to=" + result.args._to +
        " value=" + result.args._value.shift(-decimals));
    });
    transferEvents.stopWatching();

    ledgerFromBlock = latestBlock + 1;
  }
}


//-----------------------------------------------------------------------------
// Token Contract
//-----------------------------------------------------------------------------
var tokenFromBlock = 0;
function printTokenContractDetails() {
  console.log("RESULT: tokenContractAddress=" + tokenContractAddress);
  if (tokenContractAddress != null && tokenContractAbi != null) {
    var contract = eth.contract(tokenContractAbi).at(tokenContractAddress);
    var decimals = contract.decimals();
    console.log("RESULT: token.owner=" + contract.owner());
    console.log("RESULT: token.controller=" + contract.controller());
    console.log("RESULT: token.motd=" + contract.motd());
    console.log("RESULT: token.burnAddress=" + contract.burnAddress());
    console.log("RESULT: token.burnable=" + contract.burnable());
    // console.log("RESULT: controller.newOwner=" + contract.newOwner());
    console.log("RESULT: token.symbol=" + contract.symbol());
    console.log("RESULT: token.name=" + contract.name());
    console.log("RESULT: token.decimals=" + decimals);
    console.log("RESULT: token.totalSupply=" + contract.totalSupply().shift(-18));
    // var startDate = contract.STARTDATE();
    // console.log("RESULT: token.totalEthers=" + contract.totalEthers().shift(-18));
    // console.log("RESULT: token.CAP=" + contract.CAP().shift(-18));
    // console.log("RESULT: token.STARTDATE=" + startDate + " " + new Date(startDate * 1000).toUTCString()  + 
    //     " / " + new Date(startDate * 1000).toGMTString());
    // var endDate = contract.ENDDATE();
    // console.log("RESULT: token.ENDDATE=" + endDate + " " + new Date(endDate * 1000).toUTCString()  + 
    //     " / " + new Date(endDate * 1000).toGMTString());

    var latestBlock = eth.blockNumber;
    var i;

    var motdEvent = contract.Motd({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    motdEvent.watch(function (error, result) {
      console.log("RESULT: Motd " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    motdEvent.stopWatching();

    var approvalEvents = contract.Approval({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    approvalEvents.watch(function (error, result) {
      console.log("RESULT: Approval " + i++ + " #" + result.blockNumber + " _owner=" + result.args._owner + " _spender=" + result.args._spender + " _value=" +
        result.args._value.shift(-decimals));
    });
    approvalEvents.stopWatching();

    var transferEvents = contract.Transfer({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    transferEvents.watch(function (error, result) {
      console.log("RESULT: Transfer " + i++ + " #" + result.blockNumber + ": _from=" + result.args._from + " _to=" + result.args._to +
        " value=" + result.args._value.shift(-decimals));
    });
    transferEvents.stopWatching();

    tokenFromBlock = latestBlock + 1;
  }
}
