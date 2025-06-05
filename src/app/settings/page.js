"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../../components/ui/dialog';
import { getCurrentUser, ROLES } from '../../lib/auth';
import Cookies from 'js-cookie';

const SettingsPage = () => {
  const [userRole, setUserRole] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState(ROLES.PILOT); // Default to Pilot
  const [newUserError, setNewUserError] = useState(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const router = useRouter();

  const fetchUsers = async (token) => {
    setLoadingUsers(true);
    setError(null);
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const user = await getCurrentUser();
      if (user) {
        setUserRole(user.role);
      }
      setLoadingAuth(false);

      if (user?.role === ROLES.ADMIN) {
        const idToken = Cookies.get('firebase_id_token');
        if (idToken) {
          fetchUsers(idToken);
        } else {
          setError("Authentication token not found. Please log in again.");
          setLoadingUsers(false);
        }
      } else {
        setLoadingUsers(false);
      }
    };
    fetchData();
  }, []);

  const handleAddUser = async () => {
    setNewUserError(null);
    setIsAddingUser(true);
    try {
      const idToken = Cookies.get('firebase_id_token');
      if (!idToken) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // User added successfully, refresh the list
      await fetchUsers(idToken);
      setIsAddUserDialogOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole(ROLES.PILOT); // Reset to default
    } catch (err) {
      console.error("Failed to add user:", err);
      setNewUserError(err.message || "Failed to add user.");
    } finally {
      setIsAddingUser(false);
    }
  };

  if (loadingAuth) {
    return <div className="flex justify-center items-center h-full text-xl">Loading authentication...</div>;
  }

  if (userRole !== ROLES.ADMIN) {
    router.push('/access-denied');
    return null;
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">User Management</h2>
        <Card className="p-6">
          {loadingUsers ? (
            <div className="flex justify-center items-center h-32">Loading users...</div>
          ) : error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.uid}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name || user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge
                            variant={
                              user.role === 'Administrator'
                                ? 'blue'
                                : user.role === 'Pilot'
                                ? 'purple'
                                : 'gray'
                            }
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge variant={user.status === 'Active' ? 'green' : 'red'}>
                            {user.status || 'N/A'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L15.232 5.232z"
                              />
                            </svg>
                            Edit
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Delete
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Confirm Deletion</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete user <strong>{user.email}</strong>? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDeleteUser(user.uid)}
                                  disabled={isAddingUser} // Reusing isAddingUser for general action loading
                                >
                                  {isAddingUser ? 'Deleting...' : 'Delete'}
                                </Button>
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Add New User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>
                        Enter the details for the new user.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                          Password
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                          Role
                        </Label>
                        <select
                          id="role"
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value)}
                          className="col-span-3 border rounded-md p-2"
                        >
                          {Object.values(ROLES).map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>
                      {newUserError && (
                        <p className="text-red-500 text-sm col-span-4 text-center">{newUserError}</p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddUser} disabled={isAddingUser}>
                        {isAddingUser ? 'Adding User...' : 'Add User'}
                      </Button>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </>
          )}
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">System Settings</h2>
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="appName">Application Name</Label>
              <Input id="appName" defaultValue="Drone Solutions Zimbabwe" />
            </div>
            <div>
              <Label htmlFor="defaultTimezone">Default Timezone</Label>
              {/* This would ideally be a custom select component */}
              <Input id="defaultTimezone" defaultValue="(GMT+02:00) Harare" />
            </div>
            <div>
              <Label htmlFor="caazApiKey">CAAZ API Key</Label>
              <Input id="caazApiKey" placeholder="Enter CAAZ API Key" />
            </div>
            <div>
              <Label htmlFor="notificationEmail">Notification Email Address</Label>
              <Input id="notificationEmail" defaultValue="notifications@dsz.co.zw" />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="maintenanceMode" className="form-checkbox h-4 w-4 text-blue-600" />
              <Label htmlFor="maintenanceMode">Enable Maintenance Mode</Label>
            </div>
          </div>
          <div className="mt-6">
            <Button>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Save Settings
            </Button>
          </div>
        </Card>
      </section>
    </>
  );
};

export default SettingsPage;
