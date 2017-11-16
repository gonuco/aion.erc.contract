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

DIFFS1=`diff $TRSCONTRACTSDIR/$SAVINGSSOL $SAVINGSSOL`
echo "--- Differences $TRSCONTRACTSDIR/$SAVINGSSOL $SAVINGSSOL ---" | tee -a $TEST3OUTPUT
echo "$DIFFS1" | tee -a $TEST3OUTPUT

echo "var controllerOutput=`solc_0.4.16 --optimize --combined-json abi,bin,interface $CONTROLLERSOL`;" > $CONTROLLERJS
echo "var ledgerOutput=`solc_0.4.16 --optimize --combined-json abi,bin,interface $LEDGERSOL`;" > $LEDGERJS
echo "var tokenOutput=`solc_0.4.16 --optimize --combined-json abi,bin,interface $TOKENSOL`;" > $TOKENJS
echo "var savingsOutput=`solc_0.4.16 --optimize --combined-json abi,bin,interface $SAVINGSSOL`;" > $SAVINGSJS


geth --verbosity 3 attach $GETHATTACHPOINT << EOF | tee -a $TEST3OUTPUT
loadScript("$CONTROLLERJS");
loadScript("$LEDGERJS");
loadScript("$TOKENJS");
loadScript("$SAVINGSJS");
loadScript("functions.js");

var controllerAbi = JSON.parse(controllerOutput.contracts["$CONTROLLERSOL:Controller"].abi);
var controllerBin = "0x" + controllerOutput.contracts["$CONTROLLERSOL:Controller"].bin;
var ledgerAbi = JSON.parse(ledgerOutput.contracts["$LEDGERSOL:Ledger"].abi);
var ledgerBin = "0x" + ledgerOutput.contracts["$LEDGERSOL:Ledger"].bin;
var tokenAbi = JSON.parse(tokenOutput.contracts["$TOKENSOL:Token"].abi);
var tokenBin = "0x" + tokenOutput.contracts["$TOKENSOL:Token"].bin;
var savingsAbi = JSON.parse(savingsOutput.contracts["$SAVINGSSOL:Savings"].abi);
var savingsBin = "0x" + savingsOutput.contracts["$SAVINGSSOL:Savings"].bin;

// console.log("DATA: controllerAbi=" + JSON.stringify(controllerAbi));
// console.log("DATA: controllerBin=" + controllerBin);
// console.log("DATA: ledgerAbi=" + JSON.stringify(ledgerAbi));
// console.log("DATA: ledgerBin=" + ledgerBin);
// console.log("DATA: tokenAbi=" + JSON.stringify(tokenAbi));
// console.log("DATA: tokenBin=" + tokenBin);
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

// -----------------------------------------------------------------------------
var setupSavingsMessage = "Setup Savings";
// -----------------------------------------------------------------------------
console.log("RESULT: " + setupSavingsMessage);
var setupSavings1Tx = savings.setToken(tokenAddress, {from: contractOwnerAccount, gas: 100000});
var setupSavings2Tx = savings.init(36, {from: contractOwnerAccount, gas: 100000});

while (txpool.status.pending > 0) {
}

printTxData("mint1Tx", mint1Tx);
printTxData("setupSavings1Tx", setupSavings1Tx);
printTxData("setupSavings2Tx", setupSavings2Tx);
printBalances();
failIfGasEqualsGasUsed(mint1Tx, mintMessage + " - ac3 + ac4 11111111.11111111 tokens");
failIfGasEqualsGasUsed(setupSavings1Tx, setupSavingsMessage + " - setToken(...)");
failIfGasEqualsGasUsed(setupSavings2Tx, setupSavingsMessage + " - init(36)");

printControllerContractDetails();
printLedgerContractDetails();
printTokenContractDetails();
printSavingsContractDetails();
console.log("RESULT: ");


if (false) {
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
}


// -----------------------------------------------------------------------------
var depositIntoSavingsMessage = "Deposit Into Savings";
// -----------------------------------------------------------------------------
console.log("RESULT: " + depositIntoSavingsMessage);
var depositIntoSavings1Tx = token.approve(savingsAddress, "1000000000000", {from: account3, gas: 200000});
while (txpool.status.pending > 0) {
}
var depositIntoSavings2Tx = savings.deposit("1000000000000", {from: account3, gas: 200000});
while (txpool.status.pending > 0) {
}
printTxData("depositIntoSavings1Tx", depositIntoSavings1Tx);
printTxData("depositIntoSavings2Tx", depositIntoSavings2Tx);
printBalances();
failIfGasEqualsGasUsed(depositIntoSavings1Tx, depositIntoSavingsMessage + " - approve 1 tokens ac3 -> deposit");
failIfGasEqualsGasUsed(depositIntoSavings2Tx, depositIntoSavingsMessage + " - deposit 1 token ac3");
printControllerContractDetails();
printLedgerContractDetails();
printTokenContractDetails();
printSavingsContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var startSavingsMessage = "Start Savings";
// -----------------------------------------------------------------------------
console.log("RESULT: " + startSavingsMessage);
var startSavings1Tx = savings.lock({from: contractOwnerAccount, gas: 100000});
var startSavings2Tx = savings.finalizeInit({from: contractOwnerAccount, gas: 100000});
var startSavings3Tx = savings.start($STARTTIME, {from: contractOwnerAccount, gas: 100000});
while (txpool.status.pending > 0) {
}
printTxData("startSavings1Tx", startSavings1Tx);
printTxData("startSavings2Tx", startSavings2Tx);
printTxData("startSavings3Tx", startSavings3Tx);
printBalances();
failIfGasEqualsGasUsed(startSavings1Tx, setupSavingsMessage + " - lock()");
failIfGasEqualsGasUsed(startSavings2Tx, setupSavingsMessage + " - finalizeInit()");
failIfGasEqualsGasUsed(startSavings3Tx, setupSavingsMessage + " - start($STARTTIME $STARTTIME_S)");
printControllerContractDetails();
printLedgerContractDetails();
printTokenContractDetails();
printSavingsContractDetails();
console.log("RESULT: ");


console.log("RESULT: Printing out periodAt(...), availableForWithdrawalAt(...) and _withdrawTo(...) for the next 4 years, every 10 days");
var today = $CURRENTTIME;
var oneDay = 60 * 60 * 24;
var i;
for (i = today; i < parseInt(today) + oneDay * 365 * 4; i = parseInt(i) + oneDay * 10) {
  console.log("RESULT: " + i + " " + new Date(i * 1000).toUTCString() + " " + savings.periodAt(i) + ", " + 
    savings.availableForWithdrawalAt(i) + ", " + savings._withdrawTo("1000000000000", "0", i));
}


EOF
grep "DATA: " $TEST3OUTPUT | sed "s/DATA: //" > $DEPLOYMENTDATA
cat $DEPLOYMENTDATA
grep "RESULT: " $TEST3OUTPUT | sed "s/RESULT: //" > $TEST3RESULTS
cat $TEST3RESULTS
