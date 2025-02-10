"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Copy } from "lucide-react";
import { SiSolana } from "react-icons/si";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  connection,
  copyToClipboard,
  fetchSolBalance,
  truncateAddress,
} from "@/utils/helper";
import WalletConnectButton from "./WalletConnectionButton";

const NavBar: React.FC = () => {
  const { publicKey, connected, disconnect } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    if (!publicKey) return;

    fetchSolBalance(connection, publicKey).then((b) =>
      setBalance(b.toFixed(2))
    );
  }, [publicKey]);

  return (
    <nav className="bg-[#0C0D12] px-8 flex justify-between items-center  border-2 border-b border-white/5">
      <Link href="/">
        <Image src={"/assets/logo.svg"} alt="logo" width={88} height={76} />
      </Link>
      <div className="flex items-center space-x-4">
        <Link
          href={"/create"}
          className="bg-[#D9D9D9] bg-opacity-[7%] font-lilita  text-[#E2AB00] text-center px-6 leading-3 text-lg py-3"
        >
          Get Listed
        </Link>
        {connected ? (
          <div
            className="relative bg-[#192634] text-white flex items-center text-sm rounded-[10px] cursor-pointer font-chakra"
            onClick={() => setShowWalletModal(!showWalletModal)}
            // onMouseEnter={() => setShowWalletModal(true)}
          >
            <div className="bg-white/5 px-3 py-2.5 rounded-l-[10px]">
              <Image
                width={15}
                height={15}
                src="/assets/wallet.png"
                alt="wallet"
              />
            </div>
            <div className="flex items-center justify-center gap-1.5 px-2">
              <SiSolana width={14} height={11} className="text-[#cccccc]" />
              <span className="font-medium font-chakra">{balance}</span>
            </div>
            {showWalletModal && (
              <div className="absolute top-14 right-0 bg-[#16171C] flex flex-col items-center gap-2 rounded-[10px] w-[140px] p-1.5">
                <div className="flex items-center gap-2 bg-[#2A2B2F] rounded-md w-full p-2">
                  <div>
                    <div className="text-white/50 text-[10px]">
                      Wallet Address
                    </div>
                    <div>{truncateAddress(publicKey?.toBase58() ?? "")}</div>
                  </div>
                  <div
                    className="rounded-md hover:bg-white/15 transition-all duration-300 ease-in-out p-1 "
                    onClick={() => copyToClipboard(publicKey?.toBase58() ?? "")}
                  >
                    <Copy size={16} />
                  </div>
                </div>
                <button
                  className="text-white/50 hover:text-white/75 hover:bg-white/15 font-medium bg-[#2A2B2F]  rounded-md transition-all duration-300 ease-in-out w-full p-2"
                  onClick={disconnect}
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        ) : (
          <WalletConnectButton />
        )}
      </div>
    </nav>
  );
};

export default NavBar;
