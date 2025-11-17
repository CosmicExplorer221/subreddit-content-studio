import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // Categories
      categories: [],
      selectedCategory: null,
      setCategories: (categories) => set({ categories }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),

      // Style templates
      styleTemplates: [],
      selectedTemplate: null,
      setStyleTemplates: (templates) => set({ styleTemplates: templates }),
      setSelectedTemplate: (template) => set({ selectedTemplate: template }),

      // Posts
      posts: [],
      selectedPosts: [],
      setPosts: (posts) => set({ posts }),
      togglePostSelection: (postId) => {
        const { selectedPosts } = get();
        const isSelected = selectedPosts.includes(postId);
        set({
          selectedPosts: isSelected
            ? selectedPosts.filter(id => id !== postId)
            : [...selectedPosts, postId]
        });
      },
      selectAllPosts: () => {
        const { posts } = get();
        set({ selectedPosts: posts.map(p => p.id) });
      },
      clearSelection: () => set({ selectedPosts: [] }),

      // Filters
      filters: {
        timeFilter: 'week',
        sortBy: 'hot',
        minUpvotes: 0,
        minComments: 0,
      },
      setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

      // Generated content
      generatedContent: {},
      setGeneratedContent: (postId, content) => {
        const { generatedContent } = get();
        set({
          generatedContent: {
            ...generatedContent,
            [postId]: content
          }
        });
      },
      clearGeneratedContent: (postId) => {
        const { generatedContent } = get();
        const newContent = { ...generatedContent };
        delete newContent[postId];
        set({ generatedContent: newContent });
      },

      // Downloads
      downloads: {},
      setDownload: (postId, status) => {
        const { downloads } = get();
        set({
          downloads: {
            ...downloads,
            [postId]: status
          }
        });
      },

      // UI State
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),

      // View mode
      viewMode: 'browse', // browse, generate, notion
      setViewMode: (mode) => set({ viewMode: mode }),

      // Settings
      settings: null,
      setSettings: (settings) => set({ settings }),

      // Clear all data
      clearAll: () => set({
        posts: [],
        selectedPosts: [],
        generatedContent: {},
        downloads: {},
      }),
    }),
    {
      name: 'subreddit-content-studio',
      partialize: (state) => ({
        selectedCategory: state.selectedCategory,
        selectedTemplate: state.selectedTemplate,
        filters: state.filters,
      }),
    }
  )
);
