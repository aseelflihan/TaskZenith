import { create } from 'zustand';
import { KnowledgeItem } from '@/lib/types';

interface SelectedContentState {
  selectedItem: KnowledgeItem | null;
  setSelectedItem: (item: KnowledgeItem | null) => void;
}

export const useSelectedContentStore = create<SelectedContentState>((set) => ({
  selectedItem: null,
  setSelectedItem: (item) => set({ selectedItem: item }),
}));