import { GET, POST, PUT, DELETE } from '@/app/api/users/route';
import { withAuth } from '@/lib/authMiddleware';
import { db, auth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { mock } from 'jest-mock-extended';

// Mock firebase-admin
jest.mock('@/lib/firebaseAdmin', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn((uid) => ({
        get: jest.fn(() => {
          if (uid === 'admin-uid') {
            return { exists: true, data: () => ({ uid: 'admin-uid', email: 'admin@example.com', role: 'Administrator' }) };
          }
          if (uid === 'pilot-uid') {
            return { exists: true, data: () => ({ uid: 'pilot-uid', email: 'pilot@example.com', role: 'Pilot', pilotId: 'pilot-doc-id' }) };
          }
          return { exists: false };
        }),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      where: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn(() => ({
            empty: true,
            docs: [],
          })),
        })),
      })),
      get: jest.fn(() => ({
        docs: [
          { id: 'admin-uid', data: () => ({ uid: 'admin-uid', email: 'admin@example.com', role: 'Administrator' }) },
          { id: 'pilot-uid', data: () => ({ uid: 'pilot-uid', email: 'pilot@example.com', role: 'Pilot', pilotId: 'pilot-doc-id' }) },
        ],
      })),
    })),
  },
  auth: {
    verifyIdToken: jest.fn((token) => {
      if (token === 'valid-admin-token') {
        return Promise.resolve({ uid: 'admin-uid', email: 'admin@example.com' });
      }
      if (token === 'valid-pilot-token') {
        return Promise.resolve({ uid: 'pilot-uid', email: 'pilot@example.com' });
      }
      return Promise.reject(new Error('Invalid token'));
    }),
    createUser: jest.fn(() => Promise.resolve({ uid: 'new-user-uid', email: 'new@example.com' })),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  },
}));

// Mock NextResponse for API route responses
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

// Mock console.error to prevent test logs from cluttering output
console.error = jest.fn();

describe('Users API Routes', () => {
  let mockRequest;
  let mockContext;

  beforeEach(() => {
    jest.clearAllMocks();
    // Use jest-mock-extended for Request and Headers
    mockRequest = mock({
      headers: mock(),
      json: jest.fn(),
      url: 'http://localhost/api/users',
    });
    mockContext = {};
  });

  // Helper to simulate authenticated requests
  const simulateAuthRequest = (role, uid, pilotId = null) => {
    if (role === 'Administrator') {
      mockRequest.headers.get.mockReturnValueOnce('Bearer valid-admin-token');
    } else if (role === 'Pilot') {
      mockRequest.headers.get.mockReturnValueOnce('Bearer valid-pilot-token');
    }
    // Mock the request.user object that withAuth middleware would attach
    mockRequest.user = { uid, email: `${role}@example.com`, role, pilotId };
  };

  describe('GET /api/users', () => {
    test('should return all users for an Administrator', async () => {
      simulateAuthRequest('Administrator', 'admin-uid');
      const response = await GET(mockRequest, mockContext);

      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveLength(2);
      expect(response.data.data[0].role).toBe('Administrator');
      expect(response.data.data[1].role).toBe('Pilot');
    });

    test('should return 403 Forbidden for a Pilot trying to get all users', async () => {
      simulateAuthRequest('Pilot', 'pilot-uid');
      const response = await GET(mockRequest, mockContext);

      expect(response.options.status).toBe(403);
      expect(response.data.error).toBe('Forbidden: You do not have the necessary permissions');
    });

    test('should return a specific user by UID for an Administrator', async () => {
      simulateAuthRequest('Administrator', 'admin-uid');
      mockRequest.url = 'http://localhost/api/users?uid=pilot-uid';
      const response = await GET(mockRequest, mockContext);

      expect(response.data.success).toBe(true);
      expect(response.data.data.uid).toBe('pilot-uid');
      expect(response.data.data.role).toBe('Pilot');
    });

    test('should return 404 if user not found by UID', async () => {
      simulateAuthRequest('Administrator', 'admin-uid');
      mockRequest.url = 'http://localhost/api/users?uid=nonexistent-uid';
      db.collection().doc().get.mockResolvedValueOnce({ exists: false }); // Mock specific call
      const response = await GET(mockRequest, mockContext);

      expect(response.options.status).toBe(404);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toBe('User not found');
    });
  });

  describe('POST /api/users', () => {
    test('should create a new user for an Administrator', async () => {
      simulateAuthRequest('Administrator', 'admin-uid');
      mockRequest.json.mockResolvedValueOnce({
        email: 'newuser@example.com',
        password: 'password123',
        role: 'Viewer',
        pilotId: null,
      });

      const response = await POST(mockRequest, mockContext);

      expect(auth.createUser).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      });
      expect(db.collection().doc().set).toHaveBeenCalledWith({
        uid: 'new-user-uid',
        email: 'newuser@example.com',
        role: 'Viewer',
        pilotId: null,
      });
      expect(response.options.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.email).toBe('newuser@example.com');
    });

    test('should return 403 Forbidden for a Pilot trying to create a user', async () => {
      simulateAuthRequest('Pilot', 'pilot-uid');
      mockRequest.json.mockResolvedValueOnce({
        userId: 'some-user-uid',
        name: 'Another Pilot',
      });
      const response = await POST(mockRequest, mockContext);

      expect(response.options.status).toBe(403);
      expect(response.data.error).toBe('Forbidden: You do not have the necessary permissions');
    });
  });

  describe('PUT /api/users', () => {
    test('should update a user for an Administrator', async () => {
      simulateAuthRequest('Administrator', 'admin-uid');
      mockRequest.url = 'http://localhost/api/users?uid=pilot-uid';
      mockRequest.json.mockResolvedValueOnce({
        role: 'Administrator',
      });

      const response = await PUT(mockRequest, mockContext);

      expect(db.collection().doc().update).toHaveBeenCalledWith({ role: 'Administrator' });
      expect(response.data.success).toBe(true);
      expect(response.data.data.role).toBe('Administrator');
    });

    test('should return 403 Forbidden for a Pilot trying to update a user', async () => {
      simulateAuthRequest('Pilot', 'pilot-uid');
      mockRequest.url = 'http://localhost/api/users?uid=another-uid';
      mockRequest.json.mockResolvedValueOnce({
        role: 'Administrator',
      });
      const response = await PUT(mockRequest, mockContext);

      expect(response.options.status).toBe(403);
      expect(response.data.error).toBe('Forbidden: You do not have the necessary permissions');
    });
  });

  describe('DELETE /api/users', () => {
    test('should delete a user for an Administrator', async () => {
      simulateAuthRequest('Administrator', 'admin-uid');
      mockRequest.url = 'http://localhost/api/users?uid=pilot-uid';

      const response = await DELETE(mockRequest, mockContext);

      expect(auth.deleteUser).toHaveBeenCalledWith('pilot-uid');
      expect(db.collection().doc().delete).toHaveBeenCalledWith();
      expect(response.options.status).toBe(204);
    });

    test('should return 403 Forbidden for a Pilot trying to delete a user', async () => {
      simulateAuthRequest('Pilot', 'pilot-uid');
      mockRequest.url = 'http://localhost/api/users?uid=another-uid';
      const response = await DELETE(mockRequest, mockContext);

      expect(response.options.status).toBe(403);
      expect(response.data.error).toBe('Forbidden: You do not have the necessary permissions');
    });
  });
});
