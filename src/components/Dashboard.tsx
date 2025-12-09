import React, { useEffect, useState } from 'react';
import { useModerationStore } from '../store/moderationStore';
import { mockModerationItems } from '../services/apiService';
import FilterBar from './FilterBar';
import ModerationCard from './ModerationCard';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorState from './ErrorState';
import Pagination from './Pagination';
import { Search, Filter, RefreshCw } from 'lucide-react';

const Dashboard: React.FC = () => {
  const {
    items,
    selectedItem,
    filters,
    pagination,
    loading,
    error,
    fetchItems,
    setSelectedItem,
    updateFilters,
    updatePagination,
  } = useModerationStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Load initial data - using mock data for now
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Simulate API call with mock data
    setTimeout(() => {
      useModerationStore.getState().setItems(mockModerationItems);
      useModerationStore.getState().updatePagination({
        totalItems: mockModerationItems.length,
        totalPages: Math.ceil(mockModerationItems.length / pagination.pageSize),
      });
    }, 1000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchItems();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    updateFilters(newFilters);
    // Reset to first page when filters change
    updatePagination({ currentPage: 1 });
    fetchItems();
  };

  const handlePageChange = (page: number) => {
    updatePagination({ currentPage: page });
    fetchItems();
  };

  const handleSearch = (searchTerm: string) => {
    updateFilters({ search: searchTerm });
    updatePagination({ currentPage: 1 });
    fetchItems();
  };

  const getStatusCounts = () => {
    return {
      total: items.length,
      approved: items.filter(item => item.decision === 'approved').length,
      rejected: items.filter(item => item.decision === 'rejected').length,
      pending: items.filter(item => item.decision === 'pending').length,
      flagged: items.filter(item => item.flagged).length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Content Moderation Dashboard
              </h1>
              <div className="ml-6 flex space-x-4">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium text-gray-900">{statusCounts.total}</span>
                  <span className="ml-1">Total</span>
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <span className="font-medium">{statusCounts.approved}</span>
                  <span className="ml-1">Approved</span>
                </div>
                <div className="flex items-center text-sm text-red-600">
                  <span className="font-medium">{statusCounts.rejected}</span>
                  <span className="ml-1">Rejected</span>
                </div>
                <div className="flex items-center text-sm text-yellow-600">
                  <span className="font-medium">{statusCounts.pending}</span>
                  <span className="ml-1">Pending</span>
                </div>
                <div className="flex items-center text-sm text-orange-600">
                  <span className="font-medium">{statusCounts.flagged}</span>
                  <span className="ml-1">Flagged</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading.moderation || isRefreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="mb-6">
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
          />
        </div>

        {/* Error State */}
        {error.moderation && (
          <div className="mb-6">
            <ErrorState
              message={error.moderation}
              onRetry={handleRefresh}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content List */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Content Queue
                  {loading.moderation && (
                    <span className="ml-2 inline-flex items-center">
                      <RefreshCw className="h-4 w-4 animate-spin text-primary-500" />
                    </span>
                  )}
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {loading.moderation ? (
                  <LoadingSkeleton count={5} />
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <ModerationCard
                      key={item.id}
                      content={item}
                      onFeedback={(feedback) => {
                        // Handle feedback submission
                        console.log('Feedback submitted:', feedback);
                      }}
                      loading={false}
                      onClick={() => setSelectedItem(item)}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No content found matching your filters.
                  </div>
                )}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {selectedItem ? (
              <div className="space-y-6">
                {/* Selected item details would go here */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Selected Content
                  </h3>
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">
                      <strong>ID:</strong> {selectedItem.id}
                    </p>
                    <p className="mb-2">
                      <strong>Status:</strong> {selectedItem.decision}
                    </p>
                    <p className="mb-2">
                      <strong>Confidence:</strong> {(selectedItem.confidence * 100).toFixed(1)}%
                    </p>
                    <p className="mb-2">
                      <strong>Type:</strong> {selectedItem.type}
                    </p>
                    <p className="mb-2">
                      <strong>Flagged:</strong> {selectedItem.flagged ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center text-gray-500">
                  <Filter className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No content selected
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select a content item to view details and provide feedback.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;