import { GeistSans, GeistMono } from "geist/font"; // Updated import for Geist font
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";

// const geistSans = Geist({ // Original Geist import, geist/font is preferred
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({ // Original Geist import
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata = {
  title: "Drone Solutions Zimbabwe - Management System",
  description: "Comprehensive Drone Pilot Management System for Drone Solutions Zimbabwe.",
};

export default function RootLayout({ children }) {
  // Note: Dynamic sidebar width for TopNav and main content
  // will require client-side state management, possibly via Context,
  // if Sidebar's collapsed state needs to affect TopNav's left margin
  // and main content's padding-left directly from here.
  // For now, Sidebar is fixed and main content will have a fixed ml.
  // TopNav's style `left: 'var(--sidebar-width, 256px)'` will use 256px (w-64).
  // A more robust solution would involve a shared state for sidebar collapse.

  // const sidebarWidthExpanded = "w-64"; // Corresponds to 256px
  // const sidebarWidthCollapsed = "w-20"; // Corresponds to 80px
  // This dynamic width adjustment will be handled later, likely with Context API

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased bg-gray-100">
        <div className="flex h-screen">
          <Sidebar /> {/* Sidebar is fixed position, w-64 or w-20 */}
          {/* Main content area needs to have a margin-left that matches the sidebar width */}
          {/* This margin will need to change to ml-20 when sidebar is collapsed */}
          <div className="flex-1 flex flex-col overflow-hidden ml-64"> {/* Default margin for expanded sidebar (w-64) */}
            <TopNav pageTitle="Dashboard" /> {/* Placeholder title, TopNav is not fixed for now */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
