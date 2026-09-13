import Link from "next/link";
import { WalletButton } from "@/components/wallet-button";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Attestia home"><span className="brand-mark" aria-hidden="true">A</span>Attestia</Link>
      <nav aria-label="Primary navigation">
        <Link href="/contributions/new">Publish</Link>
        <Link href="/verify">Verify</Link>
        <Link href="/profile">Profile</Link>
      </nav>
      <WalletButton />
    </header>
    <main id="main">{children}</main>
    <footer className="site-footer"><span>Public evidence on Monad Testnet</span><span className="data">Chain 10143</span></footer>
  </>;
}
