// Entry point — wires DOM events to module functions

$(document).ready(function () {

    // Show home tab on load
    $(".tabcontent").hide();
    $("#home").show();

    // Modal close
    $("#closeModal").click(closeModal);

    // ── Address book ───────────────────────────────────────────────
    refreshDropdown();

    $("#savedAddresses").change(function () {
        const address = $(this).val();
        if (address) $("#balanceAddress").val(address);
    });

    $("#saveAddressBtn").click(function () {
        const address = $("#balanceAddress").val().trim();
        const label   = $("#addressLabel").val().trim();
        if (!address || !label) { showModal("Enter both an address and a label to save."); return; }
        if (!web3.utils.isAddress(address)) { showModal("Invalid Ethereum address."); return; }
        saveAddress(address, label);
        $("#addressLabel").val("");
    });

    $("#deleteAddressBtn").click(function () {
        const address = $("#savedAddresses").val();
        if (!address) { showModal("Select an address to delete."); return; }
        deleteAddress(address);
        $("#balanceAddress").val("");
        $("#savedAddresses").val("");
    });

    // ── Create Wallet ──────────────────────────────────────────────
    $("#createWalletBtn").click(createWallet);
    $("#downloadKeystoreBtn").click(downloadKeystore);

    // Copy buttons (delegated — buttons exist after wallet creation)
    $(document).on("click", ".btn-copy", function () {
        copyField($(this).data("target"), this);
    });

    // ── Check Balances ─────────────────────────────────────────────
    $("#checkBalancesBtn").click(checkBalances);

    // ── Buy Ticket ─────────────────────────────────────────────────
    $("#buyLoadWalletBtn").click(function () {
        loadWalletFromFile("buyKeystoreFile", "buyPassword")
            .then((wallet) => {
                $("#buyWalletAddress").val(wallet.address);
                $("#buyPrivateKey").val(wallet.privateKey);
                autoSave("Purchaser", wallet.address);
            })
            .catch((err) => showModal(err.message));
    });

    $("#buyTicketsBtn").click(function () {
        const privateKey  = $("#buyPrivateKey").val();
        const ticketCount = parseInt($("#ticketAmount").val(), 10);

        if (!privateKey)                     { showModal("Please load your wallet first.");    return; }
        if (!ticketCount || ticketCount < 1) { showModal("Enter a valid number of tickets."); return; }

        buyTickets(privateKey, ticketCount);
    });

    // ── Return Ticket ──────────────────────────────────────────────
    $("#vendorLoadWalletBtn").click(function () {
        loadWalletFromFile("vendorKeystoreFile", "vendorPassword")
            .then((wallet) => {
                $("#vendorWalletAddress").val(wallet.address);
                $("#vendorPrivateKey").val(wallet.privateKey);
                autoSave("Vendor", wallet.address);
            })
            .catch((err) => showModal(err.message));
    });

    $("#returnTicketBtn").click(function () {
        const privateKey = $("#vendorPrivateKey").val();
        if (!privateKey) { showModal("Please load your wallet first."); return; }
        returnTicket(privateKey);
    });

});
