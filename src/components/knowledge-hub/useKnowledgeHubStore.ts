import { create } from 'zustand';
import { KnowledgeItem, KnowledgeHubState } from '@/types/custom';

export const useKnowledgeHubStore = create<KnowledgeHubState>((set: any, get: any) => ({
  items: [],
  selectedItem: null,
  searchTerm: '',
  filterTags: [],
  allTags: [],
  isLoading: false,
  isInitialLoad: true,
  setItems: (items: KnowledgeItem[]) => {
    // ترتيب البطاقات حسب التاريخ - الأحدث أولاً
    const sortedItems = items.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const allTags = [...new Set(sortedItems.flatMap((item: KnowledgeItem) => item.tags))];
    set({ items: sortedItems, allTags, isInitialLoad: false });
  },
  addItem: (item: KnowledgeItem) => set((state: KnowledgeHubState) => {
    // إضافة البطاقة الجديدة في المقدمة (الأحدث أولاً)
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
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  fetchItems: async () => {
    const state = get();
    
    // Only show loading for initial load or if no items exist
    if (state.isInitialLoad || state.items.length === 0) {
      set({ isLoading: true });
    }
    
    try {
      const response = await fetch('/api/knowledge');
      const data: KnowledgeItem[] = await response.json();
      
      // ترتيب البطاقات حسب التاريخ - الأحدث أولاً
      const sortedData = data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      const allTags = [...new Set(sortedData.flatMap((item: KnowledgeItem) => item.tags))];
      
      // Simulate network delay for better UX (only on initial load)
      if (state.isInitialLoad) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      set({ 
        items: sortedData, 
        allTags, 
        isLoading: false, 
        isInitialLoad: false 
      });
    } catch (error) {
      console.error("Failed to fetch knowledge items:", error);
      set({ isLoading: false, isInitialLoad: false });
    }
  },
}));