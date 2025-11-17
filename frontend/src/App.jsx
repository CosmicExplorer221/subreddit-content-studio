import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { categoriesAPI, stylesAPI, settingsAPI } from './api/client';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import StyleTemplates from './pages/StyleTemplates';
import toast from 'react-hot-toast';

function App() {
  const { setCategories, setStyleTemplates, setSettings } = useStore();

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      try {
        const [categoriesRes, stylesRes, settingsRes] = await Promise.all([
          categoriesAPI.getAll(),
          stylesAPI.getAll(),
          settingsAPI.getAll(),
        ]);

        setCategories(categoriesRes.data);
        setStyleTemplates(stylesRes.data);
        setSettings(settingsRes.data);
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Failed to load initial data. Please check your backend connection.');
      }
    };

    loadData();
  }, [setCategories, setStyleTemplates, setSettings]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="settings" element={<Settings />} />
        <Route path="templates" element={<StyleTemplates />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
