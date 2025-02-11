import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Lexend,
  Akshar,
  Roboto,
  Inter,
  IBM_Plex_Mono,
  Chakra_Petch,
  Alata,
  Righteous,
  Lilita_One,
  Itim,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import SessionWrapper from "@/components/SessionWrapper";
import AppWalletProvider from "@/components/WalletProvider";
import NavBar from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});

const lilita = Lilita_One({
  subsets: ["latin"],
  variable: "--font-lilita",
  weight: ["400"],
});

const itim = Itim({
  subsets: ["latin"],
  variable: "--font-itim",
  weight: ["400"],
});
const akshar = Akshar({
  subsets: ["latin"],
  variable: "--font-akshar",
  weight: ["400", "700"],
});

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["400", "700"],
});

const chakra = Chakra_Petch({
  subsets: ["latin"],
  variable: "--font-chakra",
  weight: ["400", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const ibm = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-mono",
  weight: ["400", "600", "700"],
});

const alata = Alata({
  subsets: ["latin"],
  variable: "--font-alata",
  weight: ["400"],
});
const righteous = Righteous({
  subsets: ["latin"],
  variable: "--font-righteous",
  weight: ["400"],
});
export const metadata: Metadata = {
  title: "xBanana - Your Token Launch Radar!",
  description:
    "Discover and track upcoming token launches. Real-time mindshare analytics for crypto projects making waves on X (Twitter).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`scroller ${lexend.variable} ${lilita.variable} ${itim.variable} ${akshar.variable} ${righteous.variable} ${roboto.variable} ${inter.variable} ${ibm.variable} ${chakra.variable} ${alata.variable}`}
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased `}
      >
        <AppWalletProvider>
          <SessionWrapper>
            <Toaster position="bottom-right" reverseOrder={false} />
            <NavBar />
            {children}
          </SessionWrapper>
        </AppWalletProvider>
      </body>
    </html>
  );
}
