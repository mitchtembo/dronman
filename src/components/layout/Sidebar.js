// src/components/layout/Sidebar.js
"use client"; // Required for event handlers, state, etc.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Plane, Settings, BarChart2, LogOut, ChevronLeft, ChevronRight, Bot } from 'lucide-react'; // Assuming Bot for drone icon
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/pilots', label: 'Pilots', icon: Users },
  { href: '/flights', label: 'Flights', icon: Plane },
  { href: '/drones', label: 'Drones/Aircraft', icon: Bot }, // Using Bot as a placeholder for drone
  { href: '/compliance', label: 'Compliance', icon: BarChart2 }, // Using BarChart2 as placeholder
  { href: '/reports', label: 'Reports', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`bg-gray-900 text-white ${isCollapsed ? 'w-20' : 'w-64'} p-4 transition-all duration-300 flex flex-col fixed h-full z-40`}>
      <div className="flex items-center justify-between mb-8">
        {!isCollapsed && (
          <Link href="/dashboard" className="text-2xl font-bold flex items-center">
            <Bot size={28} className="mr-2 text-blue-500" /> {/* Drone Icon */}
            Drone Solutions ZW
          </Link>
        )}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-400 hover:text-white">
          {isCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
      </div>
      <nav className="flex-grow">
        <ul>
          {navItems.map((item) => (
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
          href="/logout" // Placeholder, actual logout handled by auth logic
          className="flex items-center p-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <LogOut size={isCollapsed ? 24 : 20} className={isCollapsed ? '' : 'mr-3'} />
          {!isCollapsed && <span>Logout</span>}
        </Link>
      </div>
    </aside>
  );
}
