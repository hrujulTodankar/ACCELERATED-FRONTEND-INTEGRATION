import React, { useState } from 'react';
import { FilterBarProps } from '../types';
import { Search, Filter, X } from 'lucide-react';

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onSearch,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTypeChange = (type: any) => {
    onFilterChange({ ...filters, type });
  };

  const handleScoreChange = (score: any) => {
    onFilterChange({ ...filters, score });
  };

  const handleFlaggedChange = (flagged: any) => {
    onFilterChange({ ...filters, flagged });
  };

  const handleDateChange = (date: any) => {
    onFilterChange({ ...filters, date });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    onSearch(searchTerm);
  };

  const clearFilters = () => {
    onFilterChange({
      type: 'all',
      score: 'all',
      flagged: 'all',
      date: 'all',
      search: '',
    });
    onSearch('');
  };

  const hasActiveFilters = filters.type !== 'all' || 
                          filters.score !== 'all' || 
                          filters.flagged !== 'all' || 
                          filters.date !== 'all' || 
                          filters.search.trim() !== '';

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Search Input */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search content..."
              value={filters.search}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
              showAdvanced 
                ? 'text-primary-700 bg-primary-100 border-primary-300 hover:bg-primary-200' 
                : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-600 bg-primary-100 rounded-full">
                Active
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Content Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Types</option>
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            {/* Score Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confidence Score
              </label>
              <select
                value={filters.score}
                onChange={(e) => handleScoreChange(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Scores</option>
                <option value="high">High (80%+)</option>
                <option value="medium">Medium (60-79%)</option>
                <option value="low">Low (0-59%)</option>
              </select>
            </div>

            {/* Flagged Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flagged Status
              </label>
              <select
                value={filters.flagged}
                onChange={(e) => handleFlaggedChange(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Items</option>
                <option value="flagged">Flagged Only</option>
                <option value="unflagged">Unflagged Only</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={filters.date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.type !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
              Type: {filters.type}
              <button
                onClick={() => handleTypeChange('all')}
                className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-primary-400 hover:bg-primary-200 hover:text-primary-500 focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filters.score !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
              Score: {filters.score}
              <button
                onClick={() => handleScoreChange('all')}
                className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-primary-400 hover:bg-primary-200 hover:text-primary-500 focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filters.flagged !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
              {filters.flagged === 'flagged' ? 'Flagged' : 'Unflagged'}
              <button
                onClick={() => handleFlaggedChange('all')}
                className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-primary-400 hover:bg-primary-200 hover:text-primary-500 focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filters.date !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
              {filters.date === 'today' ? 'Today' : 
               filters.date === 'week' ? 'This Week' : 'This Month'}
              <button
                onClick={() => handleDateChange('all')}
                className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-primary-400 hover:bg-primary-200 hover:text-primary-500 focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;