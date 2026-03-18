"use client";

import { BrowserProvider, Contract, type Eip1193Provider } from "ethers";
import {
  GROUP_SPLIT_ADDRESS,
  GROUP_SPLIT_ABI,
  ERC20_PRECOMPILE_ABI,
  TOKEN_ADDRESSES,
  TOKEN_TYPES,
} from "@/utils/constants";


export interface GroupInfo {
  id: bigint;
  name: string;
  creator: string;
  members: string[];
  expenseIds: bigint[];
}

export interface ExpenseInfo {
  id: bigint;
  groupId: bigint;
  paidBy: string;
  totalAmount: bigint;
  tokenType: number;
  description: string;
  participants: string[];
  shares: bigint[];
  timestamp: bigint;
}


function getInjectedProvider() {
  const provider = (window as Window & { ethereum?: Eip1193Provider }).ethereum;
  if (!provider) throw new Error("No wallet found");
  return provider;
}

async function getSigner() {
  const provider = new BrowserProvider(getInjectedProvider());
  return provider.getSigner();
}

async function getGroupContract() {
  const signer = await getSigner();
  return new Contract(GROUP_SPLIT_ADDRESS, GROUP_SPLIT_ABI, signer);
}

async function getERC20Contract(tokenAddress: string) {
  const signer = await getSigner();
  return new Contract(tokenAddress, ERC20_PRECOMPILE_ABI, signer);
}


export async function createGroup(
  name: string,
  members: string[]
): Promise<bigint> {
  const contract = await getGroupContract();
  const tx = await contract.createGroup(name, members);
  const receipt = await tx.wait();

  // Extract groupId from GroupCreated event
  const iface = contract.interface;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === "GroupCreated") {
        return parsed.args.groupId as bigint;
      }
    } catch {
      // skip unparseable logs
    }
  }
  throw new Error("GroupCreated event not found in receipt");
}

export async function addMember(
  groupId: bigint,
  member: string
): Promise<string> {
  const contract = await getGroupContract();
  const tx = await contract.addMember(groupId, member);
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}


export async function addExpenseEqual(
  groupId: bigint,
  totalAmount: bigint,
  tokenType: 0 | 1 | 2,
  description: string
): Promise<string> {
  const contract = await getGroupContract();
  const tx = await contract.addExpenseEqual(
    groupId,
    totalAmount,
    tokenType,
    description
  );
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}

export async function addExpenseCustom(
  groupId: bigint,
  totalAmount: bigint,
  tokenType: 0 | 1 | 2,
  description: string,
  participants: string[],
  shares: bigint[]
): Promise<string> {
  const contract = await getGroupContract();
  const tx = await contract.addExpenseCustom(
    groupId,
    totalAmount,
    tokenType,
    description,
    participants,
    shares
  );
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}



export async function approveGroupSplitToken(
  tokenType: 1 | 2,
  amount: bigint
): Promise<void> {
  const addr =
    tokenType === TOKEN_TYPES.USDT ? TOKEN_ADDRESSES.USDT : TOKEN_ADDRESSES.USDC;
  const token = await getERC20Contract(addr);
  const tx = await token.approve(GROUP_SPLIT_ADDRESS, amount);
  await tx.wait();
}

export async function settleDebt(
  groupId: bigint,
  creditor: string,
  amount: bigint,
  tokenType: 0 | 1 | 2
): Promise<string> {
  const contract = await getGroupContract();

  let tx;
  if (tokenType === TOKEN_TYPES.PAS) {
    tx = await contract.settleDebt(groupId, creditor, amount, tokenType, {
      value: amount,
    });
  } else {
    tx = await contract.settleDebt(groupId, creditor, amount, tokenType);
  }

  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}

// -----------------------------------------------------------------------
// Read functions
// -----------------------------------------------------------------------

export async function getMyGroups(address: string): Promise<bigint[]> {
  const signer = await getSigner();
  const contract = new Contract(GROUP_SPLIT_ADDRESS, GROUP_SPLIT_ABI, signer);
  const ids = await contract.getMyGroups(address);
  return ids as bigint[];
}

export async function getGroup(groupId: bigint): Promise<GroupInfo> {
  const signer = await getSigner();
  const contract = new Contract(GROUP_SPLIT_ADDRESS, GROUP_SPLIT_ABI, signer);
  const result = await contract.getGroup(groupId);
  return {
    id: result.id as bigint,
    name: result.name as string,
    creator: result.creator as string,
    members: result.members as string[],
    expenseIds: result.expenseIds as bigint[],
  };
}

export async function getExpense(expenseId: bigint): Promise<ExpenseInfo> {
  const signer = await getSigner();
  const contract = new Contract(GROUP_SPLIT_ADDRESS, GROUP_SPLIT_ABI, signer);
  const result = await contract.getExpense(expenseId);
  return {
    id: result.id as bigint,
    groupId: result.groupId as bigint,
    paidBy: result.paidBy as string,
    totalAmount: result.totalAmount as bigint,
    tokenType: Number(result.tokenType),
    description: result.description as string,
    participants: result.participants as string[],
    shares: result.shares as bigint[],
    timestamp: result.timestamp as bigint,
  };
}

export async function getDebt(
  groupId: bigint,
  debtor: string,
  creditor: string,
  tokenType: 0 | 1 | 2
): Promise<bigint> {
  const signer = await getSigner();
  const contract = new Contract(GROUP_SPLIT_ADDRESS, GROUP_SPLIT_ABI, signer);
  return (await contract.getDebt(groupId, debtor, creditor, tokenType)) as bigint;
}

export async function getBalance(
  groupId: bigint,
  member: string,
  tokenType: 0 | 1 | 2
): Promise<bigint> {
  const signer = await getSigner();
  const contract = new Contract(GROUP_SPLIT_ADDRESS, GROUP_SPLIT_ABI, signer);
  return (await contract.getBalance(groupId, member, tokenType)) as bigint;
}
