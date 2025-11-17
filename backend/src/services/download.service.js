import axios from 'axios';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { pipeline } from 'stream/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DownloadService {
  constructor() {
    this.downloadPath = process.env.DOWNLOAD_PATH || './downloads';
    this.basePath = join(__dirname, '../../../backend', this.downloadPath);
    this.activeDownloads = new Map();
    this.maxConcurrent = parseInt(process.env.MAX_CONCURRENT_DOWNLOADS) || 3;
  }

  ensureDirectory(category) {
    const categoryPath = join(this.basePath, category);
    if (!existsSync(categoryPath)) {
      mkdirSync(categoryPath, { recursive: true });
    }
    return categoryPath;
  }

  generateFileName(category, subreddit, postId, url) {
    const timestamp = Date.now();
    const extension = this.getExtension(url);
    return `${category}_${subreddit}_${timestamp}_${postId}${extension}`;
  }

  getExtension(url) {
    const match = url.match(/\.(jpg|jpeg|png|gif|mp4|webm|mov)(\?.*)?$/i);
    if (match) {
      return `.${match[1].toLowerCase()}`;
    }
    // Default extensions
    if (url.includes('v.redd.it')) {
      return '.mp4';
    }
    return '.jpg';
  }

  async downloadFile(url, category, subreddit, postId, postType) {
    const categoryPath = this.ensureDirectory(category);
    const fileName = this.generateFileName(category, subreddit, postId, url);
    const filePath = join(categoryPath, fileName);

    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: 60000, // 60 seconds
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const writer = createWriteStream(filePath);
      await pipeline(response.data, writer);

      const stats = await import('fs/promises').then(fs => fs.stat(filePath));

      return {
        success: true,
        filePath: filePath.replace(this.basePath, this.downloadPath),
        fileName,
        fileSize: stats.size,
        fileType: postType
      };
    } catch (error) {
      console.error(`Download failed for ${url}:`, error.message);

      return {
        success: false,
        error: error.message
      };
    }
  }

  async downloadRedditVideo(url, category, subreddit, postId) {
    // Reddit videos require special handling
    // v.redd.it videos have both video and audio streams

    try {
      // Try to download the video stream directly
      // Note: Reddit videos often have separate audio, which requires ffmpeg to merge
      // For simplicity, we'll download the video stream only for now

      let videoUrl = url;

      // If it's a reddit video URL, construct the DASH video URL
      if (url.includes('v.redd.it')) {
        // Reddit video URLs typically end with /DASH_xxx.mp4
        // Try different quality options
        const qualities = ['720', '480', '360', '240'];

        for (const quality of qualities) {
          try {
            const testUrl = url.includes('DASH_')
              ? url
              : `${url}/DASH_${quality}.mp4`;

            const response = await axios.head(testUrl, { timeout: 5000 });
            if (response.status === 200) {
              videoUrl = testUrl;
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }

      return await this.downloadFile(videoUrl, category, subreddit, postId, 'video');
    } catch (error) {
      console.error('Reddit video download failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async downloadMedia(post, category) {
    const { id, subreddit, postType, mediaUrl, url } = post;

    if (!mediaUrl && !url) {
      return {
        success: false,
        error: 'No media URL available'
      };
    }

    const downloadUrl = mediaUrl || url;

    try {
      if (postType === 'video' || downloadUrl.includes('v.redd.it')) {
        return await this.downloadRedditVideo(downloadUrl, category, subreddit, id);
      } else if (postType === 'image') {
        return await this.downloadFile(downloadUrl, category, subreddit, id, 'image');
      } else {
        return {
          success: false,
          error: 'Unsupported post type for download'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async batchDownload(posts, category, onProgress) {
    const results = [];
    const queue = [...posts];

    // Process downloads with concurrency limit
    const processQueue = async () => {
      while (queue.length > 0) {
        const batch = queue.splice(0, this.maxConcurrent);

        const batchResults = await Promise.allSettled(
          batch.map(post => this.downloadMedia(post, category))
        );

        batchResults.forEach((result, index) => {
          const post = batch[index];
          if (result.status === 'fulfilled') {
            results.push({
              postId: post.id,
              ...result.value
            });
          } else {
            results.push({
              postId: post.id,
              success: false,
              error: result.reason.message
            });
          }
        });

        // Call progress callback if provided
        if (onProgress) {
          onProgress({
            completed: results.length,
            total: posts.length,
            results: [...results]
          });
        }

        // Small delay between batches
        if (queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    };

    await processQueue();

    return {
      total: posts.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  getDownloadStats() {
    return {
      active: this.activeDownloads.size,
      maxConcurrent: this.maxConcurrent
    };
  }
}

export default new DownloadService();
