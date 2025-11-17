import { useState, useEffect } from 'react';
import { settingsAPI, categoriesAPI } from '../api/client';
import { useStore } from '../store/useStore';
import { Save, TestTube, CheckCircle, XCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { categories, setCategories } = useStore();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getAll();
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const testConnections = async () => {
    setTesting(true);
    try {
      const response = await settingsAPI.testConnections();
      setTestResults(response.data);

      const allSuccess = Object.values(response.data).every(r => r.success);
      if (allSuccess) {
        toast.success('All API connections successful!');
      } else {
        toast.error('Some API connections failed');
      }
    } catch (error) {
      console.error('Error testing connections:', error);
      toast.error('Failed to test connections');
    } finally {
      setTesting(false);
    }
  };

  const toggleCategory = async (categoryId) => {
    try {
      const category = categories.find(c => c.id === categoryId);
      const updated = { ...category, enabled: !category.enabled };

      await categoriesAPI.update(categoryId, updated);

      // Update local state
      setCategories(categories.map(c => c.id === categoryId ? updated : c));

      toast.success(`${updated.name} ${updated.enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">
          Configure API credentials and category settings
        </p>
      </div>

      {/* API Connection Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">API Connections</h3>
          <button
            onClick={testConnections}
            disabled={testing}
            className="btn btn-secondary text-sm"
          >
            {testing ? (
              <>
                <Loader size={16} className="mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <TestTube size={16} className="mr-2" />
                Test Connections
              </>
            )}
          </button>
        </div>

        {testResults && (
          <div className="space-y-2">
            {Object.entries(testResults).map(([service, result]) => (
              <div
                key={service}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  result.success ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle size={20} className="text-green-600" />
                  ) : (
                    <XCircle size={20} className="text-red-600" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {service}
                    </p>
                    <p className="text-sm text-gray-600">{result.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Management */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>

        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div>
                  <p className="font-medium text-gray-900">{category.name}</p>
                  <p className="text-sm text-gray-600">
                    {category.subreddits.join(', ')}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={category.enabled}
                  onChange={() => toggleCategory(category.id)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* API Configuration Info */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-2">
          API Configuration
        </h3>
        <p className="text-sm text-gray-700 mb-4">
          API credentials are configured via environment variables in the backend.
          Update your <code className="bg-white px-2 py-0.5 rounded">.env</code> file
          and restart the server to apply changes.
        </p>

        <div className="text-xs text-gray-600 space-y-1">
          <p>• <strong>Reddit:</strong> REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET</p>
          <p>• <strong>Gemini:</strong> GEMINI_API_KEY</p>
          <p>• <strong>Notion:</strong> NOTION_API_KEY, NOTION_DATABASE_ID</p>
        </div>
      </div>
    </div>
  );
}
