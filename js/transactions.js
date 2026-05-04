// Signed transaction helpers: buy ticket and return ticket to vendor

async function sendSignedTx(tx, privateKey, requestFieldId, resultFieldId) {
    showModal("Transaction in progress — this may take up to 30 seconds…");
    try {
        const signed  = await web3.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
        $("#" + requestFieldId).val(JSON.stringify(tx, null, 2));
        $("#" + resultFieldId ).val(JSON.stringify(receipt, null, 2));
        closeModal();
        showModal("Transaction confirmed! Hash: " + receipt.transactionHash);
    } catch (err) {
        closeModal();
        showModal("Transaction failed: " + err.message);
    }
}

async function buyTickets(privateKey, ticketCount) {
    const contract    = new web3.eth.Contract(TICKET_ABI, TOKEN_ADDRESS);
    const totalEth    = (parseFloat(TICKET_PRICE) * ticketCount).toFixed(10);
    const encodedABI  = contract.methods.buyToken().encodeABI();

    const tx = {
        from:  web3.eth.accounts.privateKeyToAccount(privateKey).address,
        to:    TOKEN_ADDRESS,
        gas:   200000,
        data:  encodedABI,
        value: web3.utils.toWei(totalEth, "ether")
    };

    await sendSignedTx(tx, privateKey, "buyTxRequest", "buyTxResult");
}

async function returnTicket(privateKey) {
    const contract   = new web3.eth.Contract(TICKET_ABI, TOKEN_ADDRESS);
    const encodedABI = contract.methods.transfer(VENDOR_ADDRESS, 1).encodeABI();

    const tx = {
        from: web3.eth.accounts.privateKeyToAccount(privateKey).address,
        to:   TOKEN_ADDRESS,
        gas:  200000,
        data: encodedABI
    };

    await sendSignedTx(tx, privateKey, "vendorTxRequest", "vendorTxResult");
}
