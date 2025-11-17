import { useStore } from '../store/useStore';
import { Train, Plus, Edit2 } from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar() {
  const { categories, selectedCategory, setSelectedCategory } = useStore();

  const enabledCategories = categories.filter(c => c.enabled);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Categories
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {/* All Categories Option */}
        <button
          onClick={() => setSelectedCategory(null)}
          className={clsx(
            'w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors',
            selectedCategory === null
              ? 'bg-blue-50 text-blue-600 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
            <span>All Categories</span>
          </div>
        </button>

        {/* Category List */}
        {enabledCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category)}
            className={clsx(
              'w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors',
              selectedCategory?.id === category.id
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color || '#6b7280' }}
              />
              <span className="truncate">{category.name}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 truncate">
              {category.subreddits.length} subreddits
            </p>
          </button>
        ))}

        {enabledCategories.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            <Train className="mx-auto mb-2" size={32} />
            <p>No categories enabled</p>
            <p className="text-xs mt-1">Enable categories in Settings</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <button className="w-full btn btn-secondary text-sm flex items-center justify-center gap-2">
          <Plus size={16} />
          Add Category
        </button>
      </div>
    </aside>
  );
}
