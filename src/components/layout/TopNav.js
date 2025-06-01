// src/components/layout/TopNav.js
"use client";

import { Bell, UserCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCurrentUser, ROLES } from '@/lib/auth'; // Assuming auth.js is in lib

export default function TopNav({ pageTitle = "Page Title" }) {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    // In a real app, this might be fetched or come from context
    setUser(getCurrentUser());
  }, []);

  return (
    <header className="bg-white shadow-sm p-4"> {/* Removed fixed, top, right, z-30, style */}
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">{pageTitle}</h1>
        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-gray-700 relative">
            <Bell size={22} />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
          <div className="relative">
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center text-gray-700 hover:text-blue-600">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserCircle size={28} />}
              {/* <UserCircle size={28} /> */}
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                {user && (
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.role}</div>
                  </div>
                )}
                <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</a>
                <a href="/logout" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
