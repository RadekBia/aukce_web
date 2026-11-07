import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Číselníky",
  description: "Jaké zboží je na jakém umístění a na jakém účtu.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
