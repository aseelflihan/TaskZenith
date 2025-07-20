"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { List, Grid, Tags } from "lucide-react";
import { useKnowledgeHubStore } from "./useKnowledgeHubStore";

interface SearchBarWithFiltersProps {
    view: 'grid' | 'list';
    setView: (view: 'grid' | 'list') => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export default function SearchBarWithFilters({ view, setView, searchTerm, setSearchTerm }: SearchBarWithFiltersProps) {
  const { allTags, filterTags, toggleFilterTag } = useKnowledgeHubStore();

  return (
    <div className="flex gap-4 mb-6">
      <Input
        placeholder="Search in your hub..."
        className="flex-grow"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Tags className="mr-2 h-4 w-4" />
            Tags
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {allTags.map(tag => (
            <DropdownMenuCheckboxItem
              key={tag}
              checked={filterTags.includes(tag)}
              onSelect={(e) => {
                e.preventDefault();
                toggleFilterTag(tag);
              }}
            >
              {tag}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex items-center gap-2">
        <Button variant={view === 'grid' ? 'secondary' : 'outline'} size="icon" onClick={() => setView('grid')}>
            <Grid className="h-4 w-4" />
        </Button>
        <Button variant={view === 'list' ? 'secondary' : 'outline'} size="icon" onClick={() => setView('list')}>
            <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}