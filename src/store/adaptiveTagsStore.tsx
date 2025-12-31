import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { adaptiveTagsIntegrationService } from '../services/adaptiveTagsIntegrationService';
import type { AdaptiveTag, TagCategory, IntegrationStatus } from '../types';

interface AdaptiveTagsState {
  // Tags data
  tags: AdaptiveTag[];
  categories: TagCategory[];
  
  // Integration status
  integrationStatus: IntegrationStatus;
  isConnected: boolean;
  
  // UI state
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  
  // Filter and search
  selectedCategory: string | null;
  searchQuery: string;
  sortBy: 'confidence' | 'relevance' | 'timestamp';
  sortOrder: 'asc' | 'desc';
  
  // Actions
  setTags: (tags: AdaptiveTag[]) => void;
  addTag: (tag: AdaptiveTag) => void;
  updateTag: (id: string, updates: Partial<AdaptiveTag>) => void;
  removeTag: (id: string) => void;
  
  setCategories: (categories: TagCategory[]) => void;
  setSelectedCategory: (category: string | null) => void;
  
  setSearchQuery: (query: string) => void;
  setSorting: (sortBy: 'confidence' | 'relevance' | 'timestamp', order: 'asc' | 'desc') => void;
  
  // Integration actions
  initializeIntegration: () => Promise<void>;
  refreshTags: () => Promise<void>;
  processContent: (content: string, metadata?: any) => Promise<AdaptiveTag[]>;
  submitFeedback: (tagId: string, feedback: any) => Promise<void>;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // State management
  reset: () => void;
}

const initialState = {
  tags: [],
  categories: [],
  integrationStatus: {
    coreConnected: false,
    adaptiveConnected: false,
    apiGatewayConnected: false,
    lastSync: null,
    syncStatus: 'disconnected' as 'connected' | 'disconnected' | 'syncing' | 'error'
  },
  isConnected: false,
  isLoading: false,
  isProcessing: false,
  error: null,
  selectedCategory: null,
  searchQuery: '',
  sortBy: 'confidence' as const,
  sortOrder: 'desc' as const,
};

export const useAdaptiveTagsStore = create<AdaptiveTagsState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Data management
        setTags: (tags) => set({ tags }),
        
        addTag: (tag) => set((state) => ({
          tags: [...state.tags, tag]
        })),
        
        updateTag: (id, updates) => set((state) => ({
          tags: state.tags.map(tag => 
            tag.id === id ? { ...tag, ...updates } : tag
          )
        })),
        
        removeTag: (id) => set((state) => ({
          tags: state.tags.filter(tag => tag.id !== id)
        })),

        setCategories: (categories) => set({ categories }),
        setSelectedCategory: (category) => set({ selectedCategory: category }),

        // Search and filter
        setSearchQuery: (query) => set({ searchQuery: query }),
        setSorting: (sortBy, order) => set({ sortBy, sortOrder: order }),

        // Integration actions
        initializeIntegration: async () => {
          set({ isLoading: true, error: null });
          try {
            await adaptiveTagsIntegrationService.initialize();
            
            // Load initial data
            const [tags, categories, status] = await Promise.all([
              adaptiveTagsIntegrationService.getTags(),
              adaptiveTagsIntegrationService.getCategories(),
              adaptiveTagsIntegrationService.getIntegrationStatus()
            ]);
            
            set({
              tags,
              categories,
              integrationStatus: status,
              isConnected: status.coreConnected && status.adaptiveConnected,
              isLoading: false
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to initialize integration',
              isLoading: false
            });
          }
        },

        refreshTags: async () => {
          set({ isLoading: true, error: null });
          try {
            const tags = await adaptiveTagsIntegrationService.getTags();
            const status = await adaptiveTagsIntegrationService.getIntegrationStatus();
            
            set({
              tags,
              integrationStatus: status,
              isConnected: status.coreConnected && status.adaptiveConnected,
              isLoading: false
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to refresh tags',
              isLoading: false
            });
          }
        },

        processContent: async (content, metadata = {}) => {
          set({ isProcessing: true, error: null });
          try {
            const tags = await adaptiveTagsIntegrationService.processContent(content, metadata);
            set((state) => ({
              tags: [...state.tags, ...tags],
              isProcessing: false
            }));
            return tags;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to process content',
              isProcessing: false
            });
            return [];
          }
        },

        submitFeedback: async (tagId, feedback) => {
          try {
            await adaptiveTagsIntegrationService.submitFeedback(tagId, feedback);
            
            // Update local state
            set((state) => ({
              tags: state.tags.map(tag =>
                tag.id === tagId 
                  ? { ...tag, feedback: [...(tag.feedback || []), feedback] }
                  : tag
              )
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to submit feedback'
            });
          }
        },

        // UI state management
        setLoading: (loading) => set({ isLoading: loading }),
        setProcessing: (processing) => set({ isProcessing: processing }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        // Reset state
        reset: () => set(initialState),
      }),
      {
        name: 'adaptive-tags-store',
        partialize: (state) => ({
          selectedCategory: state.selectedCategory,
          searchQuery: state.searchQuery,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
        }),
      }
    ),
    {
      name: 'adaptive-tags-store',
    }
  )
);

// Derived selectors
export const useFilteredTags = () => {
  const { tags, selectedCategory, searchQuery, sortBy, sortOrder } = useAdaptiveTagsStore();
  
  let filtered = tags;
  
  // Filter by category
  if (selectedCategory) {
    filtered = filtered.filter(tag => tag.category === selectedCategory);
  }
  
  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(tag => 
      tag.label.toLowerCase().includes(query) ||
      tag.description?.toLowerCase().includes(query) ||
      tag.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );
  }
  
  // Sort
  filtered.sort((a, b) => {
    let aVal, bVal;
    
    switch (sortBy) {
      case 'confidence':
        aVal = a.confidence || 0;
        bVal = b.confidence || 0;
        break;
      case 'relevance':
        aVal = a.relevanceScore || 0;
        bVal = b.relevanceScore || 0;
        break;
      case 'timestamp':
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }
    
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });
  
  return filtered;
};

export const useTagStats = () => {
  const { tags, categories } = useAdaptiveTagsStore();
  
  const stats = {
    total: tags.length,
    byCategory: {} as Record<string, number>,
    highConfidence: tags.filter(tag => (tag.confidence || 0) > 0.8).length,
    recent: tags.filter(tag => {
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      return new Date(tag.createdAt) > dayAgo;
    }).length,
    averageConfidence: tags.length > 0 
      ? tags.reduce((sum, tag) => sum + (tag.confidence || 0), 0) / tags.length 
      : 0
  };
  
  // Calculate category distribution
  categories.forEach(category => {
    stats.byCategory[category.id] = tags.filter(tag => tag.category === category.id).length;
  });
  
  return stats;
};