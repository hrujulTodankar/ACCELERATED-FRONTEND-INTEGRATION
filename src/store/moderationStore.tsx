import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  ModerationState,
  ModerationResponse,
  FeedbackResponse,
  FilterState,
  PaginationState,
  LoadingState,
  ErrorState,
} from '../types';
import * as apiService from '../services/apiService';

const initialFilters: FilterState = {
  type: 'all',
  score: 'all',
  flagged: 'all',
  date: 'all',
  search: '',
};

const initialPagination: PaginationState = {
  currentPage: 1,
  totalPages: 1,
  pageSize: 10,
  totalItems: 0,
};

const initialLoading: LoadingState = {
  moderation: false,
  feedback: false,
  analytics: false,
  nlp: false,
  tags: false,
};

const initialError: ErrorState = {};

export const useModerationStore = create<ModerationState>()(
  devtools(
    (set, get) => ({
      items: [],
      selectedItem: null,
      filters: initialFilters,
      pagination: initialPagination,
      loading: initialLoading,
      error: initialError,

      setItems: (items: ModerationResponse[]) => {
        set({ items }, false, 'setItems');
      },

      setSelectedItem: (item: ModerationResponse | null) => {
        set({ selectedItem: item }, false, 'setSelectedItem');
      },

      updateFilters: (newFilters: Partial<FilterState>) => {
        set(
          (state) => ({
            filters: { ...state.filters, ...newFilters },
          }),
          false,
          'updateFilters'
        );
      },

      updatePagination: (newPagination: Partial<PaginationState>) => {
        set(
          (state) => ({
            pagination: { ...state.pagination, ...newPagination },
          }),
          false,
          'updatePagination'
        );
      },

      setLoading: (key: keyof LoadingState, value: boolean) => {
        set(
          (state) => ({
            loading: { ...state.loading, [key]: value },
          }),
          false,
          'setLoading'
        );
      },

      setError: (key: keyof ErrorState, value?: string) => {
        set(
          (state) => ({
            error: { ...state.error, [key]: value },
          }),
          false,
          'setError'
        );
      },

      fetchItems: async () => {
        const { filters, pagination } = get();
        
        try {
          get().setLoading('moderation', true);
          get().setError('moderation');

          const response = await apiService.getModerationItems({
            ...filters,
            page: pagination.currentPage,
            limit: pagination.pageSize,
          });

          set(
            {
              items: response.data,
              pagination: {
                ...pagination,
                totalItems: response.total,
                totalPages: Math.ceil(response.total / pagination.pageSize),
              },
            },
            false,
            'fetchItems'
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch moderation items';
          get().setError('moderation', errorMessage);
          console.error('Error fetching moderation items:', error);
        } finally {
          get().setLoading('moderation', false);
        }
      },

      submitFeedback: async (feedback: Omit<FeedbackResponse, 'id' | 'timestamp'>) => {
        try {
          get().setLoading('feedback', true);
          get().setError('feedback');

          const response = await apiService.submitFeedback(feedback);
          
          // Update the selected item with the feedback
          const { selectedItem } = get();
          if (selectedItem) {
            const updatedItem = {
              ...selectedItem,
              // Update confidence based on feedback and update timestamp
              confidence: 0.95, // High confidence after human feedback
              timestamp: new Date().toISOString(),
            };
            
            set(
              {
                selectedItem: updatedItem,
                items: get().items.map(item =>
                  item.id === selectedItem.id ? updatedItem : item
                ),
              },
              false,
              'submitFeedback'
            );
          }
          
          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
          get().setError('feedback', errorMessage);
          console.error('Error submitting feedback:', error);
          throw error;
        } finally {
          get().setLoading('feedback', false);
        }
      },
    }),
    {
      name: 'moderation-store',
    }
  )
);

// Provider component
export const ModerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};