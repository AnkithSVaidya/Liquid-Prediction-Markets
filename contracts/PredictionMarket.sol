// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MiniPredictionMarket {
    // Single market structure to save space
    uint32 public yesPrice = 5000; // 50.00%
    uint32 public noPrice = 5000;  // 50.00%
    string public question = "Will BTC reach $100K in 2025?";
    
    // Simplified position tracking
    mapping(address => mapping(bool => uint)) public positions;
    
    event PositionBought(address buyer, bool isYes, uint amount);
    event PositionSold(address seller, bool isYes, uint amount);
    
    // Buy a position
    function buyPosition(bool isYes) public payable {
        require(msg.value > 0, "Amount must be positive");
        
        // Track position
        positions[msg.sender][isYes] += msg.value;
        
        // Simple price update
        if (isYes) {
            yesPrice += 100;
            noPrice -= 100;
        } else {
            yesPrice -= 100;
            noPrice += 100;
        }
        
        emit PositionBought(msg.sender, isYes, msg.value);
    }
    
    // Sell a position
    function sellPosition(bool isYes, uint amount) public {
        require(positions[msg.sender][isYes] >= amount, "Insufficient position");
        
        // Reduce position
        positions[msg.sender][isYes] -= amount;
        
        // Update price (opposite of buy)
        if (isYes) {
            yesPrice -= 100;
            noPrice += 100;
        } else {
            yesPrice += 100;
            noPrice -= 100;
        }
        
        // Send tokens back
        payable(msg.sender).transfer(amount);
        
        emit PositionSold(msg.sender, isYes, amount);
    }
    
    // Get user position
    function getUserPosition(address user, bool isYes) public view returns (uint) {
        return positions[user][isYes];
    }
}