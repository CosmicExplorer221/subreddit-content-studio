import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { redditAPI, postsAPI } from '../api/client';
import { Search, Filter, Download, CheckSquare, Square, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import PostCard from './PostCard';

export default function PostBrowser() {
  const {
    selectedCategory,
    filters,
    setFilters,
    posts,
    setPosts,
    selectedPosts,
    togglePostSelection,
    selectAllPosts,
    clearSelection,
    setLoading,
    isLoading,
  } = useStore();

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Clear posts when category changes
    setPosts([]);
    clearSelection();
  }, [selectedCategory, setPosts, clearSelection]);

  const fetchPosts = async () => {
    if (!selectedCategory && !filters.allCategories) {
      toast.error('Please select a category');
      return;
    }

    setLoading(true);
    try {
      const subreddits = selectedCategory
        ? selectedCategory.subreddits
        : [];

      if (subreddits.length === 0) {
        toast.error('No subreddits configured for this category');
        return;
      }

      const response = await redditAPI.fetchMultiplePosts({
        subreddits,
        timeFilter: filters.timeFilter,
        sortBy: filters.sortBy,
        limit: 50,
      });

      let fetchedPosts = response.data.posts;

      // Apply filters
      if (filters.minUpvotes > 0) {
        fetchedPosts = fetchedPosts.filter(p => p.score >= filters.minUpvotes);
      }
      if (filters.minComments > 0) {
        fetchedPosts = fetchedPosts.filter(p => p.numComments >= filters.minComments);
      }

      // Filter by post type (only image and video)
      fetchedPosts = fetchedPosts.filter(p => ['image', 'video'].includes(p.postType));

      setPosts(fetchedPosts);

      // Save posts to database
      if (fetchedPosts.length > 0) {
        await postsAPI.save({
          posts: fetchedPosts,
          categoryId: selectedCategory.id,
        });
      }

      toast.success(`Fetched ${fetchedPosts.length} posts`);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (filters.minUpvotes && post.score < filters.minUpvotes) return false;
    if (filters.minComments && post.numComments < filters.minComments) return false;
    return true;
  });

  const allSelected = filteredPosts.length > 0 && selectedPosts.length === filteredPosts.length;

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Period
              </label>
              <select
                value={filters.timeFilter}
                onChange={(e) => setFilters({ timeFilter: e.target.value })}
                className="input text-sm py-1.5"
              >
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ sortBy: e.target.value })}
                className="input text-sm py-1.5"
              >
                <option value="hot">Hot</option>
                <option value="top">Top</option>
                <option value="new">New</option>
                <option value="rising">Rising</option>
              </select>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary mt-6"
            >
              <Filter size={16} className="mr-2" />
              {showFilters ? 'Hide' : 'More'} Filters
            </button>
          </div>

          <button
            onClick={fetchPosts}
            disabled={isLoading || !selectedCategory}
            className="btn btn-primary mt-6"
          >
            {isLoading ? (
              <>
                <Loader size={16} className="mr-2 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Search size={16} className="mr-2" />
                Fetch Posts
              </>
            )}
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="pt-4 border-t border-gray-200 flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Upvotes
              </label>
              <input
                type="number"
                value={filters.minUpvotes}
                onChange={(e) => setFilters({ minUpvotes: parseInt(e.target.value) || 0 })}
                className="input text-sm py-1.5 w-32"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Comments
              </label>
              <input
                type="number"
                value={filters.minComments}
                onChange={(e) => setFilters({ minComments: parseInt(e.target.value) || 0 })}
                className="input text-sm py-1.5 w-32"
                min="0"
              />
            </div>
          </div>
        )}
      </div>

      {/* Posts List */}
      {posts.length > 0 && (
        <>
          {/* Selection Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={allSelected ? clearSelection : selectAllPosts}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                {allSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>

              {selectedPosts.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedPosts.length} selected
                </span>
              )}
            </div>

            {selectedPosts.length > 0 && (
              <button className="btn btn-primary text-sm">
                <Download size={16} className="mr-2" />
                Download Selected ({selectedPosts.length})
              </button>
            )}
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isSelected={selectedPosts.includes(post.id)}
                onToggleSelect={() => togglePostSelection(post.id)}
              />
            ))}
          </div>
        </>
      )}

      {posts.length === 0 && !isLoading && (
        <div className="card text-center py-12">
          <Search size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Posts Yet
          </h3>
          <p className="text-gray-600">
            {selectedCategory
              ? `Select filters and click "Fetch Posts" to get content from r/${selectedCategory.subreddits.join(', r/')}`
              : 'Select a category from the sidebar to get started'}
          </p>
        </div>
      )}
    </div>
  );
}
