import "./globals.scss";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alohawaii API",
  description: "Tour platform API with authentication",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
