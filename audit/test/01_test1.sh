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

TEST1OUTPUT=`grep ^TEST1OUTPUT= settings.txt | sed "s/^.*=//"`
TEST1RESULTS=`grep ^TEST1RESULTS= settings.txt | sed "s/^.*=//"`

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
ENDTIME=`echo "$CURRENTTIME+60*3" | bc`
ENDTIME_S=`date -r $ENDTIME -u`

printf "MODE              = '$MODE'\n" | tee $TEST1OUTPUT
printf "GETHATTACHPOINT   = '$GETHATTACHPOINT'\n" | tee -a $TEST1OUTPUT
printf "PASSWORD          = '$PASSWORD'\n" | tee -a $TEST1OUTPUT
printf "TOKENCONTRACTSDIR = '$TOKENCONTRACTSDIR'\n" | tee -a $TEST1OUTPUT
printf "SALESCONTRACTSDIR = '$SALESCONTRACTSDIR'\n" | tee -a $TEST1OUTPUT
printf "TRSCONTRACTSDIR   = '$TRSCONTRACTSDIR'\n" | tee -a $TEST1OUTPUT
printf "--- Token --- \n" | tee -a $TEST1OUTPUT
printf "CONTROLLERSOL     = '$CONTROLLERSOL'\n" | tee -a $TEST1OUTPUT
printf "CONTROLLERJS      = '$CONTROLLERJS'\n" | tee -a $TEST1OUTPUT
printf "LEDGERSOL         = '$LEDGERSOL'\n" | tee -a $TEST1OUTPUT
printf "LEDGERJS          = '$LEDGERJS'\n" | tee -a $TEST1OUTPUT
printf "TOKENSOL          = '$TOKENSOL'\n" | tee -a $TEST1OUTPUT
printf "TOKENJS           = '$TOKENJS'\n" | tee -a $TEST1OUTPUT
printf "--- Sales --- \n" | tee -a $TEST1OUTPUT
printf "RECEIVERSOL       = '$RECEIVERSOL'\n" | tee -a $TEST1OUTPUT
printf "RECEIVERJS        = '$RECEIVERJS'\n" | tee -a $TEST1OUTPUT
printf "SALESOL           = '$SALESOL'\n" | tee -a $TEST1OUTPUT
printf "SALEJS            = '$SALEJS'\n" | tee -a $TEST1OUTPUT
printf "--- Trs --- \n" | tee -a $TEST1OUTPUT
printf "SAVINGSSOL        = '$SAVINGSSOL'\n" | tee -a $TEST1OUTPUT
printf "SAVINGSJS         = '$SAVINGSJS'\n" | tee -a $TEST1OUTPUT
printf "--- End --- \n" | tee -a $TEST1OUTPUT
printf "DEPLOYMENTDATA    = '$DEPLOYMENTDATA'\n" | tee -a $TEST1OUTPUT
printf "TEST1OUTPUT       = '$TEST1OUTPUT'\n" | tee -a $TEST1OUTPUT
printf "TEST1RESULTS      = '$TEST1RESULTS'\n" | tee -a $TEST1OUTPUT
printf "CURRENTTIME       = '$CURRENTTIME' '$CURRENTTIMES'\n" | tee -a $TEST1OUTPUT
printf "STARTTIME         = '$STARTTIME' '$STARTTIME_S'\n" | tee -a $TEST1OUTPUT
printf "ENDTIME           = '$ENDTIME' '$ENDTIME_S'\n" | tee -a $TEST1OUTPUT

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
#`perl -pi -e "s/STARTDATE \= 1498741200;.*$/STARTDATE \= $STARTTIME; \/\/ $STARTTIME_S/" $DAOCASINOTOKENTEMPSOL`
#`perl -pi -e "s/ENDDATE \= STARTDATE \+ 28 days;.*$/ENDDATE \= STARTDATE \+ 5 minutes;/" $DAOCASINOTOKENTEMPSOL`
#`perl -pi -e "s/CAP \= 84417 ether;.*$/CAP \= 100 ether;/" $DAOCASINOTOKENTEMPSOL`

DIFFS1=`diff $TOKENCONTRACTSDIR/$CONTROLLERSOL $CONTROLLERSOL`
echo "--- Differences $TOKENCONTRACTSDIR/$CONTROLLERSOL $CONTROLLERSOL ---" | tee -a $TEST1OUTPUT
echo "$DIFFS1" | tee -a $TEST1OUTPUT

DIFFS1=`diff $TOKENCONTRACTSDIR/$LEDGERSOL $LEDGERSOL`
echo "--- Differences $TOKENCONTRACTSDIR/$LEDGERSOL $LEDGERSOL ---" | tee -a $TEST1OUTPUT
echo "$DIFFS1" | tee -a $TEST1OUTPUT

DIFFS1=`diff $TOKENCONTRACTSDIR/$TOKENSOL $TOKENSOL`
echo "--- Differences $TOKENCONTRACTSDIR/$TOKENSOL $TOKENSOL ---" | tee -a $TEST1OUTPUT
echo "$DIFFS1" | tee -a $TEST1OUTPUT

DIFFS1=`diff $SALESCONTRACTSDIR/$RECEIVERSOL $RECEIVERSOL`
echo "--- Differences $SALESCONTRACTSDIR/$RECEIVERSOL $RECEIVERSOL ---" | tee -a $TEST1OUTPUT
echo "$DIFFS1" | tee -a $TEST1OUTPUT

DIFFS1=`diff $SALESCONTRACTSDIR/$SALESOL $SALESOL`
echo "--- Differences $SALESCONTRACTSDIR/$SALESOL $SALESOL ---" | tee -a $TEST1OUTPUT
echo "$DIFFS1" | tee -a $TEST1OUTPUT

DIFFS1=`diff $TRSCONTRACTSDIR/$SAVINGSSOL $SAVINGSSOL`
echo "--- Differences $TRSCONTRACTSDIR/$SAVINGSSOL $SAVINGSSOL ---" | tee -a $TEST1OUTPUT
echo "$DIFFS1" | tee -a $TEST1OUTPUT

echo "var controllerOutput=`solc --optimize --combined-json abi,bin,interface $CONTROLLERSOL`;" > $CONTROLLERJS
echo "var ledgerOutput=`solc --optimize --combined-json abi,bin,interface $LEDGERSOL`;" > $LEDGERJS
echo "var tokenOutput=`solc --optimize --combined-json abi,bin,interface $TOKENSOL`;" > $TOKENJS
echo "var receiverOutput=`solc --optimize --combined-json abi,bin,interface $RECEIVERSOL`;" > $RECEIVERJS
echo "var salesOutput=`solc --optimize --combined-json abi,bin,interface $SALESOL`;" > $SALEJS
echo "var savingsOutput=`solc --optimize --combined-json abi,bin,interface $SAVINGSSOL`;" > $SAVINGSJS


geth --verbosity 3 attach $GETHATTACHPOINT << EOF | tee -a $TEST1OUTPUT
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
var salesAbi = JSON.parse(salesOutput.contracts["$SALESOL:Sale"].abi);
var salesBin = "0x" + salesOutput.contracts["$SALESOL:Sale"].bin;
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
console.log(JSON.stringify(controllerContract));
var controllerTx = null;
var controllerAddress = null;

var controller = controllerContract.new({from: contractOwnerAccount, data: controllerBin, gas: 6000000},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        dctTx = contract.transactionHash;
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
console.log(JSON.stringify(ledgerContract));
var ledgerTx = null;
var ledgerAddress = null;

var ledger = ledgerContract.new({from: contractOwnerAccount, data: ledgerBin, gas: 6000000},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        dctTx = contract.transactionHash;
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
console.log(JSON.stringify(tokenContract));
var tokenTx = null;
var tokenAddress = null;

var token = tokenContract.new({from: contractOwnerAccount, data: tokenBin, gas: 6000000},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        dctTx = contract.transactionHash;
      } else {
        tokenAddress = contract.address;
        addAccount(tokenAddress, "Token Contract");
        addTokenContractAddressAndAbi(tokenAddress, tokenAbi);
        console.log("DATA: tokenAddress=" + tokenAddress);
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
grep "DATA: " $TEST1OUTPUT | sed "s/DATA: //" > $DEPLOYMENTDATA
cat $DEPLOYMENTDATA
grep "RESULT: " $TEST1OUTPUT | sed "s/RESULT: //" > $TEST1RESULTS
cat $TEST1RESULTS
