# Subreddit Content Studio

A powerful web application for automating LinkedIn content creation from Reddit posts about engineering topics. Built with a focus on railway/transportation content, but easily expandable to other engineering domains.

## Features

### Core Functionality

- **Reddit Content Fetching**: Fetch top posts from configurable subreddit categories with advanced filtering
- **Category Management**: Create and manage custom categories with multiple subreddits
- **Media Download**: Download videos and images from Reddit posts
- **Comment Analysis**: Fetch and store top comments for context
- **AI-Powered Content Generation**: Generate LinkedIn posts using Google's Gemini API
- **Style Templates**: Multiple style guideline templates (global and category-specific)
- **Notion Integration**: Batch upload generated content to Notion databases
- **Smart Filtering**: Filter by upvotes, comments, time period, and post quality

### Default Categories

- **Railway & Transit** (Enabled): r/railroading, r/trains, r/transit, r/infrastructure
- **Civil Engineering** (Future): r/civilengineering, r/structural, r/construction
- **Mechanical Engineering** (Future): r/mechanical_engineering, r/engineering
- **Electrical Engineering** (Future): r/electronics, r/electricalengineering
- **Software & Tech** (Future): r/programming, r/devops, r/machinelearning

## Tech Stack

### Backend
- **Node.js** with Express
- **SQLite** for local data storage
- **Reddit Public JSON API** (no authentication required)
- **Google Generative AI** (Gemini) for content generation
- **Notion SDK** for Notion integration

### Frontend
- **React 18** with Hooks
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Hot Toast** for notifications
- **Lucide React** for icons

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **yarn**
- **Google Gemini API key** (REQUIRED - free tier available)
- **Notion API key** and Database ID (optional)

**✅ No Reddit API credentials needed!** Uses Reddit's public JSON API (no authentication required).

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd subreddit-content-studio
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your API credentials:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Gemini API Configuration (REQUIRED)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Notion API Configuration (Optional)
NOTION_API_KEY=your_notion_api_key_here
NOTION_DATABASE_ID=your_notion_database_id_here

# Application Settings
DOWNLOAD_PATH=./downloads
MAX_CONCURRENT_DOWNLOADS=3
COMMENT_LIMIT=15
POST_LIMIT=50

# CORS Settings
FRONTEND_URL=http://localhost:5173
```

### 4. Initialize the Database

```bash
cd backend
npm run init-db
```

## Getting API Credentials

### Google Gemini API (REQUIRED)

1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the API key
4. Free tier includes: 60 requests per minute

### Notion API (Optional)

1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Give it a name and select the workspace
4. Copy the **Internal Integration Token**
5. Create a database in Notion with the following properties:
   - Name (Title)
   - Content (Rich Text)
   - Category (Select)
   - Source URL (URL)
   - Status (Select)
   - Scheduled Date (Date)
   - Reddit Metadata (Rich Text)
   - Style Template (Rich Text)
6. Share the database with your integration
7. Copy the database ID from the URL:
   - URL format: `notion.so/workspace/<DATABASE_ID>?v=...`

## Running the Application

### Development Mode

Run both frontend and backend concurrently:

```bash
# From root directory
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

### Production Mode

```bash
# Build frontend
npm run build

# Start backend
npm start
```

## Usage Guide

### Workflow

1. **Select a Category**
   - Use the sidebar to select "Railway & Transit" or another enabled category
   - Or select "All Categories" to fetch from all enabled categories

2. **Fetch Posts**
   - Configure filters (time period, sort by, min upvotes, min comments)
   - Click "Fetch Posts" to retrieve content from Reddit
   - Posts with images and videos will be displayed in a grid

3. **Select Posts**
   - Click on post cards to select them for processing
   - Use "Select All" / "Deselect All" for bulk operations
   - View post details, upvotes, and comments

4. **Download Media** (Optional)
   - Click "Download Selected" to save media files locally
   - Files are organized by category in `/backend/downloads/[category]/`

5. **Generate LinkedIn Content**
   - Switch to the "Review & Generate" tab
   - Select a style template (or use category default)
   - Click "Generate All" or generate individually
   - Preview, edit, and regenerate content as needed

6. **Upload to Notion**
   - Switch to the "Send to Notion" tab
   - Review the upload summary
   - Optionally set a scheduled date
   - Click "Upload to Notion" to batch create pages

### Managing Categories

1. Go to **Settings**
2. Toggle categories on/off using the switches
3. Edit category configurations in `backend/config/categories.json`
4. Add new subreddits to existing categories
5. Create custom categories with unique colors

### Managing Style Templates

1. Go to **Templates**
2. Click "New Template" to create a custom style
3. Assign templates to specific categories or make them global
4. Edit guidelines to control AI-generated content style
5. Use the Railway default template as a reference

## Project Structure

```
subreddit-content-studio/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   ├── config/
│   ├── data/
│   └── downloads/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## Troubleshooting

### Reddit API Issues
- **Subreddit Not Found**: Verify subreddit names (case-sensitive)
- **Rate Limiting**: Public API is limited but should be sufficient for normal use
- **Connection Issues**: Check internet connection and try again

### Gemini API Issues
- **Quota Exceeded**: Free tier has 60 requests/minute limit
- **Model Not Found**: Use `gemini-1.5-flash` or `gemini-2.0-flash-exp`
- **Invalid API Key**: Regenerate key at Google AI Studio

### Notion API Issues
- **Database Not Found**: Ensure integration has access to database
- **Property Not Found**: Match property names exactly in your database
- **Rate Limiting**: Notion has 3 requests/second limit

## License

MIT License - feel free to use and modify for your projects.

---

**Built with ❤️ for engineering content creators**