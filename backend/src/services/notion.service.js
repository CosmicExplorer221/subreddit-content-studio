import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import { createReadStream } from 'fs';
import { basename } from 'path';

dotenv.config();

class NotionService {
  constructor() {
    this.client = null;
    this.databaseId = null;
    this.initializeClient();
  }

  initializeClient() {
    const apiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!apiKey || !databaseId) {
      console.warn('⚠️  Notion API credentials not configured');
      return;
    }

    try {
      this.client = new Client({ auth: apiKey });
      this.databaseId = databaseId;
      console.log('✓ Notion API client initialized');
    } catch (error) {
      console.error('✗ Notion API initialization failed:', error.message);
    }
  }

  isConfigured() {
    return this.client !== null && this.databaseId !== null;
  }

  async createPage(data) {
    if (!this.isConfigured()) {
      throw new Error('Notion API not configured');
    }

    const {
      content,
      mediaUrl,
      mediaFilePath,
      category,
      sourceUrl,
      redditMetadata,
      styleTemplate,
      scheduledDate
    } = data;

    try {
      const properties = {
        // Title property (required by most databases)
        Name: {
          title: [
            {
              text: {
                content: `${category} - ${new Date().toLocaleDateString()}`
              }
            }
          ]
        },
        // Content as rich text
        Content: {
          rich_text: [
            {
              text: {
                content: content.substring(0, 2000) // Notion has 2000 char limit per rich_text
              }
            }
          ]
        },
        // Category as select
        Category: {
          select: {
            name: category
          }
        },
        // Source URL
        'Source URL': {
          url: sourceUrl
        },
        // Status as select
        Status: {
          select: {
            name: 'Draft'
          }
        }
      };

      // Add scheduled date if provided
      if (scheduledDate) {
        properties['Scheduled Date'] = {
          date: {
            start: scheduledDate
          }
        };
      }

      // Add Reddit metadata as JSON string in a text property
      if (redditMetadata) {
        properties['Reddit Metadata'] = {
          rich_text: [
            {
              text: {
                content: JSON.stringify(redditMetadata, null, 2).substring(0, 2000)
              }
            }
          ]
        };
      }

      // Add style template info
      if (styleTemplate) {
        properties['Style Template'] = {
          rich_text: [
            {
              text: {
                content: styleTemplate
              }
            }
          ]
        };
      }

      // Create the page
      const response = await this.client.pages.create({
        parent: {
          database_id: this.databaseId
        },
        properties
      });

      // If there's media, add it to the page content
      if (mediaUrl || mediaFilePath) {
        await this.addMediaToPage(response.id, mediaUrl, mediaFilePath);
      }

      return {
        success: true,
        pageId: response.id,
        url: response.url
      };
    } catch (error) {
      console.error('Error creating Notion page:', error.message);
      throw error;
    }
  }

  async addMediaToPage(pageId, mediaUrl, mediaFilePath) {
    if (!this.isConfigured()) {
      throw new Error('Notion API not configured');
    }

    try {
      const children = [];

      if (mediaUrl) {
        // Add image or video embed
        if (mediaUrl.match(/\.(jpg|jpeg|png|gif)$/i)) {
          children.push({
            object: 'block',
            type: 'image',
            image: {
              type: 'external',
              external: {
                url: mediaUrl
              }
            }
          });
        } else {
          // For videos or other media, add as embed or link
          children.push({
            object: 'block',
            type: 'embed',
            embed: {
              url: mediaUrl
            }
          });
        }
      }

      if (children.length > 0) {
        await this.client.blocks.children.append({
          block_id: pageId,
          children
        });
      }
    } catch (error) {
      console.error('Error adding media to Notion page:', error.message);
      // Don't throw - media addition is optional
    }
  }

  async batchCreate(items) {
    if (!this.isConfigured()) {
      throw new Error('Notion API not configured');
    }

    const results = await Promise.allSettled(
      items.map(item => this.createPage(item))
    );

    const succeeded = [];
    const failed = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        succeeded.push({
          index,
          ...result.value
        });
      } else {
        failed.push({
          index,
          error: result.reason.message
        });
      }
    });

    return { succeeded, failed };
  }

  async checkDuplicate(sourceUrl) {
    if (!this.isConfigured()) {
      throw new Error('Notion API not configured');
    }

    try {
      const response = await this.client.databases.query({
        database_id: this.databaseId,
        filter: {
          property: 'Source URL',
          url: {
            equals: sourceUrl
          }
        }
      });

      return response.results.length > 0;
    } catch (error) {
      console.error('Error checking for duplicates:', error.message);
      return false;
    }
  }

  async testConnection() {
    if (!this.isConfigured()) {
      return { success: false, message: 'Notion API not configured' };
    }

    try {
      // Try to retrieve database info
      const database = await this.client.databases.retrieve({
        database_id: this.databaseId
      });

      return {
        success: true,
        message: 'Notion API connection successful',
        databaseTitle: database.title[0]?.plain_text || 'Untitled'
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new NotionService();
