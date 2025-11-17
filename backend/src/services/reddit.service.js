import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class RedditService {
  constructor() {
    this.baseUrl = 'https://www.reddit.com';
    this.userAgent = process.env.REDDIT_USER_AGENT || 'SubredditContentStudio/1.0.0';
    console.log('✓ Reddit Public JSON API initialized (no auth required)');
  }

  isConfigured() {
    return true; // Always configured since we use public API
  }

  async fetchPosts(subreddit, options = {}) {
    const {
      timeFilter = 'week', // hour, day, week, month, year, all
      limit = 50,
      sortBy = 'hot' // hot, new, top, rising
    } = options;

    try {
      let url = `${this.baseUrl}/r/${subreddit}/${sortBy}.json`;
      const params = { limit };

      // Add time filter for 'top' sorting
      if (sortBy === 'top') {
        params.t = timeFilter;
      }

      const response = await axios.get(url, {
        params,
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000
      });

      const posts = response.data.data.children
        .map(child => child.data)
        .map(post => this.formatPost(post));

      return posts;
    } catch (error) {
      console.error(`Error fetching posts from r/${subreddit}:`, error.message);
      throw error;
    }
  }

  async fetchMultiplePosts(subreddits, options = {}) {
    const results = await Promise.allSettled(
      subreddits.map(sub => this.fetchPosts(sub, options))
    );

    const allPosts = [];
    const errors = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allPosts.push(...result.value);
      } else {
        errors.push({
          subreddit: subreddits[index],
          error: result.reason.message
        });
      }
    });

    // Sort by score (descending)
    allPosts.sort((a, b) => b.score - a.score);

    return {
      posts: allPosts,
      errors
    };
  }

  async fetchComments(postId, limit = 15) {
    try {
      // We need to get the permalink first, or we can construct it
      // For now, we'll fetch from a generic endpoint
      // Format: /r/subreddit/comments/postId.json

      // First, try to get the post to find its subreddit
      // We'll use a different approach - search by post ID across Reddit
      const url = `${this.baseUrl}/comments/${postId}.json`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000
      });

      // Reddit returns an array: [post_data, comments_data]
      const commentsData = response.data[1].data.children;

      const comments = commentsData
        .map(child => child.data)
        .filter(comment => comment.body && comment.body !== '[deleted]' && comment.body !== '[removed]')
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(comment => this.formatComment(comment));

      return comments;
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error.message);
      throw error;
    }
  }

  formatPost(post) {
    const postType = this.determinePostType(post);
    const mediaUrl = this.extractMediaUrl(post, postType);

    return {
      id: post.id,
      title: post.title,
      subreddit: post.subreddit,
      author: post.author,
      url: post.url,
      permalink: `https://reddit.com${post.permalink}`,
      score: post.score,
      upvoteRatio: post.upvote_ratio,
      numComments: post.num_comments,
      createdUtc: post.created_utc,
      postType,
      thumbnail: post.thumbnail !== 'self' && post.thumbnail !== 'default' && post.thumbnail !== 'nsfw' ? post.thumbnail : null,
      mediaUrl,
      selftext: post.selftext || null,
      isVideo: post.is_video || false,
      domain: post.domain
    };
  }

  formatComment(comment) {
    return {
      id: comment.id,
      author: comment.author,
      body: comment.body,
      score: comment.score,
      createdUtc: comment.created_utc,
      isSubmitter: comment.is_submitter || false,
      depth: comment.depth || 0
    };
  }

  determinePostType(post) {
    if (post.is_video || post.domain === 'v.redd.it') {
      return 'video';
    }
    if (post.post_hint === 'image' || /\.(jpg|jpeg|png|gif)$/i.test(post.url)) {
      return 'image';
    }
    if (post.is_self) {
      return 'text';
    }
    return 'link';
  }

  extractMediaUrl(post, postType) {
    if (postType === 'video') {
      // Reddit video
      if (post.media && post.media.reddit_video) {
        return post.media.reddit_video.fallback_url;
      }
      // v.redd.it link
      if (post.domain === 'v.redd.it') {
        return post.url;
      }
    }
    if (postType === 'image') {
      return post.url;
    }
    return null;
  }

  async testConnection() {
    try {
      // Try to fetch a single post from r/test using public API
      const response = await axios.get(`${this.baseUrl}/r/test/hot.json?limit=1`, {
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 5000
      });

      if (response.data && response.data.data && response.data.data.children) {
        return { success: true, message: 'Reddit Public API connection successful (no auth required)' };
      }

      return { success: false, message: 'Unexpected response from Reddit' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new RedditService();
