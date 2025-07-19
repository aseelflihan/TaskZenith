import KnowledgeDetail from "../../../../components/knowledge-hub/KnowledgeDetail";

type Props = {
  params?: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};
export default function KnowledgeItemPage({ params }: Props) {
  if (!params?.id) {
    return <div>Error: ID not found</div>;
  }
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <KnowledgeDetail id={params.id} />
    </div>
  );
}