import React, { useEffect, useState, useCallback } from 'react';
import { Tag, Plus, X, RefreshCw, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAdaptiveTagsStore } from '../store/adaptiveTagsStore';
import { useUnifiedAuth } from '../services/unifiedAuthService';
import { useUnifiedAPI } from '../services/unifiedIntegrationService';
import { useEventBus } from '../services/unifiedEventBus';
import { useToast } from '../store/notificationStore';
import { TagItem, TagsData, UnifiedTagOperation } from '../types';

interface TagsPanelProps {
  contentId?: string;
  initialTags?: TagsData;
  onTagsUpdate?: (tags: TagsData) => void;
  enableRealTime?: boolean;
  className?: string;
}

const TagsPanel: React.FC<TagsPanelProps> = ({
  contentId,
  initialTags,
  onTagsUpdate,
  enableRealTime = true,
  className
}) => {
  // Unified system hooks
  const { isAuthenticated, hasPermission } = useUnifiedAuth();
  const { tagsStore, isLoading, error, refreshTags, addTag, removeTag } = useAdaptiveTagsStore();
  const { sendRequest, isOnline } = useUnifiedAPI();
  const eventBus = useEventBus();
  const { showToast } = useToast();

  // Component state
  const [newTagName, setNewTagName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('custom');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Real-time updates setup
  useEffect(() => {
    if (!enableRealTime || !contentId) return;

    const handleTagUpdate = (event: any) => {
      if (event.contentId === contentId) {
        refreshTags(contentId);
        if (onTagsUpdate) {
          onTagsUpdate(event.tagsData);
        }
      }
    };

    eventBus.subscribe('tags:updated', handleTagUpdate);
    eventBus.subscribe('tags:created', handleTagUpdate);
    eventBus.subscribe('tags:deleted', handleTagUpdate);

    return () => {
      eventBus.unsubscribe('tags:updated', handleTagUpdate);
      eventBus.unsubscribe('tags:created', handleTagUpdate);
      eventBus.unsubscribe('tags:deleted', handleTagUpdate);
    };
  }, [contentId, enableRealTime, eventBus, refreshTags, onTagsUpdate]);

  // Initial data loading
  useEffect(() => {
    if (contentId && !tagsStore.hasData(contentId)) {
      refreshTags(contentId);
    }
  }, [contentId, refreshTags, tagsStore]);

  // Refresh tags function
  const handleRefresh = useCallback(async () => {
    if (!contentId) return;
    
    try {
      setRefreshTrigger(prev => prev + 1);
      await refreshTags(contentId);
      showToast('Tags refreshed successfully', 'success');
    } catch (error) {
      console.error('Failed to refresh tags:', error);
      showToast('Failed to refresh tags', 'error');
    }
  }, [contentId, refreshTags, showToast]);

  // Add new tag
  const handleAddTag = useCallback(async () => {
    if (!newTagName.trim() || !contentId || !isAuthenticated) return;

    try {
      setIsAddingTag(true);
      const newTag: UnifiedTagOperation = {
        name: newTagName.trim(),
        category: selectedCategory,
        confidence: 1.0,
        operation: 'create',
        metadata: {
          userId: 'current-user', // Would be from auth context
          timestamp: new Date().toISOString()
        }
      };

      await addTag(contentId, newTag);
      setNewTagName('');
      setSelectedCategory('custom');
      showToast('Tag added successfully', 'success');
      
      // Broadcast update to other components
      eventBus.publish('tags:created', {
        contentId,
        tag: newTag,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to add tag:', error);
      showToast('Failed to add tag', 'error');
    } finally {
      setIsAddingTag(false);
    }
  }, [newTagName, selectedCategory, contentId, isAuthenticated, addTag, showToast, eventBus]);

  // Remove tag
  const handleRemoveTag = useCallback(async (tagName: string, category: string) => {
    if (!contentId || !isAuthenticated) return;

    try {
      const removeOp: UnifiedTagOperation = {
        name: tagName,
        category,
        confidence: 1.0,
        operation: 'delete',
        metadata: {
          userId: 'current-user',
          timestamp: new Date().toISOString()
        }
      };

      await removeTag(contentId, removeOp);
      showToast('Tag removed successfully', 'success');
      
      // Broadcast update to other components
      eventBus.publish('tags:deleted', {
        contentId,
        tagName,
        category,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to remove tag:', error);
      showToast('Failed to remove tag', 'error');
    }
  }, [contentId, isAuthenticated, removeTag, showToast, eventBus]);

  // Get current tags data
  const currentTags = contentId ? tagsStore.getData(contentId) : initialTags;

  if (!isAuthenticated) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Tag className="mx-auto h-12 w-12 mb-4" />
          <p>Please authenticate to manage tags</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading tags...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Error loading tags: {error}</span>
          <button 
            onClick={handleRefresh}
            className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!currentTags) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Tag className="mx-auto h-12 w-12 mb-4" />
          <p>No tags available</p>
          <button 
            onClick={handleRefresh}
            className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Load Tags
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Tag className="h-5 w-5 mr-2 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Tags</h3>
            {isOnline ? (
              <CheckCircle2 className="h-4 w-4 ml-2 text-green-500" title="Online" />
            ) : (
              <AlertCircle className="h-4 w-4 ml-2 text-orange-500" title="Offline" />
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 rounded"
              title="Refresh tags"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            {hasPermission('tags:manage') && (
              <button
                className="p-2 text-gray-400 hover:text-gray-600 rounded"
                title="Tag settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Add new tag */}
        {hasPermission('tags:create') && (
          <div className="mb-6">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="custom">Custom</option>
                <option value="topic">Topic</option>
                <option value="sentiment">Sentiment</option>
                <option value="language">Language</option>
                <option value="category">Category</option>
              </select>
              <button
                onClick={handleAddTag}
                disabled={!newTagName.trim() || isAddingTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isAddingTag ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Auto-generated tags */}
        {currentTags.autoGenerated && currentTags.autoGenerated.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Auto-Generated</h4>
            <div className="flex flex-wrap gap-2">
              {currentTags.autoGenerated.map((tag, index) => (
                <span
                  key={`auto-${index}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag.name}
                  <span className="ml-1 text-xs text-blue-600">
                    {Math.round(tag.confidence * 100)}%
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* User-defined tags */}
        {currentTags.userDefined && currentTags.userDefined.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">User Tags</h4>
            <div className="flex flex-wrap gap-2">
              {currentTags.userDefined.map((tag, index) => (
                <span
                  key={`user-${index}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag.name}
                  <span className="ml-1 text-xs text-gray-600">
                    {tag.category}
                  </span>
                  {hasPermission('tags:delete') && (
                    <button
                      onClick={() => handleRemoveTag(tag.name, tag.category)}
                      className="ml-2 p-0.5 text-gray-400 hover:text-red-600 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {(!currentTags.autoGenerated || currentTags.autoGenerated.length === 0) &&
         (!currentTags.userDefined || currentTags.userDefined.length === 0) && (
          <div className="text-center py-8">
            <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No tags found</p>
            <p className="text-sm text-gray-400 mt-1">Tags will appear here when content is analyzed</p>
          </div>
        )}
      </div>
    </div>
  );
};
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Tags</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'topic':
        return 'bg-blue-100 text-blue-800';
      case 'sentiment':
        return 'bg-green-100 text-green-800';
      case 'language':
        return 'bg-purple-100 text-purple-800';
      case 'content-type':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTags = (tags: TagItem[], title: string) => {
    if (!tags || tags.length === 0) return null;

    return (
      <div>
        <h4 className="text-sm font-medium mb-3">{title}</h4>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <div 
              key={index}
              className="flex items-center space-x-1 group"
            >
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getCategoryColor(tag.category)}`}>
                <Tag className="h-3 w-3 mr-1" />
                {tag.name}
              </span>
              <span className="text-xs text-gray-500">
                {tag.confidence.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Tags</h3>
        <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded-md text-gray-700 hover:bg-gray-50">
          <Plus className="h-3 w-3 mr-1" />
          Add Tag
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Auto-generated Tags */}
        {renderTags(tagsData.autoGenerated, "Auto-generated Tags")}
        
        {/* User-defined Tags */}
        {renderTags(tagsData.userDefined, "User-defined Tags")}
        
        {/* Empty State */}
        {(!tagsData.autoGenerated || tagsData.autoGenerated.length === 0) && 
         (!tagsData.userDefined || tagsData.userDefined.length === 0) && (
          <div className="text-center py-6">
            <Tag className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tags available</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tags will appear here when content is analyzed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagsPanel;