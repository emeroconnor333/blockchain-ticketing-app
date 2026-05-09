# Emer's Blockchain Ticketing DApp

A Web3 distributed application implementing a simple ticketing system on the Ethereum Sepolia testnet. Users can create wallets, purchase ticket tokens using SETH, and return tickets to the vendor. The smart contract `EmerTicket.sol` implements the ERC-20 standard extended with a payable `buyToken()` function.

## Built With

- **Solidity** — ERC-20 smart contract deployed on Sepolia via Remix IDE
- **Web3.js v1.10.0** — blockchain interaction from the browser
- **jQuery** — DOM manipulation
- **HTML / CSS / JavaScript** — frontend, no frameworks

---

## Using the Deployed Website

Visit [https://emeroconnor333.github.io/blockchain-ticketing-app/](https://emeroconnor333.github.io/blockchain-ticketing-app/)

### 1. Create a Wallet
- Go to the **Create Wallet** tab
- Enter a password and confirm it (minimum 8 characters)
- Click **Create Wallet** — your address, private key, and keystore JSON are displayed
- Click **Download Keystore** to save the encrypted wallet file — keep this safe

### 2. Top Up with SETH
- Copy your wallet address from the Create Wallet tab
- Get free Sepolia ETH from a faucet such as [https://sepoliafaucet.com](https://sepoliafaucet.com)

### 3. Check Balances
- Go to the **Check Balances** tab
- Paste any Ethereum address and click **Check Balances** to view its SETH and ticket token balance
- Save frequently used addresses with a label for quick access via the dropdown

### 4. Buy a Ticket
- Go to the **Buy a Ticket** tab
- Enter your keystore password, select your keystore JSON file, and click **Load Wallet**
- Enter the number of tickets (each costs 0.00001 SETH) and click **Buy Tickets**
- The transaction request and receipt are displayed once confirmed

### 5. Return a Ticket
- Go to the **Return Ticket** tab
- Load your wallet the same way as above
- Click **Return Ticket** to transfer one ticket token back to the vendor

---

## Running Locally with Your Own Contract

### Prerequisites
- [VS Code](https://code.visualstudio.com/) with the Live Server extension
- [MetaMask](https://metamask.io/) browser extension connected to Sepolia
- A Sepolia wallet with test ETH (from [https://sepoliafaucet.com](https://sepoliafaucet.com))

### 1. Clone the Repo
```bash
git clone https://github.com/emeroconnor333/blockchain-ticketing-app.git
cd blockchain-ticketing-app
```

### 2. Deploy the Smart Contract via Remix
1. Go to [https://remix.ethereum.org](https://remix.ethereum.org)
2. Create a new file and paste in the contents of `EmerTicket.sol`
3. Compile with Solidity compiler `^0.8.0`
4. Under **Deploy & Run**, set the environment to **Injected Provider — MetaMask** and select the Sepolia network
5. Enter the constructor arguments:
   - `_name`: `"EmerTicket"`
   - `_symbol`: `"TKT"`
   - `_decimals`: `0`
   - `_initialSupply`: `1000`
   - `_ticketPrice`: `10000000000000` (0.00001 SETH in wei)
6. Click **Deploy** and confirm the transaction in MetaMask
7. Copy the deployed contract address from Remix

### 3. Configure the Frontend
Open `js/config.js` and update the following values:

```js
const TOKEN_ADDRESS  = "0xYourDeployedContractAddress";
const VENDOR_ADDRESS = "0xYourVendorWalletAddress";
```

### 4. Run the App
- Right-click `index.html` in VS Code and select **Open with Live Server**
- The app opens in your browser connected to your own deployed contract
