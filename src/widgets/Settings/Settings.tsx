"use client"
import Titlebar from "@components/TitleBar";
import React, { useState, useEffect } from "react";
import { Switch } from "@headlessui/react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@lib/firebase";
import easyToast from "@components/CustomToast";

type MenuItem = {
  title: string;
  url: string;
  children?: MenuItem[];
};

type WebsiteConfig = {
  showTopbar: boolean;
  showNews: boolean;
  navItems: MenuItem[];
};

const DEFAULT_CONFIG: WebsiteConfig = {
  showTopbar: true,
  showNews: false,
  navItems: [
    { title: "Home", url: "/" },
    { 
      title: "About", 
      url: "/about", 
      children: [
        { title: "Team", url: "/about/team" },
        { title: "History", url: "/about/history" }
      ]
    },
    { title: "Contact", url: "/contact" }
  ]
};

export default function Settings() {
  const [settings, setSettings] = useState<WebsiteConfig>(DEFAULT_CONFIG);
  const [newMenuItem, setNewMenuItem] = useState({
    title: "",
    url: "",
    isSubmenu: false,
    parentIndex: -1
  });
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Load or initialize configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const docRef = doc(db, "website_config", "settings");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as WebsiteConfig;
          setSettings(data);
          easyToast({
            type: "success",
            message: "Configuration loaded successfully",
            
          });
          console.log("Loaded config:", data);
        } else {
          await setDoc(docRef, DEFAULT_CONFIG);
          setSettings(DEFAULT_CONFIG);
          easyToast({
            type: "info",
            message: "Created new configuration",
            
          });
          console.log("Created new config:", DEFAULT_CONFIG);
        }
      } catch (error) {
        console.error("Error loading config:", error);
        easyToast({
          type: "error",
          message: "Failed to load configuration",
  
        });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Save configuration
  const saveConfig = async () => {
    try {
      easyToast({
        type: "info",
        message: "Saving configuration...",
        
      });

      const docRef = doc(db, "website_config", "settings");
      await setDoc(docRef, settings);
      
      easyToast({
        type: "success",
        message: "Configuration saved!",

      });
      console.log("Saved config:", settings);
    } catch (error) {
      console.error("Error saving config:", error);
      easyToast({
        type: "error",
        message: "Failed to save configuration",

      });
    }
  };

  const toggleTopbar = () => {
    const newValue = !settings.showTopbar;
    setSettings({ ...settings, showTopbar: newValue });
    console.log(`Topbar: ${newValue}`);
  };

  const toggleNews = () => {
    const newValue = !settings.showNews;
    setSettings({ ...settings, showNews: newValue });
    console.log(`News: ${newValue}`);
  };

  const toggleExpand = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  const addMenuItem = () => {
    if (!newMenuItem.title.trim()) {
      easyToast({
        type: "info",
        message: "Please enter a title",
        
      });
      return;
    }

    const item = {
      title: newMenuItem.title.trim(),
      url: newMenuItem.url.trim() || "#",
    };

    let updatedItems = [...settings.navItems];
    let message = "";

    if (newMenuItem.isSubmenu && newMenuItem.parentIndex >= 0) {
      const parent = updatedItems[newMenuItem.parentIndex];
      if (!parent.children) parent.children = [];
      parent.children.push(item);
      message = `Added "${item.title}" under "${parent.title}"`;
    } else {
      updatedItems.push(item);
      message = `Added "${item.title}" to menu`;
    }

    setSettings({ ...settings, navItems: updatedItems });
    setNewMenuItem({ title: "", url: "", isSubmenu: false, parentIndex: -1 });
    
    easyToast({
      type: "success",
      message,
      
    });
    console.log("Added item:", item);
  };

  const removeMenuItem = (path: number[]) => {
    let updatedItems = [...settings.navItems];
    let itemToRemove = updatedItems;
    let itemName = "";

    for (let i = 0; i < path.length - 1; i++) {
      itemToRemove = itemToRemove[path[i]].children || [];
    }

    itemName = itemToRemove[path[path.length - 1]].title;
    itemToRemove.splice(path[path.length - 1], 1);

    setSettings({ ...settings, navItems: updatedItems });
    
    easyToast({
      type: "info",
      message: `Removed "${itemName}"`,
      
    });
    console.log("Removed item:", itemName);
  };

  const renderMenuItems = (items: MenuItem[], path: number[] = []) => {
    return items.map((item, index) => {
      const currentPath = [...path, index];
      const hasChildren = item.children && item.children.length > 0;
      
      return (
        <li key={index} className="ml-4">
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <div>
              <span className="font-medium">{item.title}</span>
              <span className="text-xs text-gray-500 ml-2">{item.url}</span>
            </div>
            <div className="flex space-x-2">
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(index)}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  {expandedItems.includes(index) ? "Collapse" : "Expand"}
                </button>
              )}
              <button
                onClick={() => removeMenuItem(currentPath)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          </div>
          
          {hasChildren && expandedItems.includes(index) && (
            <ul className="mt-2 space-y-2">
              {renderMenuItems(item.children!, currentPath)}
            </ul>
          )}
        </li>
      );
    });
  };

  if (loading) {
    return (
      <div className="p-4">
        <Titlebar title="Settings" />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 w-full min-h-screen">
      <Titlebar title="Settings" />
      
      <div className="space-y-6 mt-6">
        <div className="flex justify-end fixed bottom-6 right-6">
          <button
            onClick={saveConfig}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Save Configuration
          </button>
        </div>

        {/* Topbar Toggle */}
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
          <div>
            <h3 className="font-medium">Topbar</h3>
            <p className="text-sm text-gray-500">Show or hide the topbar</p>
          </div>
          <Switch
            checked={settings.showTopbar}
            onChange={toggleTopbar}
            className={`${
              settings.showTopbar ? "bg-primary" : "bg-gray-200"
            } relative inline-flex h-6 w-11 items-center rounded-full`}
          >
            <span
              className={`${
                settings.showTopbar ? "translate-x-6" : "translate-x-1"
              } inline-block h-4 w-4 transform rounded-full bg-white transition`}
            />
          </Switch>
        </div>

        {/* News Toggle */}
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
          <div>
            <h3 className="font-medium">News</h3>
            <p className="text-sm text-gray-500">Enable or disable news section</p>
          </div>
          <Switch
            checked={settings.showNews}
            onChange={toggleNews}
            className={`${
              settings.showNews ? "bg-primary" : "bg-gray-200"
            } relative inline-flex h-6 w-11 items-center rounded-full`}
          >
            <span
              className={`${
                settings.showNews ? "translate-x-6" : "translate-x-1"
              } inline-block h-4 w-4 transform rounded-full bg-white transition`}
            />
          </Switch>
        </div>

        {/* Navigation Menu */}
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-medium mb-4">Navigation Menu</h3>
          
          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newMenuItem.title}
                  onChange={(e) => setNewMenuItem({...newMenuItem, title: e.target.value})}
                  placeholder="Menu item text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="text"
                  value={newMenuItem.url}
                  onChange={(e) => setNewMenuItem({...newMenuItem, url: e.target.value})}
                  placeholder="/path"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isSubmenu"
                  checked={newMenuItem.isSubmenu}
                  onChange={(e) => setNewMenuItem({...newMenuItem, isSubmenu: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isSubmenu" className="ml-2 block text-sm text-gray-700">
                  Add as submenu
                </label>
              </div>
              
              {newMenuItem.isSubmenu && (
                <div className="flex-1">
                  <select
                    value={newMenuItem.parentIndex}
                    onChange={(e) => setNewMenuItem({...newMenuItem, parentIndex: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={-1}>Select parent menu</option>
                    {settings.navItems.map((item, index) => (
                      <option key={index} value={index}>{item.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <button
              onClick={addMenuItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Menu Item
            </button>
          </div>

          <ul className="space-y-2">
            {renderMenuItems(settings.navItems)}
          </ul>
        </div>
      </div>
    </div>
  );
}