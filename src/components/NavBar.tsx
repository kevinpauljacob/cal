"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";

const NavBar: React.FC = () => {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const session = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };
  return (
    <nav className="bg-[#0C0D12] px-8 flex justify-between items-center  border-2 border-b border-white/5">
      <Link href="/">
        <Image src={"/assets/logo.svg"} alt="logo" width={88} height={76} />
      </Link>
      <div className="hidden sm:flex items-center space-x-4 ">
        {pathname !== "/create" && (
          <Link
            href={"/create"}
            className="bg-[#D9D9D9] bg-opacity-[7%] font-lilita  text-[#E2AB00] text-center px-6 leading-3 text-lg py-3"
          >
            Get Listed
          </Link>
        )}
        {session.status === "authenticated" ? (
          <div
            className="relative text-white/50 text-xs font-medium cursor-pointer"
            onClick={() => setShowWalletModal(!showWalletModal)}
          >
            <div className=" w-[8rem]  bg-[#D9D9D9]/5 hover:bg-[#D9D9D9] hover:bg-opacity-[8%]  cursor-pointer py-2.5 text-center">{`  @${session.data.user.username}`}</div>

            {showWalletModal && (
              <div className="absolute top-14 right-0 bg-[#16171C] flex flex-col items-center gap-2 rounded-[10px] w-[140px] p-1.5">
                <button
                  className="text-white/50 flex items-center justify-center gap-2 hover:text-white/75 hover:bg-white/15 font-medium bg-[#2A2B2F]  rounded-md transition-all duration-300 ease-in-out w-full p-2"
                  onClick={() => signOut()}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => signIn("twitter")}
            className="w-[4rem] py-3  flex gap-2 items-center justify-center  border border-[#1796f1] rounded-[10px] bg-[#D9D9D9]/5 hover:bg-[#D9D9D9] hover:bg-opacity-[8%]  cursor-pointer"
          >
            <Image
              src="/assets/twitter.svg"
              alt="Sign In"
              width={14}
              height={11}
            />
          </div>
        )}
        {/*   {connected ? (
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
          </div>
        ) : (
          <WalletConnectButton />
        )} */}
      </div>
      <div className="flex items-center gap-4 text-lexend text-xs text-medium sm:hidden">
        <div className="block md:hidden " onClick={toggleMenu}>
          <Image
            src={"/assets/nav-icon.png"}
            width={32}
            height={32}
            alt="nav cursor-pointer"
          />
        </div>
      </div>
      <div
        className={`nav-sidebar ${
          isOpen ? "max-h-screen" : "max-h-0"
        } flex flex-col items-center bg-[#0e1015] drop-shadow-sm transition-all duration-300 ease-in-out`}
      >
        <nav className=" nav-ul py-5 ">
          <button
            className=" font-lilita  text-[#E2AB00] text-center px-6 leading-3 text-lg py-4 w-full "
            onClick={() => {
              toggleMenu();
              window.location.href = "/create";
            }}
          >
            Get Listed
          </button>
          {session.status === "authenticated" ? (
            <div
              className=" text-white/50 text-xs font-medium cursor-pointer w-full flex flex-col items-center justify-center"
              onClick={() => setShowWalletModal(!showWalletModal)}
            >
              <div className=" w-[8rem]   cursor-pointer py-3 text-center flex items-end justify-center gap-2">
                <img
                  src="/assets/twitter.svg"
                  alt="Sign In"
                  className="w-3 h-3"
                />
                {`@${session.data.user.username}`}
              </div>

              {showWalletModal && (
                <div className=" flex justify-center items-center gap-2   z-20 w-full mt-4">
                  <button
                    className="flex items-center gap-2 text-white/50 hover:text-white/75rounded-md transition-all duration-300 ease-in-out  "
                    onClick={() => {
                      toggleMenu();
                      signOut();
                    }}
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => {
                toggleMenu();
                signIn("twitter");
              }}
              className=" py-3  flex gap-2 items-center justify-center    cursor-pointer text-white/90"
            >
              <img
                src="/assets/twitter.svg"
                alt="Sign In"
                className="w-3 h-3"
              />{" "}
              Connect Twitter
            </div>
          )}
        </nav>
      </div>
    </nav>
  );
};

export default NavBar;
