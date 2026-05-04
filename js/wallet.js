// Wallet creation and keystore download

function createWallet() {
    const password = $("#walletPassword").val();
    if (!password) { alert("Please enter a password for the keystore."); return; }

    const localWeb3 = new Web3();
    const account   = localWeb3.eth.accounts.create();
    const keystore  = localWeb3.eth.accounts.encrypt(account.privateKey, password);
    const json      = JSON.stringify(keystore, null, 2);

    $("#walletAddress").val(account.address);
    $("#privateKey").val(account.privateKey);
    $("#keystoreDisplay").val(json);
    $("#walletDetails").removeClass("hidden");
}

function downloadKeystore() {
    const json    = $("#keystoreDisplay").val();
    const address = $("#walletAddress").val();
    if (!json) { alert("Create a wallet first."); return; }

    const blob = new Blob([json], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = address + ".json";
    a.click();
    URL.revokeObjectURL(url);
}
