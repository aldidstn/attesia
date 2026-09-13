import { Verifier } from "@/components/verifier";
export const metadata = { title: "Verify" };
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ type?: string; id?: string }> }) { const query = await searchParams; return <div className="page"><Verifier initialType={query.type} initialId={query.id} /></div>; }
