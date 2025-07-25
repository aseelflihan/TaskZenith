import { create } from 'zustand';
import { KnowledgeItem, SelectedContentState } from '@/types/custom';

export const useSelectedContentStore = create<SelectedContentState>((set: any) => ({
  selectedItem: null,
  setSelectedItem: (item: KnowledgeItem | null) => set({ selectedItem: item }),
}));