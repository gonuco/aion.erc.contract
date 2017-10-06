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
addAccount(eth.accounts[3], "Account #3");
addAccount(eth.accounts[4], "Account #4");
addAccount(eth.accounts[5], "Account #5");
addAccount(eth.accounts[6], "Account #6");
addAccount(eth.accounts[7], "Account #7");
addAccount(eth.accounts[8], "Account #8");


var minerAccount = eth.accounts[0];
var contractOwnerAccount = eth.accounts[1];
var multisig = eth.accounts[2];
var account3 = eth.accounts[3];
var account4 = eth.accounts[4];
var account5 = eth.accounts[5];
var account6 = eth.accounts[6];
var account7 = eth.accounts[7];
var account8 = eth.accounts[8];


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
    console.log("RESULT: finalizable.finalized=" + contract.finalized());
    console.log("RESULT: controller.totalSupply=" + contract.totalSupply().shift(-8));

    var latestBlock = eth.blockNumber;
    var i;

    var controllerBurnEvent = contract.ControllerBurn({}, { fromBlock: controllerFromBlock, toBlock: latestBlock });
    i = 0;
    controllerBurnEvent.watch(function (error, result) {
      console.log("RESULT: ControllerBurn " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    controllerBurnEvent.stopWatching();

    controllerFromBlock = latestBlock + 1;
  }
}


//-----------------------------------------------------------------------------
// Ledger Contract
//-----------------------------------------------------------------------------
var ledgerContractAddress = null;
var ledgerContractAbi = null;

function addLedgerContractAddressAndAbi(address, abi) {
  ledgerContractAddress = address;
  ledgerContractAbi = abi;
}

function printLedgerContractDetails() {
  console.log("RESULT: ledgerContractAddress=" + ledgerContractAddress);
  if (ledgerContractAddress  != null && ledgerContractAbi != null) {
    var contract = eth.contract(ledgerContractAbi).at(ledgerContractAddress);
    console.log("RESULT: ledger.owner=" + contract.owner());
    console.log("RESULT: ledger.controller=" + contract.controller());
    console.log("RESULT: ledger.totalSupply=" + contract.totalSupply().shift(-8));
    console.log("RESULT: ledger.mintingNonce=" + contract.mintingNonce());
    console.log("RESULT: ledger.mintingStopped=" + contract.mintingStopped());
    console.log("RESULT: ledger.burnAddress=" + contract.burnAddress());
    console.log("RESULT: finalizable.finalized=" + contract.finalized());
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
    console.log("RESULT: token.name=" + contract.name());
    console.log("RESULT: token.decimals=" + decimals);
    console.log("RESULT: token.symbol=" + contract.symbol());
    console.log("RESULT: token.controller=" + contract.controller());
    console.log("RESULT: token.motd=" + contract.motd());
    console.log("RESULT: token.burnAddress=" + contract.burnAddress());
    console.log("RESULT: token.burnable=" + contract.burnable());
    console.log("RESULT: token.totalSupply=" + contract.totalSupply().shift(-8));
    console.log("RESULT: finalizable.finalized=" + contract.finalized());
    console.log("RESULT: pausable.paused=" + contract.paused());

    var latestBlock = eth.blockNumber;
    var i;

    var motdEvent = contract.Motd({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    motdEvent.watch(function (error, result) {
      console.log("RESULT: Motd " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    motdEvent.stopWatching();

    var burnEvent = contract.Burn({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    burnEvent.watch(function (error, result) {
      console.log("RESULT: Burn " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    burnEvent.stopWatching();

    var claimedEvent = contract.Claimed({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    claimedEvent.watch(function (error, result) {
      console.log("RESULT: Claimed " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    claimedEvent.stopWatching();

    var approvalEvents = contract.Approval({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    approvalEvents.watch(function (error, result) {
      console.log("RESULT: Approval " + i++ + " #" + result.blockNumber + " owner=" + result.args.owner + " spender=" + result.args.spender + " value=" +
        result.args.value.shift(-decimals));
    });
    approvalEvents.stopWatching();

    var transferEvents = contract.Transfer({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    transferEvents.watch(function (error, result) {
      console.log("RESULT: Transfer " + i++ + " #" + result.blockNumber + ": from=" + result.args.from + " to=" + result.args.to +
        " value=" + result.args.value.shift(-decimals));
    });
    transferEvents.stopWatching();

    tokenFromBlock = latestBlock + 1;
  }
}


//-----------------------------------------------------------------------------
// Receiver Contract
//-----------------------------------------------------------------------------
var receiverContractAbi = null;

function addReceiverContractAbi(abi) {
  receiverContractAbi = abi;
}

function printReceiverContractDetails(receiverContractAddress, message) {
  console.log("RESULT: receiverContractAddress=" + receiverContractAddress);
  // console.log("RESULT: receiverContractAbi=" + JSON.stringify(receiverContractAbi));
  if (receiverContractAddress  != null && receiverContractAbi != null) {
    var contract = eth.contract(receiverContractAbi).at(receiverContractAddress);
    console.log("RESULT: receiver=" + message);
    console.log("RESULT: receiver.owner=" + contract.owner());
    console.log("RESULT: receiver.newOwner=" + contract.newOwner());
    console.log("RESULT: receiver.notice=" + contract.notice());
    console.log("RESULT: receiver.sale=" + contract.sale());
    console.log("RESULT: receiver.live=" + contract.live());

    var latestBlock = eth.blockNumber;
    var i;

    var startSaleEvent = contract.StartSale({}, { fromBlock: saleFromBlock, toBlock: latestBlock });
    i = 0;
    startSaleEvent.watch(function (error, result) {
      console.log("RESULT: StartSale " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    startSaleEvent.stopWatching();

    var endSaleEvent = contract.EndSale({}, { fromBlock: saleFromBlock, toBlock: latestBlock });
    i = 0;
    endSaleEvent.watch(function (error, result) {
      console.log("RESULT: EndSale " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    endSaleEvent.stopWatching();

    var etherInEvent = contract.EtherIn({}, { fromBlock: saleFromBlock, toBlock: latestBlock });
    i = 0;
    etherInEvent.watch(function (error, result) {
      console.log("RESULT: EtherIn " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    etherInEvent.stopWatching();
  }
}


//-----------------------------------------------------------------------------
// Sale Contract
//-----------------------------------------------------------------------------
var saleContractAddress = null;
var saleContractAbi = null;

function addSaleContractAddressAndAbi(address, abi) {
  saleContractAddress = address;
  saleContractAbi = abi;
}

var saleFromBlock = 0;
function printSaleContractDetails() {
  console.log("RESULT: saleContractAddress=" + saleContractAddress);
  if (saleContractAddress  != null && saleContractAbi != null) {
    var contract = eth.contract(saleContractAbi).at(saleContractAddress);
    console.log("RESULT: sale.SOFTCAP_TIME=" + contract.SOFTCAP_TIME());
    console.log("RESULT: sale.owner=" + contract.owner());
    console.log("RESULT: sale.newOwner=" + contract.newOwner());
    console.log("RESULT: sale.notice=" + contract.notice());
    console.log("RESULT: sale.start=" + contract.start() + " " + new Date(contract.start() * 1000).toUTCString());
    console.log("RESULT: sale.end=" + contract.end() + " " + new Date(contract.end() * 1000).toUTCString());
    console.log("RESULT: sale.cap=" + contract.cap() + " " + contract.cap().shift(-18));
    console.log("RESULT: sale.softcap=" + contract.softcap() + " " + contract.softcap().shift(-18));
    console.log("RESULT: sale.live=" + contract.live());
    console.log("RESULT: sale.r0=" + contract.r0());
    console.log("RESULT: sale.r1=" + contract.r1());
    console.log("RESULT: sale.r2=" + contract.r2());

    var latestBlock = eth.blockNumber;
    saleFromBlock = latestBlock + 1;
  }
}


//-----------------------------------------------------------------------------
// Savings Contract
//-----------------------------------------------------------------------------
var savingsContractAddress = null;
var savingsContractAbi = null;

function addSavingsContractAddressAndAbi(address, abi) {
  savingsContractAddress = address;
  savingsContractAbi = abi;
}

var savingsFromBlock = 0;
function printSavingsContractDetails() {
  console.log("RESULT: savingsContractAddress=" + savingsContractAddress);
  if (savingsContractAddress  != null && savingsContractAbi != null) {
    var contract = eth.contract(savingsContractAbi).at(savingsContractAddress);
    console.log("RESULT: savings.periods=" + contract.periods());
    console.log("RESULT: savings.t0special=" + contract.t0special());
    console.log("RESULT: savings.intervalSecs=" + contract.intervalSecs());
    console.log("RESULT: savings.owner=" + contract.owner());
    console.log("RESULT: savings.newOwner=" + contract.newOwner());
    console.log("RESULT: savings.inited=" + contract.inited());
    console.log("RESULT: savings.locked=" + contract.locked());
    console.log("RESULT: savings.startBlockTimestamp=" + contract.startBlockTimestamp() + " " + new Date(contract.startBlockTimestamp()*1000).toUTCString());
    console.log("RESULT: savings.token=" + contract.token());
    console.log("RESULT: savings.totalfv=" + contract.totalfv() + " " + contract.totalfv().shift(-8));
    console.log("RESULT: savings.total=" + contract.total() + " " + contract.total().shift(-8));
    console.log("RESULT: savings.nullified=" + contract.nullified());
    console.log("RESULT: savings.mintingNonce=" + contract.mintingNonce());

    var latestBlock = eth.blockNumber;
    var i;

    var depositEvent = contract.Deposit({}, { fromBlock: saleFromBlock, toBlock: latestBlock });
    i = 0;
    depositEvent.watch(function (error, result) {
      console.log("RESULT: Deposit " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    depositEvent.stopWatching();

    savingsFromBlock = latestBlock + 1;
  }
}