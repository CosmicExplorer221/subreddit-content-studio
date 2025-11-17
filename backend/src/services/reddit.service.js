import snoowrap from 'snoowrap';
import dotenv from 'dotenv';

dotenv.config();

class RedditService {
  constructor() {
    this.client = null;
    this.initializeClient();
  }

  initializeClient() {
    const { REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT, REDDIT_REFRESH_TOKEN } = process.env;

    if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
      console.warn('⚠️  Reddit API credentials not configured');
      return;
    }

    try {
      // Use refresh token if available for authenticated access, otherwise userless
      if (REDDIT_REFRESH_TOKEN) {
        this.client = new snoowrap({
          userAgent: REDDIT_USER_AGENT || 'SubredditContentStudio/1.0.0',
          clientId: REDDIT_CLIENT_ID,
          clientSecret: REDDIT_CLIENT_SECRET,
          refreshToken: REDDIT_REFRESH_TOKEN
        });
      } else {
        // Userless authentication (lower rate limits)
        this.client = new snoowrap({
          userAgent: REDDIT_USER_AGENT || 'SubredditContentStudio/1.0.0',
          clientId: REDDIT_CLIENT_ID,
          clientSecret: REDDIT_CLIENT_SECRET
        });
      }

      console.log('✓ Reddit API client initialized');
    } catch (error) {
      console.error('✗ Reddit API initialization failed:', error.message);
    }
  }

  isConfigured() {
    return this.client !== null;
  }

  async fetchPosts(subreddit, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('Reddit API not configured');
    }

    const {
      timeFilter = 'week', // hour, day, week, month, year, all
      limit = 50,
      sortBy = 'hot' // hot, new, top, rising
    } = options;

    try {
      let posts;
      const subredditObj = this.client.getSubreddit(subreddit);

      switch (sortBy) {
        case 'top':
          posts = await subredditObj.getTop({ time: timeFilter, limit });
          break;
        case 'new':
          posts = await subredditObj.getNew({ limit });
          break;
        case 'rising':
          posts = await subredditObj.getRising({ limit });
          break;
        case 'hot':
        default:
          posts = await subredditObj.getHot({ limit });
          break;
      }

      return posts.map(post => this.formatPost(post));
    } catch (error) {
      console.error(`Error fetching posts from r/${subreddit}:`, error.message);
      throw error;
    }
  }

  async fetchMultiplePosts(subreddits, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('Reddit API not configured');
    }

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
    if (!this.isConfigured()) {
      throw new Error('Reddit API not configured');
    }

    try {
      const submission = await this.client.getSubmission(postId);
      await submission.expandReplies({ limit: 0, depth: 1 });

      const comments = submission.comments
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
      subreddit: post.subreddit.display_name,
      author: post.author.name,
      url: post.url,
      permalink: `https://reddit.com${post.permalink}`,
      score: post.score,
      upvoteRatio: post.upvote_ratio,
      numComments: post.num_comments,
      createdUtc: post.created_utc,
      postType,
      thumbnail: post.thumbnail !== 'self' && post.thumbnail !== 'default' ? post.thumbnail : null,
      mediaUrl,
      selftext: post.selftext || null,
      isVideo: post.is_video || false,
      domain: post.domain
    };
  }

  formatComment(comment) {
    return {
      id: comment.id,
      author: comment.author.name,
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
    if (!this.isConfigured()) {
      return { success: false, message: 'Reddit API not configured' };
    }

    try {
      // Try to fetch a single post from r/test
      await this.client.getSubreddit('test').getHot({ limit: 1 });
      return { success: true, message: 'Reddit API connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new RedditService();
