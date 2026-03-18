"use client";

import { useState } from "react";
import { TOKEN_TYPES } from "@/utils/constants";
import {
  createGroup,
  addMember,
  addExpenseEqual,
  addExpenseCustom,
  settleDebt,
  approveGroupSplitToken,
  getMyGroups,
  getGroup,
  getExpense,
  getDebt,
  GroupInfo,
  ExpenseInfo,
} from "@/utils/groupContract";

type TxStatus = "idle" | "approving" | "pending" | "success" | "error";

export function useGroupSplit() {
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setStatus("idle");
    setTxHash(null);
    setError(null);
  }

  async function handleCreateGroup(name: string, members: string[]) {
    try {
      setStatus("pending");
      setError(null);
      const groupId = await createGroup(name, members);
      setStatus("success");
      return groupId;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create group");
      setStatus("error");
      return null;
    }
  }

  async function handleAddMember(groupId: bigint, member: string) {
    try {
      setStatus("pending");
      setError(null);
      const hash = await addMember(groupId, member);
      setTxHash(hash);
      setStatus("success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add member");
      setStatus("error");
    }
  }

  async function handleAddExpenseEqual(
    groupId: bigint,
    totalAmount: bigint,
    tokenType: 0 | 1 | 2,
    description: string
  ) {
    try {
      setStatus("pending");
      setError(null);
      const hash = await addExpenseEqual(
        groupId,
        totalAmount,
        tokenType,
        description
      );
      setTxHash(hash);
      setStatus("success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add expense");
      setStatus("error");
    }
  }

  async function handleAddExpenseCustom(
    groupId: bigint,
    totalAmount: bigint,
    tokenType: 0 | 1 | 2,
    description: string,
    participants: string[],
    shares: bigint[]
  ) {
    try {
      setStatus("pending");
      setError(null);
      const hash = await addExpenseCustom(
        groupId,
        totalAmount,
        tokenType,
        description,
        participants,
        shares
      );
      setTxHash(hash);
      setStatus("success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add expense");
      setStatus("error");
    }
  }

  async function handleSettleDebt(
    groupId: bigint,
    creditor: string,
    amount: bigint,
    tokenType: 0 | 1 | 2
  ) {
    try {
      setError(null);

      if (tokenType !== TOKEN_TYPES.PAS) {
        setStatus("approving");
        await approveGroupSplitToken(tokenType as 1 | 2, amount);
      }

      setStatus("pending");
      const hash = await settleDebt(groupId, creditor, amount, tokenType);
      setTxHash(hash);
      setStatus("success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Settlement failed");
      setStatus("error");
    }
  }

  async function fetchMyGroups(address: string): Promise<GroupInfo[]> {
    try {
      const ids = await getMyGroups(address);
      const groups = await Promise.all(ids.map((id) => getGroup(id)));
      return groups;
    } catch {
      return [];
    }
  }

  async function fetchExpenses(expenseIds: bigint[]): Promise<ExpenseInfo[]> {
    try {
      return await Promise.all(expenseIds.map((id) => getExpense(id)));
    } catch {
      return [];
    }
  }

  async function fetchDebt(
    groupId: bigint,
    debtor: string,
    creditor: string,
    tokenType: 0 | 1 | 2
  ): Promise<bigint> {
    try {
      return await getDebt(groupId, debtor, creditor, tokenType);
    } catch {
      return 0n;
    }
  }

  return {
    status,
    txHash,
    error,
    reset,
    handleCreateGroup,
    handleAddMember,
    handleAddExpenseEqual,
    handleAddExpenseCustom,
    handleSettleDebt,
    fetchMyGroups,
    fetchExpenses,
    fetchDebt,
  };
}
