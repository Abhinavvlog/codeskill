"use client";
import ProblemWorkspace from "@/components/problems/ProblemWorkspace";

export default function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  return <ProblemWorkspace params={params} />;
}
