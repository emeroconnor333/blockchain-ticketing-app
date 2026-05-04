// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EmerTicket {

    // ── ERC-20 state ────────────────────────────────────────────────
    string  public name;
    string  public symbol;
    uint8   public decimals;
    uint256 public totalSupply;

    address public owner;
    uint256 public ticketPrice; // price in wei per ticket

    mapping(address => uint256)                     public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // ── ERC-20 events ───────────────────────────────────────────────
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // ── Guards ──────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    // ── Constructor ─────────────────────────────────────────────────
    constructor(
        string memory _name,
        string memory _symbol,
        uint8         _decimals,
        uint256       _initialSupply,
        uint256       _ticketPrice
    ) {
        name          = _name;
        symbol        = _symbol;
        decimals      = _decimals;
        totalSupply   = _initialSupply;
        owner         = msg.sender;
        ticketPrice   = _ticketPrice;

        // All tickets start with the vendor (owner)
        balanceOf[msg.sender] = _initialSupply;
        emit Transfer(address(0), msg.sender, _initialSupply);
    }

    // ── ERC-20 functions ────────────────────────────────────────────

    function transfer(address recipient, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient token balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient]  += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public returns (bool) {
        require(balanceOf[sender]               >= amount, "Insufficient token balance");
        require(allowance[sender][msg.sender]   >= amount, "Allowance exceeded");
        balanceOf[sender]             -= amount;
        balanceOf[recipient]          += amount;
        allowance[sender][msg.sender] -= amount;
        emit Transfer(sender, recipient, amount);
        return true;
    }

    // ── Ticket purchase ─────────────────────────────────────────────

    // Buyer sends SETH; they receive one ticket per ticketPrice paid.
    // SETH goes to the vendor (owner).
    function buyToken() public payable {
        require(msg.value >= ticketPrice, "Insufficient SETH sent");

        uint256 ticketsBought = msg.value / ticketPrice;
        require(balanceOf[owner] >= ticketsBought, "Not enough tickets available");

        balanceOf[owner]       -= ticketsBought;
        balanceOf[msg.sender]  += ticketsBought;
        emit Transfer(owner, msg.sender, ticketsBought);

        // Forward SETH to the vendor
        (bool sent, ) = owner.call{value: msg.value}("");
        require(sent, "Failed to forward SETH to vendor");
    }

    // ── Owner utilities ─────────────────────────────────────────────

    // Mint additional tickets (vendor only)
    function mint(uint256 amount) public onlyOwner {
        totalSupply           += amount;
        balanceOf[owner]      += amount;
        emit Transfer(address(0), owner, amount);
    }

    // Update ticket price (vendor only)
    function setTicketPrice(uint256 _newPrice) public onlyOwner {
        ticketPrice = _newPrice;
    }
}
