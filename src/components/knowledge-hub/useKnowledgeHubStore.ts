import { create } from 'zustand';
import { KnowledgeItem } from '@/lib/types';

interface KnowledgeHubState {
  items: KnowledgeItem[];
  selectedItem: KnowledgeItem | null;
  isLoading: boolean;
  filterTags: string[];
  setItems: (items: KnowledgeItem[]) => void;
  addItem: (item: KnowledgeItem) => void;
  setSelectedItem: (item: KnowledgeItem | null) => void;
  toggleFilterTag: (tag: string) => void;
  clearFilterTags: () => void;
  fetchItems: () => Promise<void>;
}

export const useKnowledgeHubStore = create<KnowledgeHubState>((set) => ({
  items: [],
  selectedItem: null,
  isLoading: true,
  filterTags: [],
  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ items: [item, ...state.items] })),
  setSelectedItem: (item) => set({ selectedItem: item }),
  toggleFilterTag: (tag) =>
    set((state) => {
      const newFilterTags = state.filterTags.includes(tag)
        ? state.filterTags.filter((t) => t !== tag)
        : [...state.filterTags, tag];
      return { filterTags: newFilterTags };
    }),
  clearFilterTags: () => set({ filterTags: [] }),
  fetchItems: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/knowledge');
      const data = await response.json();
      set({ items: data, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch knowledge items:", error);
      set({ isLoading: false });
    }
  },
}));