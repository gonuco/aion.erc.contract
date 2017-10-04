#!/bin/bash
# ----------------------------------------------------------------------------------------------
# Testing the smart contract
#
# Enjoy. (c) BokkyPooBah / Bok Consulting Pty Ltd 2017. The MIT Licence.
# ----------------------------------------------------------------------------------------------

MODE=${1:-test}

GETHATTACHPOINT=`grep ^IPCFILE= settings.txt | sed "s/^.*=//"`
PASSWORD=`grep ^PASSWORD= settings.txt | sed "s/^.*=//"`

TOKENCONTRACTSDIR=`grep ^TOKENCONTRACTSDIR= settings.txt | sed "s/^.*=//"`
SALESCONTRACTSDIR=`grep ^SALESCONTRACTSDIR= settings.txt | sed "s/^.*=//"`
TRSCONTRACTSDIR=`grep ^TRSCONTRACTSDIR= settings.txt | sed "s/^.*=//"`

# --- Tokens ---
CONTROLLERSOL=`grep ^CONTROLLERSOL= settings.txt | sed "s/^.*=//"`
CONTROLLERJS=`grep ^CONTROLLERJS= settings.txt | sed "s/^.*=//"`

LEDGERSOL=`grep ^LEDGERSOL= settings.txt | sed "s/^.*=//"`
LEDGERJS=`grep ^LEDGERJS= settings.txt | sed "s/^.*=//"`

TOKENSOL=`grep ^TOKENSOL= settings.txt | sed "s/^.*=//"`
TOKENJS=`grep ^TOKENJS= settings.txt | sed "s/^.*=//"`

# --- Sales ---
RECEIVERSOL=`grep ^RECEIVERSOL= settings.txt | sed "s/^.*=//"`
RECEIVERJS=`grep ^RECEIVERJS= settings.txt | sed "s/^.*=//"`

SALESOL=`grep ^SALESOL= settings.txt | sed "s/^.*=//"`
SALEJS=`grep ^SALEJS= settings.txt | sed "s/^.*=//"`

# --- Trs ---
SAVINGSSOL=`grep ^SAVINGSSOL= settings.txt | sed "s/^.*=//"`
SAVINGSJS=`grep ^SAVINGSJS= settings.txt | sed "s/^.*=//"`

DEPLOYMENTDATA=`grep ^DEPLOYMENTDATA= settings.txt | sed "s/^.*=//"`

TEST3OUTPUT=`grep ^TEST3OUTPUT= settings.txt | sed "s/^.*=//"`
TEST3RESULTS=`grep ^TEST3RESULTS= settings.txt | sed "s/^.*=//"`

CURRENTTIME=`date +%s`
CURRENTTIMES=`date -r $CURRENTTIME -u`

if [ "$MODE" == "dev" ]; then
  # Start time now
  STARTTIME=`echo "$CURRENTTIME" | bc`
else
  # Start time 1m 10s in the future
  STARTTIME=`echo "$CURRENTTIME+75" | bc`
fi
STARTTIME_S=`date -r $STARTTIME -u`
ENDTIME=`echo "$CURRENTTIME+60*5" | bc`
ENDTIME_S=`date -r $ENDTIME -u`

printf "MODE              = '$MODE'\n" | tee $TEST3OUTPUT
printf "GETHATTACHPOINT   = '$GETHATTACHPOINT'\n" | tee -a $TEST3OUTPUT
printf "PASSWORD          = '$PASSWORD'\n" | tee -a $TEST3OUTPUT
printf "TOKENCONTRACTSDIR = '$TOKENCONTRACTSDIR'\n" | tee -a $TEST3OUTPUT
printf "SALESCONTRACTSDIR = '$SALESCONTRACTSDIR'\n" | tee -a $TEST3OUTPUT
printf "TRSCONTRACTSDIR   = '$TRSCONTRACTSDIR'\n" | tee -a $TEST3OUTPUT
printf "\--- Token --- \n" | tee -a $TEST3OUTPUT
printf "CONTROLLERSOL     = '$CONTROLLERSOL'\n" | tee -a $TEST3OUTPUT
printf "CONTROLLERJS      = '$CONTROLLERJS'\n" | tee -a $TEST3OUTPUT
printf "LEDGERSOL         = '$LEDGERSOL'\n" | tee -a $TEST3OUTPUT
printf "LEDGERJS          = '$LEDGERJS'\n" | tee -a $TEST3OUTPUT
printf "TOKENSOL          = '$TOKENSOL'\n" | tee -a $TEST3OUTPUT
printf "TOKENJS           = '$TOKENJS'\n" | tee -a $TEST3OUTPUT
printf "\--- Sales --- \n" | tee -a $TEST3OUTPUT
printf "RECEIVERSOL       = '$RECEIVERSOL'\n" | tee -a $TEST3OUTPUT
printf "RECEIVERJS        = '$RECEIVERJS'\n" | tee -a $TEST3OUTPUT
printf "SALESOL           = '$SALESOL'\n" | tee -a $TEST3OUTPUT
printf "SALEJS            = '$SALEJS'\n" | tee -a $TEST3OUTPUT
printf "\--- Trs --- \n" | tee -a $TEST3OUTPUT
printf "SAVINGSSOL        = '$SAVINGSSOL'\n" | tee -a $TEST3OUTPUT
printf "SAVINGSJS         = '$SAVINGSJS'\n" | tee -a $TEST3OUTPUT
printf "\--- End --- \n" | tee -a $TEST3OUTPUT
printf "DEPLOYMENTDATA    = '$DEPLOYMENTDATA'\n" | tee -a $TEST3OUTPUT
printf "TEST3OUTPUT       = '$TEST3OUTPUT'\n" | tee -a $TEST3OUTPUT
printf "TEST3RESULTS      = '$TEST3RESULTS'\n" | tee -a $TEST3OUTPUT
printf "CURRENTTIME       = '$CURRENTTIME' '$CURRENTTIMES'\n" | tee -a $TEST3OUTPUT
printf "STARTTIME         = '$STARTTIME' '$STARTTIME_S'\n" | tee -a $TEST3OUTPUT
printf "ENDTIME           = '$ENDTIME' '$ENDTIME_S'\n" | tee -a $TEST3OUTPUT

# Make copy of SOL file and modify start and end times ---
`cp $TOKENCONTRACTSDIR/$CONTROLLERSOL .`
`cp $TOKENCONTRACTSDIR/$LEDGERSOL .`
`cp $TOKENCONTRACTSDIR/$TOKENSOL .`
`cp $TOKENCONTRACTSDIR/ControllerEventDefinitions.sol .`
`cp $TOKENCONTRACTSDIR/EventDefinitions.sol .`
`cp $TOKENCONTRACTSDIR/Finalizable.sol .`
`cp $TOKENCONTRACTSDIR/IToken.sol .`
`cp $TOKENCONTRACTSDIR/Owned.sol .`
`cp $TOKENCONTRACTSDIR/Pausable.sol .`
`cp $TOKENCONTRACTSDIR/SafeMath.sol .`
`cp $TOKENCONTRACTSDIR/TokenReceivable.sol .`
`cp $SALESCONTRACTSDIR/$RECEIVERSOL .`
`cp $SALESCONTRACTSDIR/$SALESOL .`
`cp $TRSCONTRACTSDIR/$SAVINGSSOL .`

# --- Modify dates ---
`perl -pi -e "s/SOFTCAP_TIME \= 4 hours;/SOFTCAP_TIME \= 33 seconds;/" $SALESOL`
#`perl -pi -e "s/ENDDATE \= STARTDATE \+ 28 days;.*$/ENDDATE \= STARTDATE \+ 5 minutes;/" $DAOCASINOTOKENTEMPSOL`
#`perl -pi -e "s/CAP \= 84417 ether;.*$/CAP \= 100 ether;/" $DAOCASINOTOKENTEMPSOL`

DIFFS1=`diff $TOKENCONTRACTSDIR/$CONTROLLERSOL $CONTROLLERSOL`
echo "--- Differences $TOKENCONTRACTSDIR/$CONTROLLERSOL $CONTROLLERSOL ---" | tee -a $TEST3OUTPUT
echo "$DIFFS1" | tee -a $TEST3OUTPUT

DIFFS1=`diff $TOKENCONTRACTSDIR/$LEDGERSOL $LEDGERSOL`
echo "--- Differences $TOKENCONTRACTSDIR/$LEDGERSOL $LEDGERSOL ---" | tee -a $TEST3OUTPUT
echo "$DIFFS1" | tee -a $TEST3OUTPUT

DIFFS1=`diff $TOKENCONTRACTSDIR/$TOKENSOL $TOKENSOL`
echo "--- Differences $TOKENCONTRACTSDIR/$TOKENSOL $TOKENSOL ---" | tee -a $TEST3OUTPUT
echo "$DIFFS1" | tee -a $TEST3OUTPUT

DIFFS1=`diff $SALESCONTRACTSDIR/$RECEIVERSOL $RECEIVERSOL`
echo "--- Differences $SALESCONTRACTSDIR/$RECEIVERSOL $RECEIVERSOL ---" | tee -a $TEST3OUTPUT
echo "$DIFFS1" | tee -a $TEST3OUTPUT

DIFFS1=`diff $SALESCONTRACTSDIR/$SALESOL $SALESOL`
echo "--- Differences $SALESCONTRACTSDIR/$SALESOL $SALESOL ---" | tee -a $TEST3OUTPUT
echo "$DIFFS1" | tee -a $TEST3OUTPUT

DIFFS1=`diff $TRSCONTRACTSDIR/$SAVINGSSOL $SAVINGSSOL`
echo "--- Differences $TRSCONTRACTSDIR/$SAVINGSSOL $SAVINGSSOL ---" | tee -a $TEST3OUTPUT
echo "$DIFFS1" | tee -a $TEST3OUTPUT

echo "var controllerOutput=`solc_0.4.16 --optimize --combined-json abi,bin,interface $CONTROLLERSOL`;" > $CONTROLLERJS
echo "var ledgerOutput=`solc_0.4.16 --optimize --combined-json abi,bin,interface $LEDGERSOL`;" > $LEDGERJS
echo "var tokenOutput=`solc_0.4.16 --optimize --combined-json abi,bin,interface $TOKENSOL`;" > $TOKENJS
echo "var receiverOutput=`solc_0.4.16 --optimize --combined-json abi,bin,interface $RECEIVERSOL`;" > $RECEIVERJS
echo "var saleOutput=`solc_0.4.16 --optimize --combined-json abi,bin,interface $SALESOL`;" > $SALEJS
echo "var savingsOutput=`solc_0.4.16 --optimize --combined-json abi,bin,interface $SAVINGSSOL`;" > $SAVINGSJS


geth --verbosity 3 attach $GETHATTACHPOINT << EOF | tee -a $TEST3OUTPUT
loadScript("$CONTROLLERJS");
loadScript("$LEDGERJS");
loadScript("$TOKENJS");
loadScript("$RECEIVERJS");
loadScript("$SALEJS");
loadScript("$SAVINGSJS");
loadScript("functions.js");

var controllerAbi = JSON.parse(controllerOutput.contracts["$CONTROLLERSOL:Controller"].abi);
var controllerBin = "0x" + controllerOutput.contracts["$CONTROLLERSOL:Controller"].bin;
var ledgerAbi = JSON.parse(ledgerOutput.contracts["$LEDGERSOL:Ledger"].abi);
var ledgerBin = "0x" + ledgerOutput.contracts["$LEDGERSOL:Ledger"].bin;
var tokenAbi = JSON.parse(tokenOutput.contracts["$TOKENSOL:Token"].abi);
var tokenBin = "0x" + tokenOutput.contracts["$TOKENSOL:Token"].bin;

var receiverAbi = JSON.parse(receiverOutput.contracts["$RECEIVERSOL:Receiver"].abi);
var receiverBin = "0x" + receiverOutput.contracts["$RECEIVERSOL:Receiver"].bin;
var saleAbi = JSON.parse(saleOutput.contracts["$SALESOL:Sale"].abi);
var saleBin = "0x" + saleOutput.contracts["$SALESOL:Sale"].bin;
var savingsAbi = JSON.parse(savingsOutput.contracts["$SAVINGSSOL:Savings"].abi);
var savingsBin = "0x" + savingsOutput.contracts["$SAVINGSSOL:Savings"].bin;

// console.log("DATA: controllerAbi=" + JSON.stringify(controllerAbi));
// console.log("DATA: controllerBin=" + controllerBin);
// console.log("DATA: ledgerAbi=" + JSON.stringify(ledgerAbi));
// console.log("DATA: ledgerBin=" + ledgerBin);
// console.log("DATA: tokenAbi=" + JSON.stringify(tokenAbi));
// console.log("DATA: tokenBin=" + tokenBin);
// console.log("DATA: receiverAbi=" + JSON.stringify(receiverAbi));
// console.log("DATA: receiverBin=" + receiverBin);
// console.log("DATA: salesAbi=" + JSON.stringify(salesAbi));
// console.log("DATA: salesBin=" + salesBin);
// console.log("DATA: savingsAbi=" + JSON.stringify(savingsAbi));
// console.log("DATA: savingsBin=" + savingsBin);

unlockAccounts("$PASSWORD");
printBalances();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var controllerMessage = "Deploy Controller Contract";
// -----------------------------------------------------------------------------
console.log("RESULT: " + controllerMessage);
var controllerContract = web3.eth.contract(controllerAbi);
// console.log(JSON.stringify(controllerContract));
var controllerTx = null;
var controllerAddress = null;

var controller = controllerContract.new({from: contractOwnerAccount, data: controllerBin, gas: 6000000},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        controllerTx = contract.transactionHash;
      } else {
        controllerAddress = contract.address;
        addAccount(controllerAddress, "Controller Contract");
        addControllerContractAddressAndAbi(controllerAddress, controllerAbi);
        console.log("DATA: controllerAddress=" + controllerAddress);
      }
    }
  }
);

// -----------------------------------------------------------------------------
var ledgerMessage = "Deploy Ledger Contract";
// -----------------------------------------------------------------------------
console.log("RESULT: " + ledgerMessage);
var ledgerContract = web3.eth.contract(ledgerAbi);
// console.log(JSON.stringify(ledgerContract));
var ledgerTx = null;
var ledgerAddress = null;

var ledger = ledgerContract.new({from: contractOwnerAccount, data: ledgerBin, gas: 6000000},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        ledgerTx = contract.transactionHash;
      } else {
        ledgerAddress = contract.address;
        addAccount(ledgerAddress, "Ledger Contract");
        addLedgerContractAddressAndAbi(ledgerAddress, ledgerAbi);
        console.log("DATA: ledgerAddress=" + ledgerAddress);
      }
    }
  }
);

// -----------------------------------------------------------------------------
var tokenMessage = "Deploy Token Contract";
// -----------------------------------------------------------------------------
console.log("RESULT: " + tokenMessage);
var tokenContract = web3.eth.contract(tokenAbi);
// console.log(JSON.stringify(tokenContract));
var tokenTx = null;
var tokenAddress = null;

var token = tokenContract.new({from: contractOwnerAccount, data: tokenBin, gas: 6000000},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        tokenTx = contract.transactionHash;
      } else {
        tokenAddress = contract.address;
        addAccount(tokenAddress, "Token Contract");
        addTokenContractAddressAndAbi(tokenAddress, tokenAbi);
        console.log("DATA: tokenAddress=" + tokenAddress);
      }
    }
  }
);

if (false) {
// -----------------------------------------------------------------------------
var receiver0Message = "Deploy Receiver0 Contract";
// -----------------------------------------------------------------------------
console.log("RESULT: " + receiver0Message);
var receiver0Contract = web3.eth.contract(receiverAbi);
// console.log(JSON.stringify(receiver0Contract));
var receiver0Tx = null;
var receiver0Address = null;

var receiver0 = receiver0Contract.new({from: contractOwnerAccount, data: receiverBin, gas: 6000000},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        receiver0Tx = contract.transactionHash;
      } else {
        receiver0Address = contract.address;
        addAccount(receiver0Address, "Receiver0 Contract");
        addReceiverContractAbi(receiverAbi);
        console.log("DATA: receiver0Address=" + receiver0Address);
      }
    }
  }
);
}

if (false) {
// -----------------------------------------------------------------------------
var receiver1Message = "Deploy Receiver1 Contract";
// -----------------------------------------------------------------------------
console.log("RESULT: " + receiver1Message);
var receiver1Contract = web3.eth.contract(receiverAbi);
// console.log(JSON.stringify(receiver1Contract));
var receiver1Tx = null;
var receiver1Address = null;

var receiver1 = receiver1Contract.new({from: contractOwnerAccount, data: receiverBin, gas: 6000000},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        receiver1Tx = contract.transactionHash;
      } else {
        receiver1Address = contract.address;
        addAccount(receiver1Address, "Receiver1 Contract");
        addReceiverContractAbi(receiverAbi);
        console.log("DATA: receiver1Address=" + receiver1Address);
      }
    }
  }
);
}

if (false) {
// -----------------------------------------------------------------------------
var receiver2Message = "Deploy Receiver2 Contract";
// -----------------------------------------------------------------------------
console.log("RESULT: " + receiver2Message);
var receiver2Contract = web3.eth.contract(receiverAbi);
// console.log(JSON.stringify(receiver2Contract));
var receiver2Tx = null;
var receiver2Address = null;

var receiver2 = receiver2Contract.new({from: contractOwnerAccount, data: receiverBin, gas: 6000000},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        receiver2Tx = contract.transactionHash;
      } else {
        receiver2Address = contract.address;
        addAccount(receiver2Address, "Receiver2 Contract");
        // addReceiverContractAbi(receiverAbi);
        console.log("DATA: receiver2Address=" + receiver2Address);
      }
    }
  }
);
}

if (false) {
// -----------------------------------------------------------------------------
var saleMessage = "Deploy Sale Contract";
// -----------------------------------------------------------------------------
console.log("RESULT: " + saleMessage);
var saleContract = web3.eth.contract(saleAbi);
// console.log(JSON.stringify(saleContract));
var saleTx = null;
var saleAddress = null;

var sale = saleContract.new({from: contractOwnerAccount, data: saleBin, gas: 6000000},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        saleTx = contract.transactionHash;
      } else {
        saleAddress = contract.address;
        addAccount(saleAddress, "Sale Contract");
        addSaleContractAddressAndAbi(saleAddress, saleAbi);
        console.log("DATA: saleAddress=" + saleAddress);
      }
    }
  }
);
}

// -----------------------------------------------------------------------------
var savingsMessage = "Deploy Savings Contract";
// -----------------------------------------------------------------------------
console.log("RESULT: " + savingsMessage);
var savingsContract = web3.eth.contract(savingsAbi);
// console.log(JSON.stringify(savingsContract));
var savingsTx = null;
var savingsAddress = null;

var savings = savingsContract.new({from: contractOwnerAccount, data: savingsBin, gas: 6000000},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        savingsTx = contract.transactionHash;
      } else {
        savingsAddress = contract.address;
        addAccount(savingsAddress, "Savings Contract");
        addSavingsContractAddressAndAbi(savingsAddress, savingsAbi);
        console.log("DATA: savingsAddress=" + savingsAddress);
      }
    }
  }
);

while (txpool.status.pending > 0) {
}

printTxData("controllerAddress=" + controllerAddress, controllerTx);
printBalances();
failIfGasEqualsGasUsed(controllerTx, controllerMessage);
printControllerContractDetails();
console.log("RESULT: ");

printTxData("ledgerAddress=" + ledgerAddress, ledgerTx);
printBalances();
failIfGasEqualsGasUsed(ledgerTx, ledgerMessage);
printLedgerContractDetails();
console.log("RESULT: ");

printTxData("tokenAddress=" + tokenAddress, tokenTx);
printBalances();
failIfGasEqualsGasUsed(tokenTx, tokenMessage);
printTokenContractDetails();
console.log("RESULT: ");

if (false) {
printTxData("receiver0Address=" + receiver0Address, receiver0Tx);
printTxData("receiver1Address=" + receiver1Address, receiver1Tx);
printTxData("receiver2Address=" + receiver2Address, receiver2Tx);
printBalances();
failIfGasEqualsGasUsed(receiver0Tx, receiver0Message);
failIfGasEqualsGasUsed(receiver1Tx, receiver1Message);
failIfGasEqualsGasUsed(receiver2Tx, receiver2Message);
printReceiverContractDetails(receiver0Address, "Receiver0");
printReceiverContractDetails(receiver1Address, "Receiver1");
printReceiverContractDetails(receiver2Address, "Receiver2");
console.log("RESULT: ");

printTxData("saleAddress=" + saleAddress, saleTx);
printBalances();
failIfGasEqualsGasUsed(saleTx, saleMessage);
printSaleContractDetails();
console.log("RESULT: ");
}

printTxData("savingsAddress=" + savingsAddress, savingsTx);
printBalances();
failIfGasEqualsGasUsed(savingsTx, savingsMessage);
printSavingsContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var stitchContractsMessage = "Stitch Controller, Ledger And Token Contracts";
// -----------------------------------------------------------------------------
console.log("RESULT: " + stitchContractsMessage);
var stitchContracts1Tx = controller.setToken(tokenAddress, {from: contractOwnerAccount, gas: 400000});
var stitchContracts2Tx = controller.setLedger(ledgerAddress, {from: contractOwnerAccount, gas: 400000});
var stitchContracts3Tx = token.setController(controllerAddress, {from: contractOwnerAccount, gas: 400000});
var stitchContracts4Tx = ledger.setController(controllerAddress, {from: contractOwnerAccount, gas: 400000});
while (txpool.status.pending > 0) {
}
var stitchContracts5Tx = controller.setBurnAddress("0x1111111111111111111111111111111111111111", {from: contractOwnerAccount, gas: 400000});
while (txpool.status.pending > 0) {
}
printTxData("stitchContracts1Tx", stitchContracts1Tx);
printTxData("stitchContracts2Tx", stitchContracts2Tx);
printTxData("stitchContracts3Tx", stitchContracts3Tx);
printTxData("stitchContracts4Tx", stitchContracts4Tx);
printTxData("stitchContracts5Tx", stitchContracts5Tx);
printBalances();
failIfGasEqualsGasUsed(stitchContracts1Tx, stitchContractsMessage + " - controller.setToken(...)");
failIfGasEqualsGasUsed(stitchContracts2Tx, stitchContractsMessage + " - controller.setLedger(...)");
failIfGasEqualsGasUsed(stitchContracts3Tx, stitchContractsMessage + " - token.setController(...)");
failIfGasEqualsGasUsed(stitchContracts4Tx, stitchContractsMessage + " - ledger.setController(...)");
failIfGasEqualsGasUsed(stitchContracts5Tx, stitchContractsMessage + " - controller.setBurnAddress(...)");
printControllerContractDetails();
printLedgerContractDetails();
printTokenContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var mintMessage = "Mint Tokens";
var v1 = account3 + "000000000003f28cb71571c7";
var v2 = account4 + "000000000003f28cb71571c7";
// > new BigNumber("1111111111111111").toString(16)
// "3f28cb71571c7"
// -----------------------------------------------------------------------------
console.log("RESULT: " + mintMessage);
var mint1Tx = ledger.multiMint(0, [v1, v2], {from: contractOwnerAccount, gas: 400000});
while (txpool.status.pending > 0) {
}
printTxData("mint1Tx", mint1Tx);
printBalances();
failIfGasEqualsGasUsed(mint1Tx, mintMessage + " - ac3 + ac4 11111111.11111111 tokens");
printControllerContractDetails();
printLedgerContractDetails();
printTokenContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var depositIntoSavingsMessage = "Deposit Into Savings";
// -----------------------------------------------------------------------------
console.log("RESULT: " + depositIntoSavingsMessage);
var depositIntoSavings1Tx = savings.setToken(tokenAddress, {from: contractOwnerAccount, gas: 100000});
var depositIntoSavings2Tx = token.approve(savingsAddress, "100000000000000", {from: account3, gas: 100000});
while (txpool.status.pending > 0) {
}
var depositIntoSavings3Tx = savings.deposit("100000000000000", {from: account3, gas: 100000});
while (txpool.status.pending > 0) {
}
printTxData("depositIntoSavings1Tx", depositIntoSavings1Tx);
printTxData("depositIntoSavings2Tx", depositIntoSavings2Tx);
printTxData("depositIntoSavings3Tx", depositIntoSavings3Tx);
printBalances();
failIfGasEqualsGasUsed(depositIntoSavings1Tx, depositIntoSavingsMessage + " - savings.setToken(token)");
failIfGasEqualsGasUsed(depositIntoSavings2Tx, depositIntoSavingsMessage + " - approve 1 tokens ac3 -> deposit");
failIfGasEqualsGasUsed(depositIntoSavings3Tx, depositIntoSavingsMessage + " - deposit 1 token ac3");
printControllerContractDetails();
printLedgerContractDetails();
printTokenContractDetails();
printSavingsContractDetails();
console.log("RESULT: ");


exit;


// -----------------------------------------------------------------------------
var transferMessage = "Transfer Tokens";
// -----------------------------------------------------------------------------
console.log("RESULT: " + transferMessage);
var transfer1Tx = token.transfer(account6, "100", {from: account3, gas: 100000});
var transfer2Tx = token.approve(account5,  "3000000", {from: account4, gas: 100000});
while (txpool.status.pending > 0) {
}
var transfer3Tx = token.transferFrom(account4, account7, "3000000", {from: account5, gas: 100000});
while (txpool.status.pending > 0) {
}
printTxData("transfer1Tx", transfer1Tx);
printTxData("transfer2Tx", transfer2Tx);
printTxData("transfer3Tx", transfer3Tx);
printBalances();
failIfGasEqualsGasUsed(transfer1Tx, transferMessage + " - transfer 0.000001 tokens ac3 -> ac6. CHECK for movement");
failIfGasEqualsGasUsed(transfer2Tx, transferMessage + " - approve 0.03 tokens ac4 -> ac5");
failIfGasEqualsGasUsed(transfer3Tx, transferMessage + " - transferFrom 0.03 tokens ac4 -> ac7 by ac5. CHECK for movement");
printControllerContractDetails();
printLedgerContractDetails();
printTokenContractDetails();
console.log("RESULT: ");


exit;

// -----------------------------------------------------------------------------
var stitchReceiversAndSaleMessage = "Stitch Controller, Ledger And Token Contracts";
var _start = $STARTTIME;
var _end = $ENDTIME;
var _cap = web3.toWei(100, "ether");
var _softcap = web3.toWei(50, "ether");
// -----------------------------------------------------------------------------
console.log("RESULT: " + stitchReceiversAndSaleMessage);
var stitchReceiversAndSaleMessage1Tx = receiver0.setSale(saleAddress, {from: contractOwnerAccount, gas: 400000});
var stitchReceiversAndSaleMessage2Tx = receiver1.setSale(saleAddress, {from: contractOwnerAccount, gas: 400000});
var stitchReceiversAndSaleMessage3Tx = receiver2.setSale(saleAddress, {from: contractOwnerAccount, gas: 400000});
var stitchReceiversAndSaleMessage4Tx = sale.setReceivers(receiver0Address, receiver1Address, receiver2Address, 
  {from: contractOwnerAccount, gas: 400000});
var stitchReceiversAndSaleMessage5Tx = sale.init(_start, _end, _cap, _softcap, {from: contractOwnerAccount, gas: 400000});
while (txpool.status.pending > 0) {
}
printTxData("stitchReceiversAndSaleMessage1Tx", stitchReceiversAndSaleMessage1Tx);
printTxData("stitchReceiversAndSaleMessage2Tx", stitchReceiversAndSaleMessage2Tx);
printTxData("stitchReceiversAndSaleMessage3Tx", stitchReceiversAndSaleMessage3Tx);
printTxData("stitchReceiversAndSaleMessage4Tx", stitchReceiversAndSaleMessage4Tx);
printTxData("stitchReceiversAndSaleMessage5Tx", stitchReceiversAndSaleMessage5Tx);
printBalances();
failIfGasEqualsGasUsed(stitchReceiversAndSaleMessage1Tx, stitchReceiversAndSaleMessage + " - receiver0.setSale(sale)");
failIfGasEqualsGasUsed(stitchReceiversAndSaleMessage2Tx, stitchReceiversAndSaleMessage + " - receiver1.setSale(sale)");
failIfGasEqualsGasUsed(stitchReceiversAndSaleMessage3Tx, stitchReceiversAndSaleMessage + " - receiver2.setSale(sale)");
failIfGasEqualsGasUsed(stitchReceiversAndSaleMessage4Tx, stitchReceiversAndSaleMessage + " - sale.setReceivers(receiver*)");
failIfGasEqualsGasUsed(stitchReceiversAndSaleMessage5Tx, stitchReceiversAndSaleMessage + " - sale.init(*)");
printReceiverContractDetails(receiver0Address, "Receiver0");
printReceiverContractDetails(receiver1Address, "Receiver1");
printReceiverContractDetails(receiver2Address, "Receiver2");
printSaleContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
// Wait for crowdsale start
// -----------------------------------------------------------------------------
var startTime = sale.start();
var startTimeDate = new Date(startTime * 1000);
console.log("RESULT: Waiting until startTime at " + startTime + " " + startTimeDate + " currentDate=" + new Date());
while ((new Date()).getTime() <= startTimeDate.getTime()) {
}
console.log("RESULT: Waited until startTime at " + startTime + " " + startTimeDate + " currentDate=" + new Date());


// -----------------------------------------------------------------------------
var validContribution1Message = "Send Valid Contribution - 40 ETH From Account3, 50 ETH From Account6";
// -----------------------------------------------------------------------------
console.log("RESULT: " + validContribution1Message);
var sendValidContribution1Tx = eth.sendTransaction({from: account3, to: receiver0Address, gas: 400000, value: web3.toWei("40", "ether")});
var sendValidContribution2Tx = eth.sendTransaction({from: account4, to: receiver1Address, gas: 400000, value: web3.toWei("50", "ether")});
while (txpool.status.pending > 0) {
}
printTxData("sendValidContribution1Tx", sendValidContribution1Tx);
printTxData("sendValidContribution2Tx", sendValidContribution2Tx);
printBalances();
failIfGasEqualsGasUsed(sendValidContribution1Tx, validContribution1Message);
failIfGasEqualsGasUsed(sendValidContribution2Tx, validContribution1Message);
printReceiverContractDetails(receiver0Address, "Receiver0");
printReceiverContractDetails(receiver1Address, "Receiver1");
printReceiverContractDetails(receiver2Address, "Receiver2");
printSaleContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var validContribution2Message = "Blow The Cap";
// -----------------------------------------------------------------------------
console.log("RESULT: " + validContribution2Message);
var sendValidContribution3Tx = eth.sendTransaction({from: account5, to: receiver0Address, gas: 400000, value: web3.toWei("4000000", "ether")});
while (txpool.status.pending > 0) {
}
printTxData("sendValidContribution3Tx", sendValidContribution3Tx);
printBalances();
failIfGasEqualsGasUsed(sendValidContribution3Tx, validContribution2Message);
printReceiverContractDetails(receiver0Address, "Receiver0");
printReceiverContractDetails(receiver1Address, "Receiver1");
printReceiverContractDetails(receiver2Address, "Receiver2");
printSaleContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var withdrawSomeMessage = "Withdraw Some";
// -----------------------------------------------------------------------------
console.log("RESULT: " + withdrawSomeMessage);
var withdrawSomeTx = sale.withdrawSome(web3.toWei(123, "ether"), {from: contractOwnerAccount, gas: 400000});
while (txpool.status.pending > 0) {
}
printTxData("withdrawSomeTx", withdrawSomeTx);
printBalances();
failIfGasEqualsGasUsed(withdrawSomeTx, withdrawSomeMessage);
printReceiverContractDetails(receiver0Address, "Receiver0");
printReceiverContractDetails(receiver1Address, "Receiver1");
printReceiverContractDetails(receiver2Address, "Receiver2");
printSaleContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var withdrawMessage = "Withdraw";
// -----------------------------------------------------------------------------
console.log("RESULT: " + withdrawMessage);
var withdrawTx = sale.withdraw({from: contractOwnerAccount, gas: 400000});
while (txpool.status.pending > 0) {
}
printTxData("withdrawTx", withdrawTx);
printBalances();
failIfGasEqualsGasUsed(withdrawTx, withdrawMessage);
printReceiverContractDetails(receiver0Address, "Receiver0");
printReceiverContractDetails(receiver1Address, "Receiver1");
printReceiverContractDetails(receiver2Address, "Receiver2");
printSaleContractDetails();
console.log("RESULT: ");


exit;

// -----------------------------------------------------------------------------
var preCommitMessage = "Add PreCommitments - 1000 BET Acc3, 10000 BET Acc4";
console.log("RESULT: " + preCommitMessage);
var preCommit1Tx = dct.addPrecommitment(preCommitAccount1, "1000000000000000000000", {from: contractOwnerAccount, gas: 400000});
var preCommit2Tx = dct.addPrecommitment(preCommitAccount2, "10000000000000000000000", {from: contractOwnerAccount, gas: 400000});
while (txpool.status.pending > 0) {
}
printTxData("preCommit1Tx", preCommit1Tx);
printTxData("preCommit2Tx", preCommit2Tx);
printBalances();
failIfGasEqualsGasUsed(preCommit1Tx, preCommitMessage);
failIfGasEqualsGasUsed(preCommit2Tx, preCommitMessage);
printDctContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
// Wait for crowdsale start
// -----------------------------------------------------------------------------
var startTime = dct.STARTDATE();
var startTimeDate = new Date(startTime * 1000);
console.log("RESULT: Waiting until startTime at " + startTime + " " + startTimeDate +
  " currentDate=" + new Date());
while ((new Date()).getTime() <= startTimeDate.getTime()) {
}
console.log("RESULT: Waited until startTime at " + startTime + " " + startTimeDate +
  " currentDate=" + new Date());


// -----------------------------------------------------------------------------
var validContribution1Message = "Send Valid Contribution - 7 ETH From Account5, 14 ETH From Account6";
console.log("RESULT: " + validContribution1Message);
var sendValidContribution1Tx = eth.sendTransaction({from: account5, to: dctAddress, gas: 400000, value: web3.toWei("7", "ether")});
var sendValidContribution2Tx = eth.sendTransaction({from: account6, to: dctAddress, gas: 400000, value: web3.toWei("14", "ether")});
while (txpool.status.pending > 0) {
}
printTxData("sendValidContribution1Tx", sendValidContribution1Tx);
printTxData("sendValidContribution2Tx", sendValidContribution2Tx);
printBalances();
failIfGasEqualsGasUsed(sendValidContribution1Tx, validContribution1Message);
failIfGasEqualsGasUsed(sendValidContribution2Tx, validContribution1Message);
printDctContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var cannotTransferMessage = "Cannot Move Tokens Without Finalisation";
console.log("RESULT: " + cannotTransferMessage);
var cannotTransfer1Tx = dct.transfer(account7, "1000000000000", {from: account5, gas: 100000});
var cannotTransfer2Tx = dct.approve(account8,  "30000000000000000", {from: account6, gas: 100000});
while (txpool.status.pending > 0) {
}
var cannotTransfer3Tx = dct.transferFrom(account6, account8, "30000000000000000", {from: account8, gas: 100000});
while (txpool.status.pending > 0) {
}
printTxData("cannotTransfer1Tx", cannotTransfer1Tx);
printTxData("cannotTransfer2Tx", cannotTransfer2Tx);
printTxData("cannotTransfer3Tx", cannotTransfer3Tx);
printBalances();
passIfGasEqualsGasUsed(cannotTransfer1Tx, cannotTransferMessage + " - transfer 0.000001 BET ac5 -> ac7. CHECK no movement");
failIfGasEqualsGasUsed(cannotTransfer2Tx, cannotTransferMessage + " - approve 0.03 BET ac6 -> ac8");
passIfGasEqualsGasUsed(cannotTransfer3Tx, cannotTransferMessage + " - transferFrom 0.03 BET ac6 -> ac8. CHECK no movement");
printDctContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var validContribution2Message = "Send Valid Contribution - 79 ETH From Account5";
console.log("RESULT: " + validContribution2Message);
var sendValidContribution3Tx = eth.sendTransaction({from: account5, to: dctAddress, gas: 400000, value: web3.toWei("79", "ether")});
while (txpool.status.pending > 0) {
}
printTxData("sendValidContribution3Tx", sendValidContribution3Tx);
printBalances();
failIfGasEqualsGasUsed(sendValidContribution3Tx, validContribution2Message);
printDctContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var invalidContribution3Message = "Send Invalid Contribution - 1 ETH From Account7 - Cap Reached";
console.log("RESULT: " + invalidContribution3Message);
var sendInvalidContribution1Tx = eth.sendTransaction({from: account7, to: dctAddress, gas: 400000, value: web3.toWei("1", "ether")});
while (txpool.status.pending > 0) {
}
printTxData("sendInvalidContribution1Tx", sendInvalidContribution1Tx);
printBalances();
passIfGasEqualsGasUsed(sendInvalidContribution1Tx, invalidContribution3Message);
printDctContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var canTransferMessage = "Can Move Tokens After Cap Reached";
console.log("RESULT: " + canTransferMessage);
var canTransfer1Tx = dct.transfer(account7, "1000000000000", {from: account5, gas: 100000});
var canTransfer2Tx = dct.approve(account8,  "30000000000000000", {from: account6, gas: 100000});
while (txpool.status.pending > 0) {
}
var canTransfer3Tx = dct.transferFrom(account6, account8, "30000000000000000", {from: account8, gas: 100000});
while (txpool.status.pending > 0) {
}
printTxData("canTransfer1Tx", canTransfer1Tx);
printTxData("canTransfer2Tx", canTransfer2Tx);
printTxData("canTransfer3Tx", canTransfer3Tx);
printBalances();
failIfGasEqualsGasUsed(canTransfer1Tx, canTransferMessage + " - transfer 0.000001 BET ac5 -> ac7. CHECK for movement");
failIfGasEqualsGasUsed(canTransfer2Tx, canTransferMessage + " - approve 0.03 BET ac6 -> ac8");
failIfGasEqualsGasUsed(canTransfer3Tx, canTransferMessage + " - transferFrom 0.03 BET ac6 -> ac8. CHECK for movement");
printDctContractDetails();
console.log("RESULT: ");

EOF
grep "DATA: " $TEST3OUTPUT | sed "s/DATA: //" > $DEPLOYMENTDATA
cat $DEPLOYMENTDATA
grep "RESULT: " $TEST3OUTPUT | sed "s/RESULT: //" > $TEST3RESULTS
cat $TEST3RESULTS
