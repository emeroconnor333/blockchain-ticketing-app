// UI helpers shared across modules

function openTab(evt, tabName) {
    $(".tabcontent").hide();
    $(".tabcontent").removeClass("tabshown");
    $("#" + tabName).show().addClass("tabshown");
    $(".menu a").removeClass("active");
    $(evt.currentTarget).addClass("active");
}

function showModal(message) {
    $("#modalMessage").text(message);
    $("#errorModal").css("display", "block");
}

function closeModal() {
    $("#errorModal").css("display", "none");
}

// Copy button — reads from an input or textarea by id, flashes "Copied!" briefly
function copyField(targetId, btn) {
    const el = document.getElementById(targetId);
    const text = el.tagName === "TEXTAREA" ? el.value : el.value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        const original = btn.textContent;
        btn.textContent = "Copied!";
        btn.classList.add("copied");
        setTimeout(() => {
            btn.textContent = original;
            btn.classList.remove("copied");
        }, 1500);
    });
}

// Decrypts a keystore file selected via <input type="file"> and resolves { address, privateKey }
function loadWalletFromFile(fileInputId, passwordInputId) {
    return new Promise((resolve, reject) => {
        const password = $("#" + passwordInputId).val();
        if (!password) { reject(new Error("Please enter the keystore password.")); return; }

        const file = $("#" + fileInputId)[0].files[0];
        if (!file)     { reject(new Error("Please select a keystore JSON file."));  return; }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const decrypted = web3.eth.accounts.decrypt(e.target.result, password);
                resolve(decrypted);
            } catch (err) {
                reject(new Error("Decryption failed: " + err.message));
            }
        };
        reader.readAsText(file);
    });
}
