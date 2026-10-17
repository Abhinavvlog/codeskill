import PracticeProblemEditor from "@/components/admin/PracticeProblemEditor";

export default async function EditProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PracticeProblemEditor key={id} problemId={id} />;
}
