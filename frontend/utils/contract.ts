"use client";

import {
  BrowserProvider,
  Contract,
  type Eip1193Provider,
} from "ethers";
import {
  ERC20_PRECOMPILE_ABI,
  PAYMENT_ROUTER_ABI,
  PAYMENT_ROUTER_ADDRESS,
  TOKEN_ADDRESSES,
  TOKEN_TYPES,
} from "@/utils/constants";


function getInjectedProvider() {
  const provider = (window as Window & { ethereum?: Eip1193Provider }).ethereum;
  if (!provider) throw new Error("No wallet found");
  return provider;
}

function ensureRouterAddressConfigured() {
  if (/^0x0{40}$/i.test(PAYMENT_ROUTER_ADDRESS)) {
    throw new Error(
      "Set NEXT_PUBLIC_PAYMENT_ROUTER_ADDRESS in frontend/.env.local before sending payments"
    );
  }
}

async function getSigner() {
  const provider = new BrowserProvider(getInjectedProvider());
  return provider.getSigner();
}

async function getContract() {
  ensureRouterAddressConfigured();
  const signer = await getSigner();
  return new Contract(PAYMENT_ROUTER_ADDRESS, PAYMENT_ROUTER_ABI, signer);
}

async function getERC20Contract(tokenAddress: string) {
  const signer = await getSigner();
  return new Contract(tokenAddress, ERC20_PRECOMPILE_ABI, signer);
}

export async function approveToken(tokenType: 1 | 2, amount: bigint) {
  const address =
    tokenType === TOKEN_TYPES.USDT ? TOKEN_ADDRESSES.USDT : TOKEN_ADDRESSES.USDC;
  const token = await getERC20Contract(address);
  const tx = await token.approve(PAYMENT_ROUTER_ADDRESS, amount);
  await tx.wait();
}

export async function sendPAS(recipient: string, amountPlanck: bigint) {
  const contract = await getContract();
  const tx = await contract.sendPayment(recipient, 0n, TOKEN_TYPES.PAS, {
    value: amountPlanck,
  });
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}

export async function sendToken(
  recipient: string,
  amount: bigint,
  tokenType: 1 | 2
) {
  const contract = await getContract();
  const tx = await contract.sendPayment(recipient, amount, tokenType);
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}

// Direct transfers — used by PolkaLinks (/pay page) to send straight to recipient
export async function directSendPAS(recipient: string, amountPlanck: bigint) {
  const signer = await getSigner();
  const tx = await signer.sendTransaction({ to: recipient, value: amountPlanck });
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}

export async function directSendToken(
  recipient: string,
  amount: bigint,
  tokenType: 1 | 2
) {
  const tokenAddress =
    tokenType === TOKEN_TYPES.USDT ? TOKEN_ADDRESSES.USDT : TOKEN_ADDRESSES.USDC;
  const token = await getERC20Contract(tokenAddress);
  const tx = await token.transfer(recipient, amount);
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}

export async function splitPAS(recipients: string[], amounts: bigint[]) {
  const total = amounts.reduce((sum, current) => sum + current, 0n);
  const contract = await getContract();
  const tx = await contract.splitBill(recipients, amounts, TOKEN_TYPES.PAS, {
    value: total,
  });
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}

export async function splitToken(
  recipients: string[],
  amounts: bigint[],
  tokenType: 1 | 2
) {
  const contract = await getContract();
  const tx = await contract.splitBill(recipients, amounts, tokenType);
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}

export async function sendCrossChain(
  destinationBytes: Uint8Array,
  messageBytes: Uint8Array,
  amountPlanck: bigint
): Promise<string> {
  const contract = await getContract();
  const tx = await contract.sendCrossChainPayment(
    destinationBytes,
    messageBytes,
    { value: amountPlanck }
  );
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}