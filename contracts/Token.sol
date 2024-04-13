//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.24;

contract Token {

    string public name = "Escrow Supreme";
    string public symbol = "ESCRS";
    uint256 minimumContributionAmount = 0;

    address public owner;
    mapping(address => uint256) participants;// All addresses who have contributed to the contract balance

    address payable paymentRecipient;// The address to receive the total amount raised
    uint256 paymentAmount;// The total amount to be raised and sent to the paymentRecipient

    event Received(address sender, uint256 amount);

    constructor(uint256 minContribution, address payable recipient, uint256 targetAmount) {
        owner = msg.sender;// Initialising the creater of the contract as the owner
        paymentAmount = targetAmount;
        paymentRecipient = recipient;
        minimumContributionAmount = minContribution;
    }

    receive() external payable {
        require(msg.value >= minimumContributionAmount, "Ether value below minimum contribution");
        require(address(this).balance <= paymentAmount, "Target balance will be exceeded");
        participants[msg.sender] += msg.value;
        emit Received(msg.sender, msg.value);   
    }

    // Send the ether accumulated by the contract to the set paymentRecipient
    function sendEther(address payable recipient, uint256 amount) private {
        require( amount <= address(this).balance, "Insufficient Balance");
        recipient.transfer(amount);
    }

    // Initiate the sending of the paymentAmount to the paymentRecipient
    function executeTransaction() public {
        require(address(this).balance >= paymentAmount);
        sendEther(paymentRecipient, paymentAmount);
    }

    // Return the minimum amount that can be contributed
    function minimumContribution() external view returns (uint256) {
        return minimumContributionAmount;
    }

    // Get the address of the paymentRecipient
    function recipientAddress() public view returns (address){
        return paymentRecipient;
    }

    // Get the amount to be paid to the paymentRecipient
    function contractTargetAmount() public view returns (uint256){
        return paymentAmount;
    }

    // Get the amount of ether contributed by each participant
    function participantContribution(address wallet) public view returns (uint256){
        return participants[wallet];
    }
}