import KnowledgeDetail from "../../../../components/knowledge-hub/KnowledgeDetail";

export default function KnowledgeItemPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <KnowledgeDetail id={params.id} />
    </div>
  );
}