"use client"
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@lib/firebase';

interface NewsItem {
  id: string;
  text: string;
  link?: string;
  order: number;
  createdAt?: string;
}

const LatestNews = () => {
  const [showNews, setShowNews] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newItem, setNewItem] = useState({ text: '', link: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Firebase references
  const websiteConfigRef = doc(db, 'website_config', 'latest_news_config');
  const newsItemsRef = collection(db, 'website_config', 'latest_news_config', 'items');

  // Fetch initial data and set up real-time listener
  useEffect(() => {
    const unsubscribeConfig = onSnapshot(websiteConfigRef, (doc) => {
      if (doc.exists()) {
        setShowNews(doc.data().showNews || false);
      } else {
        // Initialize if document doesn't exist
        setDoc(websiteConfigRef, { showNews: false });
      }
    });

    const unsubscribeItems = onSnapshot(newsItemsRef, (snapshot) => {
      const items = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        text: doc.data().text,
        link: doc.data().link || '',
        order: doc.data().order || 0,
        createdAt: doc.data().createdAt
      }));
      // Sort items by order
      setNewsItems(items.sort((a, b) => a.order - b.order));
      setIsLoading(false);
    });

    return () => {
      unsubscribeConfig();
      unsubscribeItems();
    };
  }, []);

  const handleToggle = async () => {
    const newValue = !showNews;
    setShowNews(newValue);
    await updateDoc(websiteConfigRef, { showNews: newValue });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!newItem.text.trim()) {
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingId) {
        const itemRef = doc(newsItemsRef, editingId);
        await updateDoc(itemRef, {
          text: newItem.text,
          link: newItem.link || ''
        });
      } else {
        const newItemRef = doc(newsItemsRef);
        await setDoc(newItemRef, {
          text: newItem.text,
          link: newItem.link || '',
          order: newsItems.length,
          createdAt: new Date().toISOString()
        });
      }
      setNewItem({ text: '', link: '' });
      setEditingId(null);
    } catch (error) {
      console.error('Error saving news item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (id: string) => {
    const itemToEdit = newsItems.find(item => item.id === id);
    if (itemToEdit) {
      setNewItem({ text: itemToEdit.text, link: itemToEdit.link || '' });
      setEditingId(id);
    }
  };

  const deleteNewsItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this news item?')) {
      try {
        await deleteDoc(doc(newsItemsRef, id));
        // Update order for remaining items
        const remainingItems = newsItems.filter(item => item.id !== id);
        await updateOrderIndexes(remainingItems);
      } catch (error) {
        console.error('Error deleting news item:', error);
      }
    }
  };

  const updateOrderIndexes = async (items: NewsItem[]) => {
    const batch = writeBatch(db);
    items.forEach((item, index) => {
      const itemRef = doc(newsItemsRef, item.id);
      batch.update(itemRef, { order: index });
    });
    
    try {
      await batch.commit();
    } catch (error) {
      console.error('Error updating order indexes:', error);
    }
  };

  const cancelEditing = () => {
    setNewItem({ text: '', link: '' });
    setEditingId(null);
  };

  return (
    <div className="">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-gray-800">Latest News Management</h2>
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={showNews}
              onChange={handleToggle}
            />
            <div className={`block w-14 h-8 rounded-full ${showNews ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${showNews ? 'transform translate-x-6' : ''}`}></div>
          </div>
          <div className="ml-3 text-gray-700 font-medium">
            {showNews ? 'News Visible' : 'News Hidden'}
          </div>
        </label>
      </div>

      {showNews && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingId ? 'Edit News Item' : 'Add New News Item'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-1">
                  News Text *
                </label>
                <input
                  type="text"
                  id="text"
                  name="text"
                  value={newItem.text}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter news text"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
                  Link (optional)
                </label>
                <input
                  type="url"
                  id="link"
                  name="link"
                  value={newItem.link}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-md text-white ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingId ? 'Updating...' : 'Adding...'}
                    </span>
                  ) : (
                    editingId ? 'Update News' : 'Add News'
                  )}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Current News Items</h3>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : newsItems.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No news items added yet</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {newsItems.map((item) => (
                  <li
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center">
                        <div>
                          {item.link ? (
                            <a 
                              href={item.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {item.text}
                            </a>
                          ) : (
                            <span className="text-gray-800">{item.text}</span>
                          )}
                          {item.link && (
                            <span className="ml-2 text-xs text-gray-500">
                              (link: {new URL(item.link).hostname})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditing(item.id)}
                          className="px-3 py-1 text-sm text-white bg-yellow-500 rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteNewsItem(item.id)}
                          className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LatestNews;