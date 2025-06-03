"use client"; // Add "use client" directive

import { GeistSans, GeistMono } from "geist/font"; // Updated import for Geist font
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import { usePathname } from 'next/navigation'; // Import usePathname
import { useState, useEffect } from 'react'; // Import useState and useEffect
import Cookies from 'js-cookie'; // Import Cookies

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    // Check for authentication token in cookies
    const token = Cookies.get('firebase_id_token');
    setIsAuthenticated(!!token); // Set isAuthenticated based on token presence
    setLoadingAuth(false);
  }, [pathname]); // Re-check auth status on path change

  // Determine if navigation should be shown
  const showNav = isAuthenticated && !loadingAuth &&
                  pathname !== '/login' &&
                  pathname !== '/logout' &&
                  pathname !== '/access-denied';

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased bg-gray-100">
        <div className="flex h-screen">
          {showNav && <Sidebar />} {/* Conditionally render Sidebar */}
          <div className={`flex-1 flex flex-col overflow-hidden ${showNav ? 'ml-64' : 'ml-0'}`}> {/* Adjust margin */}
            {showNav && <TopNav pageTitle="Dashboard" />} {/* Conditionally render TopNav */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
