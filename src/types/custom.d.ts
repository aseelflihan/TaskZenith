// Global type definitions for TaskZenith
/// <reference path="./external.d.ts" />

// Knowledge Hub Types
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: 'pdf' | 'docx' | 'txt' | 'excel' | 'image';
  tags: string[];
  createdAt: string;
  fileSize?: number;
  summary?: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export interface KnowledgeHubState {
  items: KnowledgeItem[];
  selectedItem: KnowledgeItem | null;
  searchTerm: string;
  filterTags: string[];
  allTags: string[];
  isLoading: boolean;
  isInitialLoad: boolean;
  setItems: (items: KnowledgeItem[]) => void;
  addItem: (item: KnowledgeItem) => void;
  setSelectedItem: (item: KnowledgeItem | null) => void;
  setSearchTerm: (term: string) => void;
  toggleFilterTag: (tag: string) => void;
  clearFilters: () => void;
  fetchItems: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export interface SelectedContentState {
  selectedItem: KnowledgeItem | null;
  setSelectedItem: (item: KnowledgeItem | null) => void;
}

// Component Props Types
export interface ContentGridProps {
  items: KnowledgeItem[];
  searchTerm: string;
  filterTags: string[];
  onItemSelect: (item: KnowledgeItem) => void;
}

export interface AIInsightPanelProps {
  items: KnowledgeItem[];
  selectedItem: KnowledgeItem | null;
}

export interface SearchBarWithFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  allTags: string[];
  filterTags: string[];
  onToggleFilter: (tag: string) => void;
  onClearFilters: () => void;
}

// API Response Types
export interface UploadResponse {
  success: boolean;
  message: string;
  data?: KnowledgeItem;
}

export interface ProcessingResult {
  success: boolean;
  extractedText?: string;
  summary?: string;
  tasks?: Task[];
  error?: string;
}

// Utility Types
export type FileType = 'pdf' | 'docx' | 'txt' | 'excel' | 'image';
export type PriorityLevel = 'low' | 'medium' | 'high';

// React Event Types
export type ChangeHandler = (value: string) => void;
export type ClickHandler = () => void;
export type ToggleHandler = (isOpen: boolean) => void;