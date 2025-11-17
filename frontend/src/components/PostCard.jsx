import { useState } from 'react';
import { ExternalLink, MessageCircle, TrendingUp, CheckCircle2, Image, Video } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

export default function PostCard({ post, isSelected, onToggleSelect }) {
  const [imageError, setImageError] = useState(false);

  const formattedDate = formatDistanceToNow(new Date(post.createdUtc * 1000), { addSuffix: true });

  return (
    <div
      className={clsx(
        'card cursor-pointer transition-all duration-200 hover:shadow-md relative',
        isSelected && 'ring-2 ring-blue-500'
      )}
      onClick={onToggleSelect}
    >
      {/* Selection Indicator */}
      <div className="absolute top-2 right-2 z-10">
        <div
          className={clsx(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
            isSelected
              ? 'bg-blue-600 border-blue-600'
              : 'bg-white border-gray-300'
          )}
        >
          {isSelected && <CheckCircle2 size={16} className="text-white" />}
        </div>
      </div>

      {/* Thumbnail */}
      <div className="relative w-full h-48 bg-gray-200 rounded-lg mb-3 overflow-hidden">
        {post.thumbnail && !imageError ? (
          <img
            src={post.thumbnail}
            alt={post.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {post.postType === 'video' ? (
              <Video size={48} className="text-gray-400" />
            ) : (
              <Image size={48} className="text-gray-400" />
            )}
          </div>
        )}

        {/* Post Type Badge */}
        <div className="absolute bottom-2 left-2">
          <span className={clsx(
            'badge text-white text-xs',
            post.postType === 'video' ? 'bg-purple-600' : 'bg-blue-600'
          )}>
            {post.postType === 'video' ? (
              <><Video size={12} className="mr-1" /> Video</>
            ) : (
              <><Image size={12} className="mr-1" /> Image</>
            )}
          </span>
        </div>
      </div>

      {/* Content */}
      <div>
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 text-sm">
          {post.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span className="badge bg-gray-100 text-gray-700">
            r/{post.subreddit}
          </span>
          <span>{formattedDate}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <TrendingUp size={14} />
              <span>{post.score.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle size={14} />
              <span>{post.numComments}</span>
            </div>
          </div>

          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
