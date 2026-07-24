import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/header";
import Footer from "./components/footer";
import DisableCopy from "./components/DisableCopy";

export const metadata: Metadata = {
  title: "2212 – Sharpen Your Mind, Achieve Your Best",
  description:
    "Mental calisthenics for a sharper mind, stronger memory, and a brighter future. Practice daily, download worksheets, and join competitions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <DisableCopy />
        <Header />
        <main style={{ paddingTop: "60px" }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
