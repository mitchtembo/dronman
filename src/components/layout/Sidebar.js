// src/components/layout/Sidebar.js
"use client"; // Required for event handlers, state, etc.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Plane, Settings, BarChart2, LogOut, ChevronLeft, ChevronRight, Bot, FileText, Map } from 'lucide-react'; // Added FileText for Reports, Map for Missions
import { useState, useEffect } from 'react';
import { getCurrentUser, ROLES } from '@/lib/auth';

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true); // New state for loading role

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = await getCurrentUser();
      setCurrentUserRole(user?.role);
      setLoadingRole(false); // Set loading to false after fetching role
    };
    fetchUserRole();
  }, []);

  const getNavItems = (role) => {
    const baseItems = [
      { href: '/dashboard', label: 'Dashboard', icon: Home, roles: [ROLES.ADMIN, ROLES.PILOT] },
      { href: '/flights', label: 'Flights', icon: Plane, roles: [ROLES.ADMIN, ROLES.PILOT] },
      { href: '/missions', label: 'Missions', icon: Map, roles: [ROLES.ADMIN, ROLES.PILOT] }, // Added Missions for Pilot
      { href: '/pilots', label: 'Pilots', icon: Users, roles: [ROLES.ADMIN] },
      { href: '/drones', label: 'Aircraft', icon: Bot, roles: [ROLES.ADMIN] },
      { href: '/compliance', label: 'Compliance', icon: BarChart2, roles: [ROLES.ADMIN, ROLES.PILOT] }, // Added Compliance for Pilot
      { href: '/reports', label: 'Reports', icon: FileText, roles: [ROLES.ADMIN] }, // Only Admin sees Reports now
      { href: '/settings', label: 'Settings', icon: Settings, roles: [ROLES.ADMIN, ROLES.PILOT] },
    ];

    if (!role) {
      return [];
    }

    return baseItems.filter(item => item.roles.includes(role));
  };

  const filteredNavItems = getNavItems(currentUserRole);

  // Render a loading state or nothing until the role is fetched
  if (loadingRole) {
    return (
      <aside className={`bg-gray-900 text-white ${isCollapsed ? 'w-20' : 'w-64'} p-4 transition-all duration-300 flex flex-col fixed h-full z-40`}>
        <div className="flex items-center justify-center h-full">
          {!isCollapsed && <p>Loading...</p>}
        </div>
      </aside>
    );
  }

  return (
    <aside className={`bg-gray-900 text-white ${isCollapsed ? 'w-20' : 'w-64'} p-4 transition-all duration-300 flex flex-col fixed h-full z-40`}>
      <div className="flex items-center justify-between mb-8">
        {!isCollapsed && (
          <Link href="/dashboard" className="text-2xl font-bold flex items-center">
            <Bot size={28} className="mr-2 text-blue-500" />
            Drone Solutions ZW
          </Link>
        )}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-400 hover:text-white">
          {isCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
      </div>
      <nav className="flex-grow">
        <ul>
          {filteredNavItems.map((item) => (
            <li key={item.label} className="mb-2">
              <Link
                href={item.href}
                className={`flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors ${
                  pathname === item.href ? 'bg-blue-600 text-white' : 'text-gray-300'
                }`}
              >
                <item.icon size={isCollapsed ? 24 : 20} className={isCollapsed ? '' : 'mr-3'} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto">
        <Link
          href="/logout"
          className="flex items-center p-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <LogOut size={isCollapsed ? 24 : 20} className={isCollapsed ? '' : 'mr-3'} />
          {!isCollapsed && <span>Logout</span>}
        </Link>
      </div>
    </aside>
  );
}
