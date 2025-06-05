// src/components/layout/TopNav.js
"use client";

import { Bell, UserCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCurrentUser, ROLES } from '@/lib/auth';
import Cookies from 'js-cookie'; // Import Cookies

export default function TopNav({ pageTitle = "Page Title" }) {
  const [user, setUser] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [notificationsError, setNotificationsError] = useState(null);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    setNotificationsError(null);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser); // Set user here as well

      const token = Cookies.get('firebase_id_token');
      if (!currentUser || !token) {
        setNotificationsError("Authentication required to fetch notifications.");
        setLoadingNotifications(false);
        return;
      }

      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNotifications(data.data);
      setUnreadCount(data.data.filter(n => !n.read).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setNotificationsError("Failed to load notifications.");
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Optionally, set up an interval to refresh notifications periodically
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const handleNotificationClick = async (notificationId) => {
    try {
      const token = Cookies.get('firebase_id_token');
      if (!token) throw new Error("Authentication token not found.");

      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status}`);
      }

      // Refresh notifications after marking as read
      await fetchNotifications();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  return (
    <header className="bg-white shadow-sm p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">{pageTitle}</h1>
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setNotificationsDropdownOpen(!notificationsDropdownOpen)} className="text-gray-500 hover:text-gray-700 relative p-1 rounded-full hover:bg-gray-100 transition-colors">
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>
            {notificationsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 max-h-80 overflow-y-auto">
                <div className="px-4 py-2 text-sm font-semibold border-b text-gray-800">Notifications</div>
                {loadingNotifications ? (
                  <div className="px-4 py-2 text-sm text-gray-500">Loading notifications...</div>
                ) : notificationsError ? (
                  <div className="px-4 py-2 text-sm text-red-500">{notificationsError}</div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">No new notifications.</div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.date).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User Dropdown */}
          <div className="relative">
            <button onClick={() => setUserDropdownOpen(!userDropdownOpen)} className="flex items-center text-gray-700 hover:text-blue-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
              {user?.name ? (
                <span className="h-7 w-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <UserCircle size={28} />
              )}
            </button>
            {userDropdownOpen && (
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
