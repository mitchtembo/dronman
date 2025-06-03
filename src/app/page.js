"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie'; // Import Cookies

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('firebase_id_token');
    if (token) {
      router.replace('/dashboard'); // Redirect to dashboard if authenticated
    } else {
      router.replace('/login'); // Redirect to login if not authenticated
    }
  }, [router]);

  // Optionally, render a loading spinner or message while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <p className="text-gray-700">Redirecting...</p>
    </div>
  );
}
