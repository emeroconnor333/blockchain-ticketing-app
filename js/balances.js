// Balance checking for attendee, doorman, and venue actors

async function checkBalances() {
    const address = $("#balanceAddress").val().trim();

    if (!web3.utils.isAddress(address)) {
        showModal("Invalid Ethereum address. Please check and try again.");
        return;
    }

    try {
        const [weiBalance, tokenBalance] = await Promise.all([
            web3.eth.getBalance(address),
            new web3.eth.Contract(TICKET_ABI, TOKEN_ADDRESS)
                .methods.balanceOf(address).call()
        ]);

        const seth = web3.utils.fromWei(weiBalance, "ether");
        $("#sethBalance").html("<strong>SETH Balance:</strong> " + seth + " SETH");
        $("#tokenBalance").html("<strong>Ticket Balance:</strong> " + tokenBalance + " ticket(s)");
        $("#balanceResults").removeClass("hidden");
    } catch (err) {
        showModal("Error fetching balances: " + err.message);
    }
}
