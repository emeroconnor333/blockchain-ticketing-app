// Address book — persists labelled addresses in localStorage

const STORAGE_KEY = "emerTicket_addresses";

function loadAddresses() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
}

function saveAddresses(addresses) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
}

function refreshDropdown() {
    const addresses = loadAddresses();
    const $select = $("#savedAddresses");
    const current = $select.val();
    $select.find("option:not(:first)").remove();
    Object.entries(addresses).forEach(([label, address]) => {
        $select.append(new Option(label + " — " + address.slice(0, 10) + "…", address));
    });
    if (current) $select.val(current);
}

function saveAddress(address, label) {
    if (!address || !label) return;
    const addresses = loadAddresses();
    addresses[label] = address;
    saveAddresses(addresses);
    refreshDropdown();
}

function deleteAddress(address) {
    const addresses = loadAddresses();
    const key = Object.keys(addresses).find(k => addresses[k] === address);
    if (key) { delete addresses[key]; saveAddresses(addresses); }
    refreshDropdown();
}

// Auto-save an address with a given label (called from wallet/transaction flows)
function autoSave(label, address) {
    if (!address || !web3.utils.isAddress(address)) return;
    const addresses = loadAddresses();
    if (!Object.values(addresses).includes(address)) {
        addresses[label] = address;
        saveAddresses(addresses);
        refreshDropdown();
    }
}
