// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC20Precompile.sol";

contract GroupSplit {

    address constant USDT_PRECOMPILE =
        address(0x000007c000000000000000000000000001200000);

    address constant USDC_PRECOMPILE =
        address(0x0000053900000000000000000000000001200000);

    uint8 constant TOKEN_PAS  = 0;
    uint8 constant TOKEN_USDT = 1;
    uint8 constant TOKEN_USDC = 2;

    struct Group {
        uint256 id;
        string name;
        address creator;
        address[] members;
        uint256[] expenseIds;
        bool exists;
    }

    struct Expense {
        uint256 id;
        uint256 groupId;
        address paidBy;
        uint256 totalAmount;
        uint8 tokenType;
        string description;
        address[] participants;
        uint256[] shares;
        uint256 timestamp;
    }

    mapping(uint256 => mapping(address => mapping(address => mapping(uint8 => uint256)))) public debts;
    mapping(uint256 => mapping(address => mapping(uint8 => int256))) public balances;
    mapping(uint256 => Group) private groups;
    mapping(uint256 => Expense) private expenses;

    uint256 public groupCount;
    uint256 public expenseCount;

    event GroupCreated(uint256 indexed groupId, string name, address indexed creator);
    event MemberAdded(uint256 indexed groupId, address indexed member);
    event ExpenseAdded(uint256 indexed expenseId, uint256 indexed groupId, address indexed paidBy, uint256 totalAmount, uint8 tokenType, string description);
    event DebtSettled(uint256 indexed groupId, address indexed debtor, address indexed creditor, uint256 amount, uint8 tokenType);

    modifier groupExists(uint256 groupId) {
        require(groups[groupId].exists, "Group does not exist");
        _;
    }

    modifier onlyMember(uint256 groupId) {
        require(groups[groupId].exists, "Group does not exist");
        require(_isMember(groupId, msg.sender), "Not a group member");
        _;
    }

    function createGroup(
        string calldata name,
        address[] calldata members
    ) external returns (uint256) {
        require(bytes(name).length > 0, "Name required");
        require(members.length <= 19, "Max 20 members including creator");

        uint256 groupId = ++groupCount;

        groups[groupId].id = groupId;
        groups[groupId].name = name;
        groups[groupId].creator = msg.sender;
        groups[groupId].exists = true;
        groups[groupId].members.push(msg.sender);

        for (uint256 i = 0; i < members.length; i++) {
            require(members[i] != address(0), "Invalid member address");
            require(members[i] != msg.sender, "Creator already added");
            require(!_isMember(groupId, members[i]), "Duplicate member");
            groups[groupId].members.push(members[i]);
            emit MemberAdded(groupId, members[i]);
        }

        emit GroupCreated(groupId, name, msg.sender);
        return groupId;
    }

    function addMember(uint256 groupId, address member)
        external
        onlyMember(groupId)
    {
        require(member != address(0), "Invalid address");
        require(!_isMember(groupId, member), "Already a member");
        require(groups[groupId].members.length < 20, "Max 20 members");

        groups[groupId].members.push(member);
        emit MemberAdded(groupId, member);
    }

    function addExpenseEqual(
        uint256 groupId,
        uint256 totalAmount,
        uint8 tokenType,
        string calldata description
    ) external onlyMember(groupId) {
        require(totalAmount > 0, "Amount must be > 0");
        require(tokenType <= TOKEN_USDC, "Invalid token type");
        require(bytes(description).length > 0, "Description required");

        address[] memory members = groups[groupId].members;
        uint256 memberCount = members.length;

        uint256 sharePerMember = totalAmount / memberCount;
        uint256 remainder = totalAmount % memberCount;

        uint256[] memory shares = new uint256[](memberCount);
        for (uint256 i = 0; i < memberCount; i++) {
            shares[i] = (i == 0) ? sharePerMember + remainder : sharePerMember;
        }

        _recordExpense(groupId, totalAmount, tokenType, description, members, shares);
    }

    function addExpenseCustom(
        uint256 groupId,
        uint256 totalAmount,
        uint8 tokenType,
        string calldata description,
        address[] calldata participants,
        uint256[] calldata shares
    ) external onlyMember(groupId) {
        require(totalAmount > 0, "Amount must be > 0");
        require(tokenType <= TOKEN_USDC, "Invalid token type");
        require(bytes(description).length > 0, "Description required");
        require(participants.length >= 2, "Need at least 2 participants");
        require(participants.length == shares.length, "Length mismatch");
        require(participants.length <= 20, "Too many participants");

        uint256 sharesTotal = 0;
        for (uint256 i = 0; i < participants.length; i++) {
            require(_isMember(groupId, participants[i]), "Participant not in group");
            require(shares[i] > 0, "Each share must be > 0");
            sharesTotal += shares[i];
        }
        require(sharesTotal == totalAmount, "Shares must sum to totalAmount");

        _recordExpense(groupId, totalAmount, tokenType, description, participants, shares);
    }

    function settleDebt(
        uint256 groupId,
        address creditor,
        uint256 amount,
        uint8 tokenType
    ) external payable onlyMember(groupId) {
        require(creditor != address(0), "Invalid creditor");
        require(creditor != msg.sender, "Cannot settle with yourself");
        require(amount > 0, "Amount must be > 0");
        require(tokenType <= TOKEN_USDC, "Invalid token type");
        require(_isMember(groupId, creditor), "Creditor not in group");

        uint256 owed = debts[groupId][msg.sender][creditor][tokenType];
        require(owed > 0, "No debt to settle");
        require(amount <= owed, "Amount exceeds debt");

        if (tokenType == TOKEN_PAS) {
            require(msg.value == amount, "msg.value must equal amount");
            (bool ok, ) = payable(creditor).call{value: amount}("");
            require(ok, "PAS settlement failed");
        } else {
            address tokenAddr = tokenType == TOKEN_USDT ? USDT_PRECOMPILE : USDC_PRECOMPILE;
            IERC20Precompile token = IERC20Precompile(tokenAddr);
            require(token.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance: approve GroupSplit contract first");
            bool ok = token.transferFrom(msg.sender, creditor, amount);
            require(ok, "Token settlement failed");
        }

        debts[groupId][msg.sender][creditor][tokenType] -= amount;
        balances[groupId][msg.sender][tokenType] += int256(amount);
        balances[groupId][creditor][tokenType] -= int256(amount);

        emit DebtSettled(groupId, msg.sender, creditor, amount, tokenType);
    }

    function getGroup(uint256 groupId)
        external
        view
        groupExists(groupId)
        returns (
            uint256 id,
            string memory name,
            address creator,
            address[] memory members,
            uint256[] memory expenseIds
        )
    {
        Group storage g = groups[groupId];
        return (g.id, g.name, g.creator, g.members, g.expenseIds);
    }

    function getGroupMembers(uint256 groupId)
        external
        view
        groupExists(groupId)
        returns (address[] memory)
    {
        return groups[groupId].members;
    }

    function getGroupExpenses(uint256 groupId)
        external
        view
        groupExists(groupId)
        returns (uint256[] memory)
    {
        return groups[groupId].expenseIds;
    }

    function getExpense(uint256 expenseId)
        external
        view
        returns (
            uint256 id,
            uint256 groupId,
            address paidBy,
            uint256 totalAmount,
            uint8 tokenType,
            string memory description,
            address[] memory participants,
            uint256[] memory shares,
            uint256 timestamp
        )
    {
        Expense storage e = expenses[expenseId];
        require(e.id != 0, "Expense does not exist");
        return (e.id, e.groupId, e.paidBy, e.totalAmount, e.tokenType, e.description, e.participants, e.shares, e.timestamp);
    }

    function getDebt(
        uint256 groupId,
        address debtor,
        address creditor,
        uint8 tokenType
    ) external view returns (uint256) {
        return debts[groupId][debtor][creditor][tokenType];
    }

    function getBalance(
        uint256 groupId,
        address member,
        uint8 tokenType
    ) external view returns (int256) {
        return balances[groupId][member][tokenType];
    }

    function getMyGroups(address member)
        external
        view
        returns (uint256[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 1; i <= groupCount; i++) {
            if (groups[i].exists && _isMember(i, member)) count++;
        }
        uint256[] memory result = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= groupCount; i++) {
            if (groups[i].exists && _isMember(i, member)) {
                result[idx++] = i;
            }
        }
        return result;
    }

    function _isMember(uint256 groupId, address addr)
        internal
        view
        returns (bool)
    {
        address[] storage members = groups[groupId].members;
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == addr) return true;
        }
        return false;
    }

    function _recordExpense(
        uint256 groupId,
        uint256 totalAmount,
        uint8 tokenType,
        string memory description,
        address[] memory participants,
        uint256[] memory shares
    ) internal {
        uint256 expenseId = ++expenseCount;

        expenses[expenseId] = Expense({
            id: expenseId,
            groupId: groupId,
            paidBy: msg.sender,
            totalAmount: totalAmount,
            tokenType: tokenType,
            description: description,
            participants: participants,
            shares: shares,
            timestamp: block.timestamp
        });

        groups[groupId].expenseIds.push(expenseId);

        for (uint256 i = 0; i < participants.length; i++) {
            if (participants[i] != msg.sender) {
                debts[groupId][participants[i]][msg.sender][tokenType] += shares[i];
                balances[groupId][participants[i]][tokenType] -= int256(shares[i]);
                balances[groupId][msg.sender][tokenType] += int256(shares[i]);
            }
        }

        emit ExpenseAdded(expenseId, groupId, msg.sender, totalAmount, tokenType, description);
    }

    receive() external payable {}
}