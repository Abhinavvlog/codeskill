"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import ContestForm from "../../_components/ContestForm";

export default function EditContestPage() {
  const { id } = useParams<{ id?: string }>();
  if (!id) return <div className="p-8 space-y-4"><p role="alert">A contest ID is required.</p><Link href="/admin/contests">Back to Contests</Link></div>;
  return <ContestForm key={id} contestId={id} />;
}
