import { create } from 'zustand';
import { KnowledgeItem, KnowledgeHubState } from '@/types/custom';

export const useKnowledgeHubStore = create<KnowledgeHubState>((set: any, get: any) => ({
  items: [],
  selectedItem: null,
  searchTerm: '',
  filterTags: [],
  allTags: [],
  setItems: (items: KnowledgeItem[]) => {
    const allTags = [...new Set(items.flatMap((item: KnowledgeItem) => item.tags))];
    set({ items, allTags });
  },
  addItem: (item: KnowledgeItem) => set((state: KnowledgeHubState) => {
    const newItems = [item, ...state.items];
    const allTags = [...new Set(newItems.flatMap((i: KnowledgeItem) => i.tags))];
    return { items: newItems, allTags };
  }),
  setSelectedItem: (item: KnowledgeItem | null) => set({ selectedItem: item }),
  setSearchTerm: (term: string) => set({ searchTerm: term }),
  toggleFilterTag: (tag: string) =>
    set((state: KnowledgeHubState) => {
      const newFilterTags = state.filterTags.includes(tag)
        ? state.filterTags.filter((t: string) => t !== tag)
        : [...state.filterTags, tag];
      return { filterTags: newFilterTags };
    }),
  clearFilters: () => set({ filterTags: [], searchTerm: '' }),
  fetchItems: async () => {
    try {
      const response = await fetch('/api/knowledge');
      const data: KnowledgeItem[] = await response.json();
      const allTags = [...new Set(data.flatMap((item: KnowledgeItem) => item.tags))];
      set({ items: data, allTags });
    } catch (error) {
      console.error("Failed to fetch knowledge items:", error);
    }
  },
}));