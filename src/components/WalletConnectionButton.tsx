"use client";
import dynamic from "next/dynamic";

// Dynamically import the WalletConnectButton with SSR disabled
const WalletConnectButtons = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

const WalletConnectButton = () => {
  return (
    <div className="custom-wallet-button">
      <WalletConnectButtons />
    </div>
  );
};

export default WalletConnectButton;
