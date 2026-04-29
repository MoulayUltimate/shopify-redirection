import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AmksaSwitchify | Smart Shopify Store Rotator",
  description: "Revenue-aware multi-store traffic redirection and optimization platform.",
  icons: {
    icon: "/logo.jpg",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
