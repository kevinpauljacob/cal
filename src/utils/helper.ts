import { Connection, PublicKey } from "@solana/web3.js";
import { toast } from "react-hot-toast";

export async function delay(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1) + min);
  // console.log(`Waiting ${ms / 1000} seconds before next request...`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export function truncateAddress(str: string): string {
  if (str.length <= 8) {
    return str;
  }

  const start = str.slice(0, 4);
  const end = str.slice(-4);

  return `${start}...${end}`;
}

// export const connection = new Connection(
//   process.env.NEXT_PUBLIC_RPC!,
//   "confirmed"
// );

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Wallet address copied!");
  } catch (error) {
    toast.error("Failed to copy address");
  }
};

export const fetchSolBalance = async (
  connection: Connection,
  wallet: PublicKey
): Promise<number> => {
  try {
    const balance = await connection.getBalance(wallet);
    return balance / Math.pow(10, 9); // Convert lamports to SOL
  } catch (error) {
    // console.error("Error fetching SOL balance:", error);
    throw error;
  }
};
