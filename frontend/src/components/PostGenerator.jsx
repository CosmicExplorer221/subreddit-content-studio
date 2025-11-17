import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { redditAPI, geminiAPI, stylesAPI, postsAPI } from '../api/client';
import { Sparkles, RefreshCw, Edit2, Check, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PostGenerator() {
  const {
    posts,
    selectedPosts,
    selectedCategory,
    styleTemplates,
    generatedContent,
    setGeneratedContent,
  } = useStore();

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [editMode, setEditMode] = useState({});

  const selectedPostObjects = posts.filter(p => selectedPosts.includes(p.id));
  const currentPost = selectedPostObjects[currentPostIndex];

  useEffect(() => {
    // Load templates for selected category
    if (selectedCategory) {
      const categoryTemplates = styleTemplates.filter(
        t => t.categoryIds.includes(selectedCategory.id) || t.categoryIds.length === 0
      );

      if (categoryTemplates.length > 0) {
        const defaultTemplate = categoryTemplates.find(
          t => t.id === selectedCategory.defaultStyleTemplate
        ) || categoryTemplates[0];

        setSelectedTemplate(defaultTemplate);
      }
    }
  }, [selectedCategory, styleTemplates]);

  const generateContent = async (post) => {
    if (!selectedTemplate) {
      toast.error('Please select a style template');
      return;
    }

    setGenerating(true);
    try {
      // Fetch comments for context
      const commentsResponse = await redditAPI.fetchComments(post.id, 15);

      const context = {
        postTitle: post.title,
        postUrl: post.permalink,
        subreddit: post.subreddit,
        postDescription: post.selftext || '',
        topComments: commentsResponse.data.comments,
        category: selectedCategory?.name || 'Engineering',
      };

      const response = await geminiAPI.generate({
        context,
        styleGuidelines: selectedTemplate.guidelines,
      });

      setGeneratedContent(post.id, {
        content: response.data.content,
        wordCount: response.data.wordCount,
        model: response.data.model,
        templateUsed: selectedTemplate.id,
        timestamp: Date.now(),
      });

      // Save to database
      await postsAPI.saveGenerated(post.id, {
        content: response.data.content,
        styleTemplateId: selectedTemplate.id,
        modelUsed: response.data.model,
        generationParams: { context },
        isEdited: false,
      });

      toast.success('Content generated successfully!');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  const regenerateContent = async () => {
    if (!currentPost) return;
    await generateContent(currentPost);
  };

  const generateAll = async () => {
    setGenerating(true);
    let successCount = 0;

    for (let i = 0; i < selectedPostObjects.length; i++) {
      setCurrentPostIndex(i);
      try {
        await generateContent(selectedPostObjects[i]);
        successCount++;
      } catch (error) {
        console.error('Error generating for post:', selectedPostObjects[i].id);
      }
    }

    setGenerating(false);
    toast.success(`Generated content for ${successCount}/${selectedPostObjects.length} posts`);
  };

  const handleEdit = (postId, newContent) => {
    setGeneratedContent(postId, {
      ...generatedContent[postId],
      content: newContent,
      isEdited: true,
    });
  };

  const toggleEditMode = (postId) => {
    setEditMode(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  if (selectedPostObjects.length === 0) {
    return (
      <div className="card text-center py-12">
        <Sparkles size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Posts Selected
        </h3>
        <p className="text-gray-600">
          Select posts from the Browse tab to generate LinkedIn content
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Style Template
              </label>
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => {
                  const template = styleTemplates.find(t => t.id === e.target.value);
                  setSelectedTemplate(template);
                }}
                className="input text-sm py-1.5 min-w-[250px]"
              >
                {styleTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-600 mt-6">
              Post {currentPostIndex + 1} of {selectedPostObjects.length}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={generateAll}
              disabled={generating}
              className="btn btn-primary"
            >
              {generating ? (
                <>
                  <Loader size={16} className="mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Generate All
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Current Post */}
      {currentPost && (
        <div className="grid grid-cols-2 gap-6">
          {/* Source Post */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Source Post</h3>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Title</p>
                <p className="text-sm text-gray-900 mt-1">{currentPost.title}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Subreddit</p>
                <p className="text-sm text-gray-900 mt-1">r/{currentPost.subreddit}</p>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{currentPost.score} upvotes</span>
                <span>{currentPost.numComments} comments</span>
              </div>

              {currentPost.thumbnail && (
                <img
                  src={currentPost.thumbnail}
                  alt={currentPost.title}
                  className="w-full rounded-lg"
                />
              )}

              <a
                href={currentPost.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                View on Reddit →
              </a>
            </div>
          </div>

          {/* Generated Content */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Generated LinkedIn Post</h3>

              <div className="flex gap-2">
                {generatedContent[currentPost.id] && (
                  <>
                    <button
                      onClick={() => toggleEditMode(currentPost.id)}
                      className="btn btn-secondary text-sm"
                    >
                      {editMode[currentPost.id] ? (
                        <><Check size={14} className="mr-1" /> Save</>
                      ) : (
                        <><Edit2 size={14} className="mr-1" /> Edit</>
                      )}
                    </button>
                    <button
                      onClick={regenerateContent}
                      disabled={generating}
                      className="btn btn-secondary text-sm"
                    >
                      <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {generatedContent[currentPost.id] ? (
              <div className="space-y-3">
                {editMode[currentPost.id] ? (
                  <textarea
                    value={generatedContent[currentPost.id].content}
                    onChange={(e) => handleEdit(currentPost.id, e.target.value)}
                    className="input font-mono text-sm min-h-[300px]"
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-900">
                      {generatedContent[currentPost.id].content}
                    </pre>
                  </div>
                )}

                <div className="text-xs text-gray-500 flex items-center justify-between">
                  <span>{generatedContent[currentPost.id].wordCount} words</span>
                  {generatedContent[currentPost.id].isEdited && (
                    <span className="badge bg-yellow-100 text-yellow-700">Edited</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <button
                  onClick={() => generateContent(currentPost)}
                  disabled={generating}
                  className="btn btn-primary"
                >
                  {generating ? (
                    <>
                      <Loader size={16} className="mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="mr-2" />
                      Generate Content
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      {selectedPostObjects.length > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPostIndex(Math.max(0, currentPostIndex - 1))}
            disabled={currentPostIndex === 0}
            className="btn btn-secondary"
          >
            ← Previous
          </button>

          <span className="text-sm text-gray-600">
            {currentPostIndex + 1} / {selectedPostObjects.length}
          </span>

          <button
            onClick={() => setCurrentPostIndex(Math.min(selectedPostObjects.length - 1, currentPostIndex + 1))}
            disabled={currentPostIndex === selectedPostObjects.length - 1}
            className="btn btn-secondary"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
