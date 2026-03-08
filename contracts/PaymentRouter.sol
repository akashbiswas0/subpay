// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC20Precompile.sol";
import "./interfaces/IXcm.sol";

/// @title PaymentRouter
/// @notice Handles same-chain PAS/USDt/USDC payments, split bills, and
contract PaymentRouter {
    address constant USDT_PRECOMPILE =
    address(0x000007c000000000000000000000000001200000);

address constant USDC_PRECOMPILE =
    address(0x0000053900000000000000000000000001200000);

    IXcm constant XCM = IXcm(XCM_PRECOMPILE_ADDRESS);

    uint8 constant TOKEN_PAS = 0;
    uint8 constant TOKEN_USDT = 1;
    uint8 constant TOKEN_USDC = 2;

    uint32 constant PEOPLE_CHAIN_PARA_ID = 1004;

    event PaymentSent(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint8 tokenType
    );

    event BillSplit(
        address indexed from,
        address[] recipients,
        uint256[] amounts,
        uint256 totalAmount,
        uint8 tokenType
    );

    event CrossChainPaymentSent(
        address indexed from,
        uint256 amount,
        uint32 paraId
    );

    function _resolveToken(uint8 tokenType) internal pure returns (address) {
        if (tokenType == TOKEN_USDT) return USDT_PRECOMPILE;
        if (tokenType == TOKEN_USDC) return USDC_PRECOMPILE;
        revert("Invalid token type for ERC-20 path");
    }

    function sendPayment(
        address payable recipient,
        uint256 amount,
        uint8 tokenType
    ) external payable {
        require(recipient != address(0), "Invalid recipient");
        require(recipient != msg.sender, "Cannot send to yourself");
        require(tokenType <= TOKEN_USDC, "Invalid token type");

        if (tokenType == TOKEN_PAS) {
            require(msg.value > 0, "PAS amount required in msg.value");
            (bool ok, ) = recipient.call{value: msg.value}("");
            require(ok, "PAS transfer failed");
            emit PaymentSent(msg.sender, recipient, msg.value, TOKEN_PAS);
        } else {
            require(amount > 0, "Amount must be > 0");
            IERC20Precompile token = IERC20Precompile(_resolveToken(tokenType));
            require(
                token.allowance(msg.sender, address(this)) >= amount,
                "Insufficient allowance: call approve first"
            );

            bool ok = token.transferFrom(msg.sender, recipient, amount);
            require(ok, "Token transfer failed");
            emit PaymentSent(msg.sender, recipient, amount, tokenType);
        }
    }

    function splitBill(
        address[] calldata recipients,
        uint256[] calldata amounts,
        uint8 tokenType
    ) external payable {
        require(recipients.length > 0, "No recipients");
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length <= 20, "Max 20 recipients");
        require(tokenType <= TOKEN_USDC, "Invalid token type");

        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "Each amount must be > 0");
            require(recipients[i] != address(0), "Invalid recipient");
            require(recipients[i] != msg.sender, "Cannot split to yourself");
            total += amounts[i];
        }

        if (tokenType == TOKEN_PAS) {
            require(msg.value == total, "msg.value must equal total");
            for (uint256 i = 0; i < recipients.length; i++) {
                (bool ok, ) = payable(recipients[i]).call{value: amounts[i]}("");
                require(ok, "PAS split transfer failed");
            }
        } else {
            IERC20Precompile token = IERC20Precompile(_resolveToken(tokenType));
            require(
                token.allowance(msg.sender, address(this)) >= total,
                "Insufficient allowance for total"
            );
            for (uint256 i = 0; i < recipients.length; i++) {
                bool ok = token.transferFrom(msg.sender, recipients[i], amounts[i]);
                require(ok, "Token split failed");
            }
        }

        emit BillSplit(msg.sender, recipients, amounts, total, tokenType);
    }

    function sendCrossChainPayment(
        bytes calldata destination,
        bytes calldata message
    ) external payable {
        require(msg.value > 0, "PAS amount required in msg.value");
        require(destination.length > 0, "Empty destination");
        require(message.length > 0, "Empty XCM message");

        XCM.send(destination, message);

        emit CrossChainPaymentSent(msg.sender, msg.value, PEOPLE_CHAIN_PARA_ID);
    }

    function getUSDtBalance(address account) external view returns (uint256) {
        return IERC20Precompile(USDT_PRECOMPILE).balanceOf(account);
    }

    function getUSDCBalance(address account) external view returns (uint256) {
        return IERC20Precompile(USDC_PRECOMPILE).balanceOf(account);
    }

    function getUSDtAllowance(address owner) external view returns (uint256) {
        return IERC20Precompile(USDT_PRECOMPILE).allowance(owner, address(this));
    }

    function getUSDCAllowance(address owner) external view returns (uint256) {
        return IERC20Precompile(USDC_PRECOMPILE).allowance(owner, address(this));
    }

    receive() external payable {}
}
