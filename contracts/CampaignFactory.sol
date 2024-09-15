// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Campaign.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Campaign Factory Contract
 * @author
 * @notice This contract creates and manages individual Campaign contracts.
 */
contract CampaignFactory is Ownable {
    // State variables

    address[] public campaigns;
    mapping(address => address[]) public userCampaigns;
    mapping(address => uint256) private campaignIndex;
    mapping(address => bool) private isCampaign;

    // Events

    event CampaignCreated(
        address indexed campaignAddress,
        address indexed creator,
        string title,
        uint256 goalAmount,
        uint256 deadline
    );

    event CampaignRemoved(address indexed campaignAddress);
    event CampaignUpdated(address indexed campaignAddress);

    // Functions

    /**
     * @notice Create a new campaign.
     * @param _title The title of the campaign.
     * @param _description The description of the campaign.
     * @param _goalAmount The funding goal of the campaign.
     * @param _duration The duration of the campaign in seconds.
     */
    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _goalAmount,
        uint256 _duration
    ) external {
        require(bytes(_title).length > 0, "Title cannot be empty.");
        require(bytes(_description).length > 0, "Description cannot be empty.");
        require(_goalAmount > 0, "Goal amount must be greater than zero.");
        require(_duration > 0, "Duration must be greater than zero.");

        Campaign newCampaign = new Campaign(
            msg.sender,
            _title,
            _description,
            _goalAmount,
            _duration
        );

        address campaignAddress = address(newCampaign);

        campaigns.push(campaignAddress);
        userCampaigns[msg.sender].push(campaignAddress);
        campaignIndex[campaignAddress] = campaigns.length - 1;
        isCampaign[campaignAddress] = true;

        emit CampaignCreated(
            campaignAddress,
            msg.sender,
            _title,
            _goalAmount,
            block.timestamp + _duration
        );
    }

    /**
     * @notice Get all campaigns.
     * @return An array of all campaign addresses.
     */
    function getAllCampaigns() external view returns (address[] memory) {
        return campaigns;
    }

    /**
     * @notice Get campaigns created by a specific user.
     * @param _user The address of the user.
     * @return An array of campaign addresses created by the user.
     */
    function getUserCampaigns(address _user)
        external
        view
        returns (address[] memory)
    {
        return userCampaigns[_user];
    }

    /**
     * @notice Remove a campaign from the platform (admin only).
     * @param _campaignAddress The address of the campaign to remove.
     */
    function removeCampaign(address _campaignAddress) external onlyOwner {
        require(
            isCampaign[_campaignAddress],
            "Address is not a valid campaign."
        );

        uint256 index = campaignIndex[_campaignAddress];
        uint256 lastIndex = campaigns.length - 1;
        address lastCampaign = campaigns[lastIndex];

        // Swap and delete
        campaigns[index] = lastCampaign;
        campaignIndex[lastCampaign] = index;

        campaigns.pop();
        delete campaignIndex[_campaignAddress];
        delete isCampaign[_campaignAddress];

        // Remove from creator's list
        address creator = Campaign(_campaignAddress).owner();
        _removeUserCampaign(creator, _campaignAddress);

        emit CampaignRemoved(_campaignAddress);
    }

    /**
     * @notice Internal function to remove a campaign from a user's list.
     * @param _user The address of the user.
     * @param _campaignAddress The address of the campaign to remove.
     */
    function _removeUserCampaign(address _user, address _campaignAddress)
        internal
    {
        uint256 length = userCampaigns[_user].length;
        for (uint256 i = 0; i < length; i++) {
            if (userCampaigns[_user][i] == _campaignAddress) {
                userCampaigns[_user][i] = userCampaigns[_user][length - 1];
                userCampaigns[_user].pop();
                break;
            }
        }
    }

    /**
     * @notice Check if an address is a valid campaign.
     * @param _campaignAddress The address to check.
     * @return True if the address is a campaign, false otherwise.
     */
    function isValidCampaign(address _campaignAddress)
        external
        view
        returns (bool)
    {
        return isCampaign[_campaignAddress];
    }

    /**
     * @notice Get the total number of campaigns.
     * @return The total number of campaigns.
     */
    function getCampaignCount() external view returns (uint256) {
        return campaigns.length;
    }
}
