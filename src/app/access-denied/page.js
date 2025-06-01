import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccessDeniedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl text-red-600">Access Denied</CardTitle>
          <CardDescription>
            You do not have the necessary permissions to view this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-gray-700">
            Please contact your administrator if you believe this is an error.
          </p>
          <Link href="/dashboard" passHref>
            <Button>Go to Dashboard</Button>
          </Link>
          <Link href="/login" passHref>
            <Button variant="outline" className="ml-4">Login Page</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
