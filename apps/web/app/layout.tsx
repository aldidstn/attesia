import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: { default: "Attestia", template: "%s · Attestia" },
  description: "Evidence-backed contribution records on Monad.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
