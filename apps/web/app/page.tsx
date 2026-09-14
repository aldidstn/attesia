import Link from "next/link";
import { ArrowRight, CheckCircle, Fingerprint, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

export default function HomePage() {
  return <div className="page">
    <section className="hero">
      <p className="eyebrow">Evidence-backed contribution records</p>
      <h1 className="display">Make work<br /><span className="data">verifiable.</span></h1>
      <p className="lede">Publish a tamper-evident record, collect independent claims, and let anyone verify the evidence trail on Monad Testnet.</p>
      <div className="cluster hero-actions"><Link className="pill pill-primary" href="/contributions/new">Publish contribution <ArrowRight /></Link><Link className="pill pill-secondary" href="/verify">Verify a record</Link></div>
    </section>
    <section className="feature-grid" aria-label="How Attestia works">
      <article className="panel feature"><Fingerprint size={28} aria-hidden="true" /><p className="eyebrow">01 · Publish</p><h2>Bind work to evidence</h2><p>Artifact SHA-256 and canonical metadata digest anchor the public record.</p></article>
      <article className="panel feature"><CheckCircle size={28} aria-hidden="true" /><p className="eyebrow">02 · Review</p><h2>Collect scoped claims</h2><p>Reviewers attest to completion, authorship, quality, usage, or provenance.</p></article>
      <article className="panel feature"><ShieldCheck size={28} aria-hidden="true" /><p className="eyebrow">03 · Verify</p><h2>Inspect every layer</h2><p>Compare files, metadata, transaction state, and indexed projections.</p></article>
    </section>
    <section className="panel status-panel"><div><p className="eyebrow">Network status</p><h2 className="section-title">Monad Testnet</h2></div><div className="status-stats"><span><b className="data">10143</b> Chain</span><span><b>3</b> Registries</span><span><b className="mint">Public</b> Evidence</span></div></section>
  </div>;
}
