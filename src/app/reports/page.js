"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, ROLES } from '@/lib/auth';
import Cookies from 'js-cookie';

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setLoading(true);
        setError(null);
        const user = await getCurrentUser();
        setCurrentUser(user);

        const token = Cookies.get('firebase_id_token');

        if (!user || !token) {
          setError("Authentication required. Please log in.");
          setLoading(false);
          router.push('/login');
          return;
        }

        // Role-based access control for the page
        // Only Admin role should access this page
        if (user.role !== ROLES.ADMIN) {
          router.push('/access-denied'); // Redirect if not an Admin
          return;
        }
        setLoading(false);
      } catch (err) {
        console.error("Failed to check access for reports page:", err);
        setError("Failed to load reports. Please try again later.");
        setLoading(false);
      }
    };
    checkAccess();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-700">Loading reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // If user is not authorized, they would have been redirected by now.
  if (currentUser && currentUser.role !== ROLES.ADMIN && currentUser.role !== ROLES.VIEWER) {
    return null; // Should already be redirected
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-800">Reports</h1>
      <p className="text-gray-600">
        This page will display various reports related to drone operations.
      </p>
      {/* Add report components here */}
    </div>
  );
}
