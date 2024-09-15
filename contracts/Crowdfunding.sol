// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CampaignFactory.sol";
import "./utils/Ownable.sol";

/**
 * @title Crowdfunding Platform Contract
 * @author
 * @notice This contract manages platform-level functionalities for the crowdfunding DApp.
 */
contract Crowdfunding is Ownable {
    // State variables
    CampaignFactory public campaignFactory;

    // Data structures
    mapping(address => bool) public reportedCampaigns;
    mapping(address => string) public reportReasons;
    address[] public reportedCampaignList;

    // Events
    event CampaignReported(
        address indexed campaignAddress,
        address indexed reporter,
        string reason
    );
    event CampaignRemoved(address indexed campaignAddress);
    event CampaignApproved(address indexed campaignAddress);

    // Constructor
    /**
     * @notice Initializes the Crowdfunding contract with the address of the CampaignFactory.
     * @param _campaignFactory The address of the deployed CampaignFactory contract.
     */
    constructor(address _campaignFactory) {
        require(
            _campaignFactory != address(0),
            "Invalid CampaignFactory address"
        );
        campaignFactory = CampaignFactory(_campaignFactory);
    }

    // Functions

    /**
     * @notice Report a campaign for violating platform rules.
     * @param _campaignAddress The address of the campaign to report.
     * @param _reason The reason for reporting the campaign.
     */
    function reportCampaign(address _campaignAddress, string calldata _reason)
        external
    {
        require(_campaignAddress != address(0), "Invalid campaign address");
        require(bytes(_reason).length > 0, "Report reason cannot be empty");
        require(
            !reportedCampaigns[_campaignAddress],
            "Campaign already reported"
        );

        reportedCampaigns[_campaignAddress] = true;
        reportReasons[_campaignAddress] = _reason;
        reportedCampaignList.push(_campaignAddress);

        emit CampaignReported(_campaignAddress, msg.sender, _reason);
    }

    /**
     * @notice Admin function to remove a reported campaign from the platform.
     * @param _campaignAddress The address of the campaign to remove.
     */
    function removeCampaign(address _campaignAddress) external onlyOwner {
        require(
            reportedCampaigns[_campaignAddress],
            "Campaign not reported"
        );

        // Remove the campaign from the factory's list
        campaignFactory.removeCampaign(_campaignAddress);

        // Reset report status
        reportedCampaigns[_campaignAddress] = false;
        delete reportReasons[_campaignAddress];
        _removeFromReportedList(_campaignAddress);

        emit CampaignRemoved(_campaignAddress);
    }

    /**
     * @notice Admin function to approve a reported campaign, dismissing the report.
     * @param _campaignAddress The address of the campaign to approve.
     */
    function approveCampaign(address _campaignAddress) external onlyOwner {
        require(
            reportedCampaigns[_campaignAddress],
            "Campaign not reported"
        );

        // Reset report status
        reportedCampaigns[_campaignAddress] = false;
        delete reportReasons[_campaignAddress];
        _removeFromReportedList(_campaignAddress);

        emit CampaignApproved(_campaignAddress);
    }

    /**
     * @notice Get the report reason for a campaign.
     * @param _campaignAddress The address of the campaign.
     * @return The reason for the report.
     */
    function getReportReason(address _campaignAddress)
        external
        view
        returns (string memory)
    {
        require(
            reportedCampaigns[_campaignAddress],
            "Campaign not reported"
        );
        return reportReasons[_campaignAddress];
    }

    /**
     * @notice Get the list of all campaigns.
     * @return An array of campaign addresses.
     */
    function getAllCampaigns() external view returns (address[] memory) {
        return campaignFactory.getAllCampaigns();
    }

    /**
     * @notice Get the list of campaigns created by a specific user.
     * @param _user The address of the user.
     * @return An array of campaign addresses.
     */
    function getUserCampaigns(address _user)
        external
        view
        returns (address[] memory)
    {
        return campaignFactory.getUserCampaigns(_user);
    }

    /**
     * @notice Get the list of reported campaigns.
     * @return An array of reported campaign addresses.
     */
    function getReportedCampaigns()
        external
        view
        returns (address[] memory)
    {
        return reportedCampaignList;
    }

    // Internal Functions

    /**
     * @notice Internal function to remove a campaign from the reported list.
     * @param _campaignAddress The address of the campaign to remove.
     */
    function _removeFromReportedList(address _campaignAddress) internal {
        uint256 length = reportedCampaignList.length;
        for (uint256 i = 0; i < length; i++) {
            if (reportedCampaignList[i] == _campaignAddress) {
                reportedCampaignList[i] = reportedCampaignList[length - 1];
                reportedCampaignList.pop();
                break;
            }
        }
    }

    // Additional admin and platform-level functions can be added here.
}

