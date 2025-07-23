import KnowledgeDetail from "../../../../components/knowledge-hub/KnowledgeDetail";

interface PageProps {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function KnowledgeItemPage({ params }: PageProps) {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <KnowledgeDetail id={params.id} />
    </div>
  );
}