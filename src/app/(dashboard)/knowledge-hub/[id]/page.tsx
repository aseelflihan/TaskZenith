import KnowledgeDetail from "../../../../components/knowledge-hub/KnowledgeDetail";

export default async function KnowledgeItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <KnowledgeDetail id={id} />
    </div>
  );
}