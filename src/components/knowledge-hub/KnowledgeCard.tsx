import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { KnowledgeItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, FileText } from "lucide-react";
import { useKnowledgeHubStore } from "./useKnowledgeHubStore";

interface KnowledgeCardProps {
  item: KnowledgeItem;
  isSelected: boolean;
  onSelect: () => void;
}

export function KnowledgeCard({ item, isSelected, onSelect }: KnowledgeCardProps) {
  const isLink = item.originalContent && (item.originalContent.startsWith('http') || item.originalContent.startsWith('www'));
  const { fetchItems, toggleFilterTag, filterTags } = useKnowledgeHubStore();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/knowledge/${item.id}`, { method: 'DELETE' });
      fetchItems();
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer relative group flex flex-col h-full",
        "bg-transparent border border-border/20 transition-all duration-300",
        "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10",
        isSelected && "border-primary shadow-lg shadow-primary/10"
      )}
      onClick={onSelect}
    >
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 z-20 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      
      <div className="flex flex-col flex-grow">
        <CardHeader className="p-0 relative">
          <Image
            src={item.thumbnail || "https://source.unsplash.com/400x200/?abstract,pattern"}
            alt={item.title}
            width={400}
            height={200}
            className="object-cover w-full h-32"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </CardHeader>

        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-base font-bold mb-2 line-clamp-2">{item.title}</CardTitle>
          <p className="text-xs text-muted-foreground line-clamp-2">{item.tldr}</p>
        </CardContent>

        <CardFooter className="p-4 flex justify-between items-center">
          <div className="flex gap-1 flex-wrap">
            {item.tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant={filterTags.includes(tag) ? "default" : "secondary"}
                className="cursor-pointer hover:bg-primary/80 text-xs"
                onClick={(e) => {
                    e.stopPropagation();
                    toggleFilterTag(tag);
                }}
              >
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {isLink && (
              <Link href={item.originalContent} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            )}
            {!isLink && (
                <FileText className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground">{item.source}</span>
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}