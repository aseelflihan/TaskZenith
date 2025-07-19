import KnowledgeDetail from "../../../../components/knowledge-hub/KnowledgeDetail";

type Props = {
  params: { id: string };
};

export default function KnowledgeItemPage({ params }: Props) {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <KnowledgeDetail id={params.id} />
    </div>
  );
}