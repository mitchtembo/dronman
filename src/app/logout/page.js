"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth'; // Import the logout function

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      await logout(); // Call the logout function
      router.push('/login'); // Redirect to login page after logout
    };

    performLogout();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <p className="text-gray-700">Logging out...</p>
    </div>
  );
}
