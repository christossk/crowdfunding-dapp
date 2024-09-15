// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./libraries/SafeMath.sol";

/**
 * @title Campaign Contract
 * @author
 * @notice This contract represents an individual crowdfunding campaign.
 */
contract Campaign is Ownable {
    using SafeMath for uint256;

    // State variables

    uint256 public goalAmount;
    uint256 public fundsRaised;
    uint256 public deadline;
    string public title;
    string public description;
    bool public isOpen;
    bool public isCanceled;

    // Reward tiers
    struct Reward {
        uint256 amount; // Minimum contribution amount for the reward
        string description; // Description of the reward
    }

    Reward[] public rewards;

    // Comments and updates
    struct Comment {
        address commenter;
        string message;
        uint256 timestamp;
    }

    Comment[] public comments;

    struct Update {
        string message;
        uint256 timestamp;
    }

    Update[] public updates;

    // Data structures

    mapping(address => uint256) public contributions;
    address[] public contributors;

    // Events

    event ContributionReceived(address indexed contributor, uint256 amount);
    event FundsWithdrawn(address indexed creator, uint256 amount);
    event RefundIssued(address indexed contributor, uint256 amount);
    event CampaignCanceled(address indexed creator);
    event CampaignUpdated(string newTitle, string newDescription);
    event CommentAdded(address indexed commenter, string message);
    event UpdatePosted(string message);
    event RewardAdded(uint256 amount, string description);

    // Modifiers

    modifier isActive() {
        require(isOpen && !isCanceled, "Campaign is not active.");
        _;
    }

    modifier beforeDeadline() {
        require(block.timestamp <= deadline, "Deadline has passed.");
        _;
    }

    modifier afterDeadline() {
        require(block.timestamp > deadline, "Deadline not reached.");
        _;
    }

    // Constructor

    /**
     * @notice Initializes the campaign with the provided details.
     * @param _creator The address of the campaign creator.
     * @param _title The title of the campaign.
     * @param _description The description of the campaign.
     * @param _goalAmount The funding goal of the campaign.
     * @param _duration The duration of the campaign in seconds.
     */
    constructor(
        address _creator,
        string memory _title,
        string memory _description,
        uint256 _goalAmount,
        uint256 _duration
    ) {
        require(_creator != address(0), "Invalid creator address.");
        require(_goalAmount > 0, "Goal amount must be greater than zero.");
        require(_duration > 0, "Duration must be greater than zero.");

        transferOwnership(_creator);
        title = _title;
        description = _description;
        goalAmount = _goalAmount;
        deadline = block.timestamp + _duration;
        isOpen = true;
        isCanceled = false;
    }

    // Functions

    /**
     * @notice Contribute to the campaign.
     */
    function contribute() external payable isActive beforeDeadline {
        require(msg.value > 0, "Contribution must be greater than zero.");

        if (contributions[msg.sender] == 0) {
            contributors.push(msg.sender);
        }

        contributions[msg.sender] = contributions[msg.sender].add(msg.value);
        fundsRaised = fundsRaised.add(msg.value);

        emit ContributionReceived(msg.sender, msg.value);

        // Close campaign if goal is met
        if (fundsRaised >= goalAmount) {
            isOpen = false;
        }
    }

    /**
     * @notice Withdraw funds if the goal is met.
     */
    function withdrawFunds() external onlyOwner afterDeadline {
        require(fundsRaised >= goalAmount, "Funding goal not reached.");

        uint256 amount = fundsRaised;
        fundsRaised = 0;
        payable(owner()).transfer(amount);

        emit FundsWithdrawn(owner(), amount);
    }

    /**
     * @notice Issue refunds if the goal is not met.
     */
    function issueRefunds() external afterDeadline {
        require(fundsRaised < goalAmount, "Funding goal was reached.");
        require(isOpen, "Refunds already issued or campaign canceled.");

        isOpen = false;

        for (uint256 i = 0; i < contributors.length; i++) {
            address contributor = contributors[i];
            uint256 amount = contributions[contributor];

            if (amount > 0) {
                contributions[contributor] = 0;
                payable(contributor).transfer(amount);
                emit RefundIssued(contributor, amount);
            }
        }
    }

    /**
     * @notice Cancel the campaign before any contributions are made.
     */
    function cancelCampaign() external onlyOwner isActive beforeDeadline {
        require(fundsRaised == 0, "Cannot cancel after receiving contributions.");

        isCanceled = true;
        isOpen = false;

        emit CampaignCanceled(owner());
    }

    /**
     * @notice Update campaign details before any contributions are made.
     * @param _title The new title.
     * @param _description The new description.
     */
    function updateCampaignInfo(string memory _title, string memory _description)
        external
        onlyOwner
        isActive
        beforeDeadline
    {
        require(fundsRaised == 0, "Cannot update after receiving contributions.");

        title = _title;
        description = _description;

        emit CampaignUpdated(_title, _description);
    }

    /**
     * @notice Add a comment to the campaign.
     * @param _message The comment message.
     */
    function addComment(string calldata _message) external {
        require(bytes(_message).length > 0, "Comment cannot be empty.");

        comments.push(
            Comment({
                commenter: msg.sender,
                message: _message,
                timestamp: block.timestamp
            })
        );

        emit CommentAdded(msg.sender, _message);
    }

    /**
     * @notice Post an update to the campaign.
     * @param _message The update message.
     */
    function postUpdate(string calldata _message) external onlyOwner {
        require(bytes(_message).length > 0, "Update message cannot be empty.");

        updates.push(
            Update({
                message: _message,
                timestamp: block.timestamp
            })
        );

        emit UpdatePosted(_message);
    }

    /**
     * @notice Add a reward tier to the campaign.
     * @param _amount The minimum contribution amount for the reward.
     * @param _description The description of the reward.
     */
    function addReward(uint256 _amount, string calldata _description) external onlyOwner {
        require(_amount > 0, "Reward amount must be greater than zero.");
        require(bytes(_description).length > 0, "Reward description cannot be empty.");

        rewards.push(
            Reward({
                amount: _amount,
                description: _description
            })
        );

        emit RewardAdded(_amount, _description);
    }

    /**
     * @notice Get the number of contributors.
     * @return The number of contributors.
     */
    function getContributorsCount() external view returns (uint256) {
        return contributors.length;
    }

    /**
     * @notice Get the number of comments.
     * @return The number of comments.
     */
    function getCommentsCount() external view returns (uint256) {
        return comments.length;
    }

    /**
     * @notice Get the number of updates.
     * @return The number of updates.
     */
    function getUpdatesCount() external view returns (uint256) {
        return updates.length;
    }

    /**
     * @notice Get the number of rewards.
     * @return The number of rewards.
     */
    function getRewardsCount() external view returns (uint256) {
        return rewards.length;
    }

    /**
     * @notice Get details of a specific reward.
     * @param _index The index of the reward in the rewards array.
     * @return The amount and description of the reward.
     */
    function getReward(uint256 _index)
        external
        view
        returns (uint256 amount, string memory description)
    {
        require(_index < rewards.length, "Reward index out of bounds.");

        Reward storage reward = rewards[_index];
        return (reward.amount, reward.description);
    }

    /**
     * @notice Get details of a specific comment.
     * @param _index The index of the comment in the comments array.
     * @return The commenter address, message, and timestamp.
     */
    function getComment(uint256 _index)
        external
        view
        returns (address commenter, string memory message, uint256 timestamp)
    {
        require(_index < comments.length, "Comment index out of bounds.");

        Comment storage comment = comments[_index];
        return (comment.commenter, comment.message, comment.timestamp);
    }

    /**
     * @notice Get details of a specific update.
     * @param _index The index of the update in the updates array.
     * @return The message and timestamp.
     */
    function getUpdate(uint256 _index)
        external
        view
        returns (string memory message, uint256 timestamp)
    {
        require(_index < updates.length, "Update index out of bounds.");

        Update storage update = updates[_index];
        return (update.message, update.timestamp);
    }

    /**
     * @notice Get the reward tier for a contributor based on their contribution amount.
     * @param _contributor The address of the contributor.
     * @return The reward description.
     */
    function getContributorReward(address _contributor)
        external
        view
        returns (string memory)
    {
        uint256 contribution = contributions[_contributor];
        string memory rewardDescription = "";

        for (uint256 i = rewards.length; i > 0; i--) {
            if (contribution >= rewards[i - 1].amount) {
                rewardDescription = rewards[i - 1].description;
                break;
            }
        }

        return rewardDescription;
    }

    // Fallback function to receive Ether
    receive() external payable {
        contribute();
    }
}

