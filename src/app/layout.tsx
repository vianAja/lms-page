import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VN-Labs",
  description: "Interactive DevOps training platform with guided labs and live SSH terminals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
