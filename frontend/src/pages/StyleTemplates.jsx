import { useState } from 'react';
import { useStore } from '../store/useStore';
import { stylesAPI } from '../api/client';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StyleTemplates() {
  const { styleTemplates, setStyleTemplates, categories } = useStore();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    guidelines: '',
    categoryIds: [],
  });

  const handleCreate = () => {
    setCreating(true);
    setFormData({
      name: '',
      description: '',
      guidelines: '',
      categoryIds: [],
    });
  };

  const handleEdit = (template) => {
    setEditing(template.id);
    setFormData({
      name: template.name,
      description: template.description,
      guidelines: template.guidelines,
      categoryIds: template.categoryIds || [],
    });
  };

  const handleCancel = () => {
    setEditing(null);
    setCreating(false);
    setFormData({
      name: '',
      description: '',
      guidelines: '',
      categoryIds: [],
    });
  };

  const handleSave = async () => {
    try {
      if (creating) {
        const response = await stylesAPI.create(formData);
        setStyleTemplates([...styleTemplates, response.data]);
        toast.success('Template created successfully');
      } else if (editing) {
        const response = await stylesAPI.update(editing, formData);
        setStyleTemplates(
          styleTemplates.map(t => t.id === editing ? response.data : t)
        );
        toast.success('Template updated successfully');
      }
      handleCancel();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await stylesAPI.delete(id);
      setStyleTemplates(styleTemplates.filter(t => t.id !== id));
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Style Templates</h2>
          <p className="text-gray-600 mt-1">
            Manage LinkedIn post style guidelines for different categories
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="btn btn-primary"
        >
          <Plus size={18} className="mr-2" />
          New Template
        </button>
      </div>

      {/* Create/Edit Form */}
      {(creating || editing) && (
        <div className="card border-2 border-blue-500">
          <h3 className="font-semibold text-gray-900 mb-4">
            {creating ? 'Create New Template' : 'Edit Template'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="e.g., Railway Technical Style"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                placeholder="Brief description of this style"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categories (leave empty for global)
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.categoryIds.includes(cat.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            categoryIds: [...formData.categoryIds, cat.id]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            categoryIds: formData.categoryIds.filter(id => id !== cat.id)
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Style Guidelines
              </label>
              <textarea
                value={formData.guidelines}
                onChange={(e) => setFormData({ ...formData, guidelines: e.target.value })}
                className="input font-mono text-sm"
                rows={15}
                placeholder="Enter detailed style guidelines for the AI..."
              />
              <p className="text-xs text-gray-500 mt-1">
                These guidelines will be used by the AI to generate LinkedIn posts
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!formData.name || !formData.guidelines}
                className="btn btn-primary"
              >
                <Save size={16} className="mr-2" />
                Save Template
              </button>

              <button
                onClick={handleCancel}
                className="btn btn-secondary"
              >
                <X size={16} className="mr-2" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="space-y-4">
        {styleTemplates.map((template) => (
          <div key={template.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>

                  {template.categoryIds.length === 0 ? (
                    <span className="badge bg-gray-100 text-gray-700">
                      Global
                    </span>
                  ) : (
                    <div className="flex gap-1">
                      {template.categoryIds.map(catId => {
                        const category = categories.find(c => c.id === catId);
                        return category ? (
                          <span
                            key={catId}
                            className="badge"
                            style={{
                              backgroundColor: `${category.color}20`,
                              color: category.color
                            }}
                          >
                            {category.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-3">{template.description}</p>

                <details className="text-sm">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                    View Guidelines
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap font-mono text-xs text-gray-700">
                    {template.guidelines}
                  </pre>
                </details>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(template)}
                  className="btn btn-secondary text-sm"
                >
                  <Edit2 size={14} />
                </button>

                <button
                  onClick={() => handleDelete(template.id)}
                  className="btn btn-danger text-sm"
                  disabled={template.id === 'railway-default' || template.id === 'global'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {styleTemplates.length === 0 && !creating && (
        <div className="card text-center py-12">
          <p className="text-gray-600">No style templates yet. Create your first template to get started.</p>
        </div>
      )}
    </div>
  );
}
