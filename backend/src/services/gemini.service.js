import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

class GeminiService {
  constructor() {
    this.client = null;
    this.model = null;
    this.initializeClient();
  }

  initializeClient() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('⚠️  Gemini API key not configured');
      return;
    }

    try {
      this.client = new GoogleGenerativeAI(apiKey);
      const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      this.model = this.client.getGenerativeModel({ model: modelName });
      console.log(`✓ Gemini API client initialized (${modelName})`);
    } catch (error) {
      console.error('✗ Gemini API initialization failed:', error.message);
    }
  }

  isConfigured() {
    return this.client !== null && this.model !== null;
  }

  async generateLinkedInPost(context, styleGuidelines) {
    if (!this.isConfigured()) {
      throw new Error('Gemini API not configured');
    }

    const {
      postTitle,
      postUrl,
      subreddit,
      topComments = [],
      postDescription = '',
      category = 'Engineering'
    } = context;

    // Build the prompt
    const prompt = this.buildPrompt(
      postTitle,
      postUrl,
      subreddit,
      postDescription,
      topComments,
      category,
      styleGuidelines
    );

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        content: text.trim(),
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        wordCount: this.countWords(text)
      };
    } catch (error) {
      console.error('Error generating LinkedIn post:', error.message);
      throw error;
    }
  }

  buildPrompt(title, url, subreddit, description, comments, category, guidelines) {
    let prompt = `You are a professional LinkedIn content creator specializing in ${category} content.

Your task is to create an engaging LinkedIn post based on this Reddit content:

**Post Title:** ${title}
**Source:** r/${subreddit}
**URL:** ${url}
`;

    if (description) {
      prompt += `\n**Post Description:**\n${description}\n`;
    }

    if (comments && comments.length > 0) {
      prompt += `\n**Top Comments from the Discussion:**\n`;
      comments.slice(0, 10).forEach((comment, index) => {
        prompt += `${index + 1}. (${comment.score} upvotes) ${comment.body}\n`;
      });
    }

    prompt += `\n**Style Guidelines:**\n${guidelines}\n`;

    prompt += `\n**Instructions:**
- Create a LinkedIn post based on the Reddit content above
- Follow the style guidelines provided
- Make the content professional yet engaging
- Do not mention Reddit or that this is sourced from social media
- Focus on the engineering/technical insights
- Be authentic and avoid generic corporate language
- DO NOT include any hashtags
- Output ONLY the LinkedIn post content, no meta-commentary or explanations

Generate the LinkedIn post now:`;

    return prompt;
  }

  countWords(text) {
    return text.trim().split(/\s+/).length;
  }

  async testConnection() {
    if (!this.isConfigured()) {
      return { success: false, message: 'Gemini API not configured' };
    }

    try {
      const result = await this.model.generateContent('Hello, this is a test. Respond with "OK".');
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        message: 'Gemini API connection successful',
        testResponse: text
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new GeminiService();
