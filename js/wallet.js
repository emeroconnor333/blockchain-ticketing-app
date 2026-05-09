// Wallet creation and keystore download

function createWallet() {
    const password        = $("#walletPassword").val();
    const passwordConfirm = $("#walletPasswordConfirm").val();

    if (!password)                    { showModal("Please enter a password.");              return; }
    if (password !== passwordConfirm) { showModal("Passwords do not match.");               return; }
    if (password.length < 8)          { showModal("Password must be at least 8 characters."); return; }

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
    if (!json) { showModal("Create a wallet first."); return; }

    const blob = new Blob([json], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = address + ".json";
    a.click();
    URL.revokeObjectURL(url);
}
