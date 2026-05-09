/**
 * Unit tests for EmerTicket DApp frontend logic.
 *
 * Run with: npx jest
 * Install:  npm install --save-dev jest jest-environment-jsdom
 *
 * Web3 and contract calls are mocked — no network connection required.
 *
 * The source files use plain browser globals (no module.exports), so they are
 * loaded via evalFile() into the global scope rather than require().
 */

const fs   = require("fs");
const path = require("path");

function evalFile(relPath) {
    const src = fs.readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
    // eslint-disable-next-line no-eval
    global.eval(src);
}

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockAccount = {
    address:    "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12",
    privateKey: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef"
};

const mockKeystore = { version: 3, id: "test-uuid", address: mockAccount.address, crypto: {} };

const mockReceipt = { transactionHash: "0xabc123", status: true };

// Shared Web3 instance — returned by every `new Web3()` call so that
// wallet.js's localWeb3 and the global web3 share the same mock methods.
const mockWeb3Instance = {
    eth: {
        accounts: {
            create:              jest.fn().mockReturnValue(mockAccount),
            encrypt:             jest.fn().mockReturnValue(mockKeystore),
            decrypt:             jest.fn().mockReturnValue(mockAccount),
            signTransaction:     jest.fn().mockResolvedValue({ rawTransaction: "0xsigned" }),
            privateKeyToAccount: jest.fn().mockReturnValue({ address: mockAccount.address })
        },
        getBalance:           jest.fn(),
        Contract:             jest.fn(),
        sendSignedTransaction: jest.fn()
    },
    utils: {
        isAddress: jest.fn(),
        fromWei:   jest.fn(),
        toWei:     jest.fn()
    }
};

global.Web3 = jest.fn().mockImplementation(() => mockWeb3Instance);

// Global jQuery mock
const fields = {};
global.$ = jest.fn((selector) => ({
    val:          (v) => v !== undefined ? (fields[selector] = v, undefined) : (fields[selector] || ""),
    html:         jest.fn(),
    removeClass:  jest.fn(),
    addClass:     jest.fn(),
    css:          jest.fn(),
    text:         jest.fn()
}));

// UI helpers
global.showModal  = jest.fn();
global.closeModal = jest.fn();

// Config constants
global.TICKET_PRICE   = "0.00001";
global.TOKEN_ADDRESS  = "0x4eb879a4249760db87b12138dc337be281846bef";
global.VENDOR_ADDRESS = "0x5E539086F76ed7F3E57a372Af15aF5b10D70B0D9";
global.TICKET_ABI     = [];

// Shared web3 instance (as config.js sets it)
global.web3 = mockWeb3Instance;

// Load modules under test — source files use browser globals, not module.exports
evalFile("js/wallet.js");
evalFile("js/balances.js");
evalFile("js/transactions.js");

// ── Helpers ──────────────────────────────────────────────────────────────────

function setField(selector, value) { fields[selector] = value; }
function clearFields()             { Object.keys(fields).forEach(k => delete fields[k]); }
function clearMocks()              { jest.clearAllMocks(); clearFields(); }

// ── Wallet Creation ───────────────────────────────────────────────────────────

describe("createWallet()", () => {

    beforeEach(clearMocks);

    test("shows error when password is empty", () => {
        setField("#walletPassword", "");
        setField("#walletPasswordConfirm", "");
        createWallet();
        expect(showModal).toHaveBeenCalledWith("Please enter a password.");
        expect(web3.eth.accounts.create).not.toHaveBeenCalled();
    });

    test("shows error when passwords do not match", () => {
        setField("#walletPassword",        "password1");
        setField("#walletPasswordConfirm", "password2");
        createWallet();
        expect(showModal).toHaveBeenCalledWith("Passwords do not match.");
        expect(web3.eth.accounts.create).not.toHaveBeenCalled();
    });

    test("shows error when password is shorter than 8 characters", () => {
        setField("#walletPassword",        "short");
        setField("#walletPasswordConfirm", "short");
        createWallet();
        expect(showModal).toHaveBeenCalledWith("Password must be at least 8 characters.");
        expect(web3.eth.accounts.create).not.toHaveBeenCalled();
    });

    test("creates wallet and populates fields when inputs are valid", () => {
        setField("#walletPassword",        "strongpassword");
        setField("#walletPasswordConfirm", "strongpassword");
        createWallet();
        expect(web3.eth.accounts.create).toHaveBeenCalled();
        expect(web3.eth.accounts.encrypt).toHaveBeenCalledWith(mockAccount.privateKey, "strongpassword");
        expect(fields["#walletAddress"]).toBe(mockAccount.address);
        expect(fields["#privateKey"]).toBe(mockAccount.privateKey);
    });

    test("encrypts keystore with the provided password", () => {
        setField("#walletPassword",        "mypassword123");
        setField("#walletPasswordConfirm", "mypassword123");
        createWallet();
        expect(web3.eth.accounts.encrypt).toHaveBeenCalledWith(
            mockAccount.privateKey,
            "mypassword123"
        );
    });

    test("does not show error modal on successful wallet creation", () => {
        setField("#walletPassword",        "validpassword");
        setField("#walletPasswordConfirm", "validpassword");
        createWallet();
        expect(showModal).not.toHaveBeenCalled();
    });

});

// ── Check Balances ────────────────────────────────────────────────────────────

describe("checkBalances()", () => {

    beforeEach(clearMocks);

    test("shows error for an empty address", async () => {
        setField("#balanceAddress", "");
        web3.utils.isAddress.mockReturnValue(false);
        await checkBalances();
        expect(showModal).toHaveBeenCalledWith("Invalid Ethereum address. Please check and try again.");
    });

    test("shows error for a malformed address", async () => {
        setField("#balanceAddress", "not-an-address");
        web3.utils.isAddress.mockReturnValue(false);
        await checkBalances();
        expect(showModal).toHaveBeenCalledWith("Invalid Ethereum address. Please check and try again.");
    });

    test("fetches SETH and token balances for a valid address", async () => {
        setField("#balanceAddress", mockAccount.address);
        web3.utils.isAddress.mockReturnValue(true);
        web3.utils.fromWei.mockReturnValue("1.5");

        const mockBalanceOf = jest.fn().mockResolvedValue("3");
        web3.eth.getBalance.mockResolvedValue("1500000000000000000");
        web3.eth.Contract.mockImplementation(() => ({
            methods: { balanceOf: () => ({ call: mockBalanceOf }) }
        }));

        await checkBalances();

        expect(web3.eth.getBalance).toHaveBeenCalledWith(mockAccount.address);
        expect(mockBalanceOf).toHaveBeenCalled();
    });

    test("shows error modal when the RPC call fails", async () => {
        setField("#balanceAddress", mockAccount.address);
        web3.utils.isAddress.mockReturnValue(true);
        web3.eth.getBalance.mockRejectedValue(new Error("Network error"));

        web3.eth.Contract.mockImplementation(() => ({
            methods: { balanceOf: () => ({ call: jest.fn().mockResolvedValue("0") }) }
        }));

        await checkBalances();
        expect(showModal).toHaveBeenCalledWith(expect.stringContaining("Error fetching balances:"));
    });

});

// ── Buy Tickets ───────────────────────────────────────────────────────────────

describe("buyTickets()", () => {

    beforeEach(clearMocks);

    test("calculates correct ETH value for 1 ticket", async () => {
        web3.utils.toWei.mockReturnValue("10000000000000");
        web3.eth.accounts.signTransaction.mockResolvedValue({ rawTransaction: "0xsigned" });
        web3.eth.sendSignedTransaction.mockResolvedValue(mockReceipt);
        web3.eth.Contract.mockImplementation(() => ({
            methods: { buyToken: () => ({ encodeABI: () => "0xencoded" }) }
        }));

        await buyTickets(mockAccount.privateKey, 1);

        expect(web3.utils.toWei).toHaveBeenCalledWith("0.0000100000", "ether");
    });

    test("calculates correct ETH value for 3 tickets", async () => {
        web3.utils.toWei.mockReturnValue("30000000000000");
        web3.eth.accounts.signTransaction.mockResolvedValue({ rawTransaction: "0xsigned" });
        web3.eth.sendSignedTransaction.mockResolvedValue(mockReceipt);
        web3.eth.Contract.mockImplementation(() => ({
            methods: { buyToken: () => ({ encodeABI: () => "0xencoded" }) }
        }));

        await buyTickets(mockAccount.privateKey, 3);

        expect(web3.utils.toWei).toHaveBeenCalledWith("0.0000300000", "ether");
    });

    test("sends transaction to the contract address", async () => {
        web3.utils.toWei.mockReturnValue("10000000000000");
        web3.eth.accounts.signTransaction.mockResolvedValue({ rawTransaction: "0xsigned" });
        web3.eth.sendSignedTransaction.mockResolvedValue(mockReceipt);
        web3.eth.Contract.mockImplementation(() => ({
            methods: { buyToken: () => ({ encodeABI: () => "0xencoded" }) }
        }));

        await buyTickets(mockAccount.privateKey, 1);

        expect(web3.eth.accounts.signTransaction).toHaveBeenCalledWith(
            expect.objectContaining({ to: TOKEN_ADDRESS }),
            mockAccount.privateKey
        );
    });

    test("shows success modal with transaction hash on confirmation", async () => {
        web3.utils.toWei.mockReturnValue("10000000000000");
        web3.eth.accounts.signTransaction.mockResolvedValue({ rawTransaction: "0xsigned" });
        web3.eth.sendSignedTransaction.mockResolvedValue(mockReceipt);
        web3.eth.Contract.mockImplementation(() => ({
            methods: { buyToken: () => ({ encodeABI: () => "0xencoded" }) }
        }));

        await buyTickets(mockAccount.privateKey, 1);

        expect(showModal).toHaveBeenCalledWith(
            expect.stringContaining(mockReceipt.transactionHash)
        );
    });

    test("shows failure modal when transaction is rejected", async () => {
        web3.utils.toWei.mockReturnValue("10000000000000");
        web3.eth.accounts.signTransaction.mockResolvedValue({ rawTransaction: "0xsigned" });
        web3.eth.sendSignedTransaction.mockRejectedValue(new Error("Insufficient SETH sent"));
        web3.eth.Contract.mockImplementation(() => ({
            methods: { buyToken: () => ({ encodeABI: () => "0xencoded" }) }
        }));

        await buyTickets(mockAccount.privateKey, 1);

        expect(showModal).toHaveBeenCalledWith(
            expect.stringContaining("Transaction failed: Insufficient SETH sent")
        );
    });

});

// ── Return Ticket ─────────────────────────────────────────────────────────────

describe("returnTicket()", () => {

    beforeEach(clearMocks);

    test("encodes a transfer of 1 token to the vendor address", async () => {
        const mockEncodeABI = jest.fn().mockReturnValue("0xencoded");
        const mockTransfer  = jest.fn().mockReturnValue({ encodeABI: mockEncodeABI });
        web3.eth.Contract.mockImplementation(() => ({
            methods: { transfer: mockTransfer }
        }));
        web3.eth.accounts.signTransaction.mockResolvedValue({ rawTransaction: "0xsigned" });
        web3.eth.sendSignedTransaction.mockResolvedValue(mockReceipt);

        await returnTicket(mockAccount.privateKey);

        expect(mockTransfer).toHaveBeenCalledWith(VENDOR_ADDRESS, 1);
    });

    test("sends transaction to the contract address", async () => {
        web3.eth.Contract.mockImplementation(() => ({
            methods: { transfer: () => ({ encodeABI: () => "0xencoded" }) }
        }));
        web3.eth.accounts.signTransaction.mockResolvedValue({ rawTransaction: "0xsigned" });
        web3.eth.sendSignedTransaction.mockResolvedValue(mockReceipt);

        await returnTicket(mockAccount.privateKey);

        expect(web3.eth.accounts.signTransaction).toHaveBeenCalledWith(
            expect.objectContaining({ to: TOKEN_ADDRESS }),
            mockAccount.privateKey
        );
    });

    test("does not include a value field (token transfer, not ETH send)", async () => {
        web3.eth.Contract.mockImplementation(() => ({
            methods: { transfer: () => ({ encodeABI: () => "0xencoded" }) }
        }));
        web3.eth.accounts.signTransaction.mockResolvedValue({ rawTransaction: "0xsigned" });
        web3.eth.sendSignedTransaction.mockResolvedValue(mockReceipt);

        await returnTicket(mockAccount.privateKey);

        expect(web3.eth.accounts.signTransaction).toHaveBeenCalledWith(
            expect.not.objectContaining({ value: expect.anything() }),
            mockAccount.privateKey
        );
    });

    test("shows success modal with transaction hash on confirmation", async () => {
        web3.eth.Contract.mockImplementation(() => ({
            methods: { transfer: () => ({ encodeABI: () => "0xencoded" }) }
        }));
        web3.eth.accounts.signTransaction.mockResolvedValue({ rawTransaction: "0xsigned" });
        web3.eth.sendSignedTransaction.mockResolvedValue(mockReceipt);

        await returnTicket(mockAccount.privateKey);

        expect(showModal).toHaveBeenCalledWith(
            expect.stringContaining(mockReceipt.transactionHash)
        );
    });

    test("shows failure modal when user has no tickets", async () => {
        web3.eth.Contract.mockImplementation(() => ({
            methods: { transfer: () => ({ encodeABI: () => "0xencoded" }) }
        }));
        web3.eth.accounts.signTransaction.mockResolvedValue({ rawTransaction: "0xsigned" });
        web3.eth.sendSignedTransaction.mockRejectedValue(new Error("Insufficient token balance"));

        await returnTicket(mockAccount.privateKey);

        expect(showModal).toHaveBeenCalledWith(
            expect.stringContaining("Transaction failed: Insufficient token balance")
        );
    });

});
