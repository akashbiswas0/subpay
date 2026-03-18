import { defineChain } from "viem";

export const passetHub = defineChain({
  id: 420420417,
  name: "Polkadot Hub TestNet",
  nativeCurrency: { name: "PAS", symbol: "PAS", decimals: 10 },
  rpcUrls: {
    default: {
      http: ["https://eth-rpc-testnet.polkadot.io/"]
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://blockscout-passet-hub.parity-testnet.parity.io",
    },
  },
  testnet: true,
});

export const PAYMENT_ROUTER_ADDRESS = (process.env
  .NEXT_PUBLIC_PAYMENT_ROUTER_ADDRESS ??
  "0xCc05B4aD5D96abb333c16CA7f4345DaeF7a62F4F") as `0x${string}`;

export const TOKEN_ADDRESSES = {
  USDT: "0x000007C000000000000000000000000001200000" as `0x${string}`,
  USDC: "0x0000053900000000000000000000000001200000" as `0x${string}`,
} as const;

export const TOKEN_TYPES = {
  PAS: 0,
  USDT: 1,
  USDC: 2,
} as const;

export const PEOPLE_CHAIN_PARA_ID = 1004;
export const PEOPLE_CHAIN_WS = "wss://people-paseo.rpc.amforc.com";

export const PAYMENT_ROUTER_ABI = [
  {
    name: "sendPayment",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "tokenType", type: "uint8" },
    ],
    outputs: [],
  },
  {
    name: "splitBill",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "recipients", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
      { name: "tokenType", type: "uint8" },
    ],
    outputs: [],
  },
  {
    name: "sendCrossChainPayment",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "destination", type: "bytes" },
      { name: "message", type: "bytes" },
    ],
    outputs: [],
  },
  {
    name: "getUSDtBalance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getUSDCBalance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getUSDtAllowance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getUSDCAllowance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "PaymentSent",
    type: "event",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "tokenType", type: "uint8", indexed: false },
    ],
  },
  {
    name: "BillSplit",
    type: "event",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "recipients", type: "address[]", indexed: false },
      { name: "amounts", type: "uint256[]", indexed: false },
      { name: "totalAmount", type: "uint256", indexed: false },
      { name: "tokenType", type: "uint8", indexed: false },
    ],
  },
  {
    name: "CrossChainPaymentSent",
    type: "event",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "paraId", type: "uint32", indexed: false },
    ],
  },
] as const;

// GroupSplit contract — deployed address after running deployGroupSplit.js
export const GROUP_SPLIT_ADDRESS =
  "0x84a87Cd93F3A5C81Ba3179Aeff6ACC9e994bdA1c" as `0x${string}`;

// GroupSplit ABI
export const GROUP_SPLIT_ABI = [
  {
    name: "createGroup",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "members", type: "address[]" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "addMember",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "groupId", type: "uint256" },
      { name: "member", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "addExpenseEqual",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "groupId", type: "uint256" },
      { name: "totalAmount", type: "uint256" },
      { name: "tokenType", type: "uint8" },
      { name: "description", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "addExpenseCustom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "groupId", type: "uint256" },
      { name: "totalAmount", type: "uint256" },
      { name: "tokenType", type: "uint8" },
      { name: "description", type: "string" },
      { name: "participants", type: "address[]" },
      { name: "shares", type: "uint256[]" },
    ],
    outputs: [],
  },
  {
    name: "settleDebt",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "groupId", type: "uint256" },
      { name: "creditor", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "tokenType", type: "uint8" },
    ],
    outputs: [],
  },
  {
    name: "getGroup",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "groupId", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "name", type: "string" },
      { name: "creator", type: "address" },
      { name: "members", type: "address[]" },
      { name: "expenseIds", type: "uint256[]" },
    ],
  },
  {
    name: "getGroupMembers",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "groupId", type: "uint256" }],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    name: "getGroupExpenses",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "groupId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    name: "getExpense",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "expenseId", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "groupId", type: "uint256" },
      { name: "paidBy", type: "address" },
      { name: "totalAmount", type: "uint256" },
      { name: "tokenType", type: "uint8" },
      { name: "description", type: "string" },
      { name: "participants", type: "address[]" },
      { name: "shares", type: "uint256[]" },
      { name: "timestamp", type: "uint256" },
    ],
  },
  {
    name: "getDebt",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "groupId", type: "uint256" },
      { name: "debtor", type: "address" },
      { name: "creditor", type: "address" },
      { name: "tokenType", type: "uint8" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getBalance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "groupId", type: "uint256" },
      { name: "member", type: "address" },
      { name: "tokenType", type: "uint8" },
    ],
    outputs: [{ name: "", type: "int256" }],
  },
  {
    name: "getMyGroups",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "member", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    name: "groupCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "expenseCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "GroupCreated",
    type: "event",
    inputs: [
      { name: "groupId", type: "uint256", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "creator", type: "address", indexed: true },
    ],
  },
  {
    name: "MemberAdded",
    type: "event",
    inputs: [
      { name: "groupId", type: "uint256", indexed: true },
      { name: "member", type: "address", indexed: true },
    ],
  },
  {
    name: "ExpenseAdded",
    type: "event",
    inputs: [
      { name: "expenseId", type: "uint256", indexed: true },
      { name: "groupId", type: "uint256", indexed: true },
      { name: "paidBy", type: "address", indexed: true },
      { name: "totalAmount", type: "uint256", indexed: false },
      { name: "tokenType", type: "uint8", indexed: false },
      { name: "description", type: "string", indexed: false },
    ],
  },
  {
    name: "DebtSettled",
    type: "event",
    inputs: [
      { name: "groupId", type: "uint256", indexed: true },
      { name: "debtor", type: "address", indexed: true },
      { name: "creditor", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "tokenType", type: "uint8", indexed: false },
    ],
  },
] as const;

export const ERC20_PRECOMPILE_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
