// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ICampaign Interface
 * @author
 * @notice Interface for the Campaign contract.
 */
interface ICampaign {
    /**
     * @notice Contribute to the campaign.
     */
    function contribute() external payable;

    /**
     * @notice Withdraw funds if the goal is met.
     */
    function withdrawFunds() external;

    /**
     * @notice Issue refunds if the goal is not met.
     */
    function issueRefunds() external;

    /**
     * @notice Cancel the campaign before any contributions are made.
     */
    function cancelCampaign() external;

    /**
     * @notice Update campaign details before any contributions are made.
     * @param _title The new title.
     * @param _description The new description.
     */
    function updateCampaignInfo(string calldata _title, string calldata _description) external;

    /**
     * @notice Add a comment to the campaign.
     * @param _message The comment message.
     */
    function addComment(string calldata _message) external;

    /**
     * @notice Post an update to the campaign.
     * @param _message The update message.
     */
    function postUpdate(string calldata _message) external;

    /**
     * @notice Add a reward tier to the campaign.
     * @param _amount The minimum contribution amount for the reward.
     * @param _description The description of the reward.
     */
    function addReward(uint256 _amount, string calldata _description) external;

    /**
     * @notice Get the number of contributors.
     * @return The number of contributors.
     */
    function getContributorsCount() external view returns (uint256);

    /**
     * @notice Get the number of comments.
     * @return The number of comments.
     */
    function getCommentsCount() external view returns (uint256);

    /**
     * @notice Get the number of updates.
     * @return The number of updates.
     */
    function getUpdatesCount() external view returns (uint256);

    /**
     * @notice Get the number of rewards.
     * @return The number of rewards.
     */
    function getRewardsCount() external view returns (uint256);

    /**
     * @notice Get details of a specific reward.
     * @param _index The index of the reward in the rewards array.
     * @return amount The minimum contribution amount for the reward.
     * @return description The description of the reward.
     */
    function getReward(uint256 _index) external view returns (uint256 amount, string memory description);

    /**
     * @notice Get details of a specific comment.
     * @param _index The index of the comment in the comments array.
     * @return commenter The address of the commenter.
     * @return message The comment message.
     * @return timestamp The timestamp of the comment.
     */
    function getComment(uint256 _index) external view returns (address commenter, string memory message, uint256 timestamp);

    /**
     * @notice Get details of a specific update.
     * @param _index The index of the update in the updates array.
     * @return message The update message.
     * @return timestamp The timestamp of the update.
     */
    function getUpdate(uint256 _index) external view returns (string memory message, uint256 timestamp);

    /**
     * @notice Get the reward tier for a contributor based on their contribution amount.
     * @param _contributor The address of the contributor.
     * @return The reward description.
     */
    function getContributorReward(address _contributor) external view returns (string memory);

    /**
     * @notice Receive function to accept Ether directly.
     */
    receive() external payable;
}

