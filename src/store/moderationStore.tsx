import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  ModerationState,
  ModerationResponse,
  FeedbackResponse,
  AnalyticsResponse,
  NLPResponse,
  TagResponse,
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

      submitFeedback: async (feedback: Omit<FeedbackResponse, 'id' | 'timestamp'> & { itemId?: string }) => {
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
          
          return;
        } catch (error) {
          let errorMessage = 'Failed to submit feedback';
          
          if (error instanceof Error) {
            if (error.message.includes('timeout')) {
              errorMessage = 'Feedback submission timed out. Please check your connection and try again.';
            } else if (error.message.includes('Network Error') || error.message.includes('ECONNREFUSED')) {
              errorMessage = 'Unable to connect to the server. Please ensure the backend service is running.';
            } else {
              errorMessage = error.message;
            }
          }
          
          get().setError('feedback', errorMessage);
          console.error('Error submitting feedback:', error);
          throw new Error(errorMessage);
        } finally {
          get().setLoading('feedback', false);
        }
      },

      fetchAnalytics: async (id: string) => {
        try {
          get().setLoading('analytics', true);
          get().setError('analytics');

          const analyticsData = await apiService.getAnalytics(id);
          
          // Update the selected item with analytics data
          const { selectedItem } = get();
          if (selectedItem && selectedItem.id === id) {
            set(
              {
                selectedItem: {
                  ...selectedItem,
                  analytics: analyticsData,
                },
              },
              false,
              'fetchAnalytics'
            );
          }
          
          // Also update in the items list
          set(
            {
              items: get().items.map(item =>
                item.id === id ? { ...item, analytics: analyticsData } : item
              ),
            },
            false,
            'fetchAnalytics'
          );
          
          return analyticsData;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics';
          get().setError('analytics', errorMessage);
          console.error('Error fetching analytics:', error);
          throw error;
        } finally {
          get().setLoading('analytics', false);
        }
      },

      fetchNLPContext: async (id: string) => {
        try {
          get().setLoading('nlp', true);
          get().setError('nlp');

          const nlpData = await apiService.getNLPContext(id);
          
          // Update the selected item with NLP data
          const { selectedItem } = get();
          if (selectedItem && selectedItem.id === id) {
            set(
              {
                selectedItem: {
                  ...selectedItem,
                  nlpContext: nlpData,
                },
              },
              false,
              'fetchNLPContext'
            );
          }
          
          // Also update in the items list
          set(
            {
              items: get().items.map(item =>
                item.id === id ? { ...item, nlpContext: nlpData } : item
              ),
            },
            false,
            'fetchNLPContext'
          );
          
          return nlpData;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch NLP context';
          get().setError('nlp', errorMessage);
          console.error('Error fetching NLP context:', error);
          throw error;
        } finally {
          get().setLoading('nlp', false);
        }
      },

      fetchTags: async (id: string) => {
        try {
          get().setLoading('tags', true);
          get().setError('tags');

          const tagsData = await apiService.getTags(id);
          
          // Update the selected item with tags data
          const { selectedItem } = get();
          if (selectedItem && selectedItem.id === id) {
            set(
              {
                selectedItem: {
                  ...selectedItem,
                  tags: tagsData,
                },
              },
              false,
              'fetchTags'
            );
          }
          
          // Also update in the items list
          set(
            {
              items: get().items.map(item =>
                item.id === id ? { ...item, tags: tagsData } : item
              ),
            },
            false,
            'fetchTags'
          );
          
          return tagsData;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tags';
          get().setError('tags', errorMessage);
          console.error('Error fetching tags:', error);
          throw error;
        } finally {
          get().setLoading('tags', false);
        }
      },

      updateItemStatus: (id: string, statusBadge: any, rewardStatus?: 'awaiting' | 'received') => {
        set(
          {
            items: get().items.map(item =>
              item.id === id
                ? {
                    ...item,
                    statusBadge,
                    lastUpdated: new Date().toISOString(),
                    rewardStatus
                  }
                : item
            ),
            selectedItem: get().selectedItem?.id === id
              ? {
                  ...get().selectedItem!,
                  statusBadge,
                  lastUpdated: new Date().toISOString(),
                  rewardStatus
                }
              : get().selectedItem,
          },
          false,
          'updateItemStatus'
        );
      },

      // Enhanced RL confidence updates with reward calculation
      simulateRLUpdate: (id: string) => {
        const currentItem = get().items.find(item => item.id === id);
        if (currentItem) {
          // Simulate more realistic RL confidence change
          const rewardChange = (Math.random() - 0.3) * 0.15; // Biased towards positive rewards
          const newConfidence = Math.max(0.1, Math.min(1.0, currentItem.confidence + rewardChange));
          
          const updatedItem = {
            ...currentItem,
            confidence: newConfidence,
            lastUpdated: new Date().toISOString(),
            statusBadge: {
              type: 'updated' as const,
              timestamp: new Date().toISOString(),
              message: rewardChange > 0 ? 'Positive RL reward applied' : 'RL adjustment applied',
            },
            rlMetrics: {
              confidenceScore: newConfidence,
              rewardHistory: [
                ...(currentItem.rlMetrics?.rewardHistory || []),
                {
                  timestamp: new Date().toISOString(),
                  reward: rewardChange,
                  action: (rewardChange > 0.05 ? 'approve' : rewardChange < -0.05 ? 'reject' : 'pending') as 'approve' | 'reject' | 'pending'
                }
              ].slice(-10), // Keep last 10 rewards
              lastReward: new Date().toISOString()
            }
          };

          set(
            {
              items: get().items.map(item => item.id === id ? updatedItem : item),
              selectedItem: get().selectedItem?.id === id ? updatedItem : get().selectedItem,
            },
            false,
            'simulateRLUpdate'
          );
        }
      },

      // Process RL reward from backend feedback
      processRLReward: async (id: string, action: 'approve' | 'reject' | 'pending') => {
        try {
          const { simulateRLReward } = await import('../services/apiService');
          const reward = await simulateRLReward(id, action);
          
          // Update item with new reward data
          const currentItem = get().items.find(item => item.id === id);
          if (currentItem) {
            const updatedItem = {
              ...currentItem,
              confidence: Math.max(0.1, Math.min(1.0, currentItem.confidence + reward.confidenceUpdate || 0)),
              lastUpdated: new Date().toISOString(),
              statusBadge: {
                type: 'updated' as const,
                timestamp: new Date().toISOString(),
                message: `RL reward: +${((reward.reward || 0) * 100).toFixed(1)}%`,
              },
              rewardStatus: 'received' as const,
              rlMetrics: {
                confidenceScore: Math.max(0.1, Math.min(1.0, currentItem.confidence + reward.confidenceUpdate || 0)),
                rewardHistory: [
                  ...(currentItem.rlMetrics?.rewardHistory || []),
                  {
                    timestamp: new Date().toISOString(),
                    reward: reward.reward || 0,
                    action
                  }
                ].slice(-10),
                lastReward: new Date().toISOString()
              }
            };

            set(
              {
                items: get().items.map(item => item.id === id ? updatedItem : item),
                selectedItem: get().selectedItem?.id === id ? updatedItem : get().selectedItem,
              },
              false,
              'processRLReward'
            );
          }
          
          return reward;
        } catch (error) {
          console.error('Error processing RL reward:', error);
          throw error;
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