import { useState } from 'react';
import { useStore } from '../store/useStore';
import { notionAPI } from '../api/client';
import { Send, CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotionUploader() {
  const {
    posts,
    selectedPosts,
    generatedContent,
    selectedCategory,
    clearSelection,
  } = useStore();

  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [scheduledDate, setScheduledDate] = useState('');

  const selectedPostObjects = posts.filter(p => selectedPosts.includes(p.id));
  const postsWithContent = selectedPostObjects.filter(p => generatedContent[p.id]);
  const postsWithoutContent = selectedPostObjects.filter(p => !generatedContent[p.id]);

  const uploadToNotion = async () => {
    if (postsWithContent.length === 0) {
      toast.error('No generated content to upload');
      return;
    }

    setUploading(true);
    setResults(null);

    try {
      const items = postsWithContent.map(post => ({
        content: generatedContent[post.id].content,
        mediaUrl: post.mediaUrl,
        category: selectedCategory?.name || 'General',
        sourceUrl: post.permalink,
        scheduledDate: scheduledDate || null,
        redditMetadata: {
          subreddit: post.subreddit,
          score: post.score,
          numComments: post.numComments,
          author: post.author,
          createdUtc: post.createdUtc,
        },
        styleTemplate: generatedContent[post.id].templateUsed,
      }));

      const response = await notionAPI.createBatch({ items });

      setResults(response.data);

      if (response.data.succeeded.length > 0) {
        toast.success(`Uploaded ${response.data.succeeded.length} posts to Notion!`);

        // Clear selection after successful upload
        setTimeout(() => {
          clearSelection();
        }, 2000);
      }

      if (response.data.failed.length > 0) {
        toast.error(`Failed to upload ${response.data.failed.length} posts`);
      }
    } catch (error) {
      console.error('Error uploading to Notion:', error);
      toast.error('Failed to upload to Notion');
    } finally {
      setUploading(false);
    }
  };

  if (selectedPostObjects.length === 0) {
    return (
      <div className="card text-center py-12">
        <Send size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Posts Selected
        </h3>
        <p className="text-gray-600">
          Select posts and generate content before uploading to Notion
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Upload Summary</h3>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {selectedPostObjects.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Selected</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {postsWithContent.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Ready to Upload</div>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {postsWithoutContent.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Missing Content</div>
          </div>
        </div>

        {postsWithoutContent.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900">
                  {postsWithoutContent.length} post(s) don't have generated content
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  Generate content for all selected posts before uploading to Notion
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Scheduled Date */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scheduled Date (Optional)
          </label>
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="input"
          />
        </div>

        {/* Upload Button */}
        <button
          onClick={uploadToNotion}
          disabled={uploading || postsWithContent.length === 0}
          className="btn btn-primary w-full"
        >
          {uploading ? (
            <>
              <Loader size={18} className="mr-2 animate-spin" />
              Uploading to Notion...
            </>
          ) : (
            <>
              <Send size={18} className="mr-2" />
              Upload {postsWithContent.length} Post(s) to Notion
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Upload Results</h3>

          {/* Succeeded */}
          {results.succeeded.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle size={20} />
                <span className="font-medium">
                  Successfully Uploaded ({results.succeeded.length})
                </span>
              </div>

              <div className="space-y-2">
                {results.succeeded.map((result, index) => (
                  <div
                    key={index}
                    className="bg-green-50 border border-green-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        Post {result.index + 1}
                      </span>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View in Notion →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed */}
          {results.failed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <XCircle size={20} />
                <span className="font-medium">
                  Failed to Upload ({results.failed.length})
                </span>
              </div>

              <div className="space-y-2">
                {results.failed.map((result, index) => (
                  <div
                    key={index}
                    className="bg-red-50 border border-red-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        Post {result.index + 1}
                      </span>
                      <span className="text-xs text-red-600">
                        {result.error}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Post Preview List */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">
          Posts to Upload ({postsWithContent.length})
        </h3>

        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {postsWithContent.map((post, index) => (
            <div key={post.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    r/{post.subreddit} • {post.score} upvotes
                  </p>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                    {generatedContent[post.id]?.content.substring(0, 150)}...
                  </p>
                </div>

                <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
