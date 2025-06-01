import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function HomePage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to Drone Solutions Zimbabwe</h1>
      <p className="mb-2">This is the main application page. The layout should be visible with a sidebar and top navigation.</p>
      <p>Content for the actual pages will be built out progressively.</p>
      
      <div className="mt-8 p-4 border border-dashed border-gray-300 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Next Steps:</h2>
        <ul className="list-disc list-inside">
          <li>Implement actual Dashboard page at /dashboard.</li>
          <li>Develop shared UI components (Buttons, Cards, Tables).</li>
          <li>Build out individual pages as per the UI mockups.</li>
          <li>Integrate mock data and API routes.</li>
        </ul>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Component Verification:</h2>
        <Button className="mr-4">
          <Home className="mr-2 h-4 w-4" /> Test Button
        </Button>
        <p className="mt-2 text-sm text-gray-600">If you see a styled button with a home icon, shadcn/ui and Lucide React are working.</p>
      </div>
    </div>
  );
}
