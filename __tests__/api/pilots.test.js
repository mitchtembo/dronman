import { GET, POST, PUT, DELETE } from '@/app/api/pilots/route';
import { withAuth } from '@/lib/authMiddleware';
import { db } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { mock } from 'jest-mock-extended';

// Mock firebase-admin
jest.mock('@/lib/firebaseAdmin', () => ({
  db: {
    collection: jest.fn((collectionName) => ({
      doc: jest.fn((docId) => ({
        get: jest.fn(() => {
          if (collectionName === 'pilots') {
            if (docId === 'pilot-doc-id') {
              return { exists: true, data: () => ({ id: 'pilot-doc-id', userId: 'pilot-uid', name: 'Test Pilot' }) };
            }
            return { exists: false };
          }
          if (collectionName === 'users') {
            if (docId === 'admin-uid') {
              return { exists: true, data: () => ({ uid: 'admin-uid', email: 'admin@example.com', role: 'Administrator' }) };
            }
            if (docId === 'pilot-uid') {
              return { exists: true, data: () => ({ uid: 'pilot-uid', email: 'pilot@example.com', role: 'Pilot', pilotId: 'pilot-doc-id' }) };
            }
            return { exists: false };
          }
          return { exists: false };
        }),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      add: jest.fn(() => Promise.resolve({ id: 'new-pilot-doc-id' })),
      get: jest.fn(() => {
        if (collectionName === 'pilots') {
          return {
            docs: [
              { id: 'pilot-doc-id-1', data: () => ({ userId: 'user-uid-1', name: 'Pilot One' }) },
              { id: 'pilot-doc-id-2', data: () => ({ userId: 'user-uid-2', name: 'Pilot Two' }) },
            ],
          };
        }
        return { docs: [] };
      }),
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
  },
}));

// Mock NextResponse for API route responses
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

// Mock console.log and console.error to prevent test logs from cluttering output
console.log = jest.fn();
console.error = jest.fn();

describe('Pilots API Routes', () => {
  let mockRequest;
  let mockContext;

  beforeEach(() => {
    jest.clearAllMocks();
    // Use jest-mock-extended for Request and Headers
    mockRequest = mock({
      headers: mock(),
      json: jest.fn(),
      url: 'http://localhost/api/pilots',
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
    mockRequest.user = { uid, email: `${role}@example.com`, role, pilotId };
  };

  describe('GET /api/pilots', () => {
    test('should return all pilots for an Administrator', async () => {
      simulateAuthRequest('Administrator', 'admin-uid');
      const response = await GET(mockRequest, mockContext);

      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveLength(2);
      expect(response.data.data[0].name).toBe('Pilot One');
    });

    test('should return all pilots for a Pilot', async () => {
      simulateAuthRequest('Pilot', 'pilot-uid');
      const response = await GET(mockRequest, mockContext);

      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveLength(2);
    });

    test('should return a specific pilot by ID for an Administrator', async () => {
      simulateAuthRequest('Administrator', 'admin-uid');
      mockRequest.url = 'http://localhost/api/pilots?id=pilot-doc-id';
      const response = await GET(mockRequest, mockContext);

      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBe('pilot-doc-id');
      expect(response.data.data.name).toBe('Test Pilot');
    });

    test('should return 404 if pilot not found by ID', async () => {
      simulateAuthRequest('Administrator', 'admin-uid');
      mockRequest.url = 'http://localhost/api/pilots?id=nonexistent-id';
      db.collection().doc().get.mockResolvedValueOnce({ exists: false }); // Mock specific call
      const response = await GET(mockRequest, mockContext);

      expect(response.options.status).toBe(404);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toBe('Pilot not found');
    });
  });

  describe('POST /api/pilots', () => {
    test('should create a new pilot for an Administrator', async () => {
      simulateAuthRequest('Administrator', 'admin-uid');
      mockRequest.json.mockResolvedValueOnce({
        userId: 'new-user-uid-for-pilot',
        name: 'New Pilot',
        email: 'newpilot@example.com',
      });

      const response = await POST(mockRequest, mockContext);

      expect(db.collection('pilots').add).toHaveBeenCalledWith({
        userId: 'new-user-uid-for-pilot',
        name: 'New Pilot',
        email: 'newpilot@example.com',
      });
      expect(db.collection('users').doc).toHaveBeenCalledWith('new-user-uid-for-pilot');
      expect(db.collection('users').doc().update).toHaveBeenCalledWith({
        pilotId: 'new-pilot-doc-id',
      });
      expect(response.options.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe('New Pilot');
    });

    test('should return 403 Forbidden for a Pilot trying to create a pilot', async () => {
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

  describe('PUT /api/pilots', () => {
    test('should update a pilot for an Administrator', async () => {
      simulateAuthRequest('Administrator', 'admin-uid');
      mockRequest.url = 'http://localhost/api/pilots?id=pilot-doc-id';
      mockRequest.json.mockResolvedValueOnce({
        status: 'Inactive',
      });

      const response = await PUT(mockRequest, mockContext);

      expect(db.collection().doc().update).toHaveBeenCalledWith({ status: 'Inactive' });
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe('Test Pilot'); // Data from mock get
    });

    test('should return 403 Forbidden for a Pilot trying to update a pilot', async () => {
      simulateAuthRequest('Pilot', 'pilot-uid');
      mockRequest.url = 'http://localhost/api/pilots?id=another-pilot-id';
      mockRequest.json.mockResolvedValueOnce({
        status: 'Inactive',
      });
      const response = await PUT(mockRequest, mockContext);

      expect(response.options.status).toBe(403);
      expect(response.data.error).toBe('Forbidden: You do not have the necessary permissions');
    });
  });

  describe('DELETE /api/pilots', () => {
    test('should delete a pilot for an Administrator', async () => {
      simulateAuthRequest('Administrator', 'admin-uid');
      mockRequest.url = 'http://localhost/api/pilots?id=pilot-doc-id';

      const response = await DELETE(mockRequest, mockContext);

      expect(db.collection('pilots').doc).toHaveBeenCalledWith('pilot-doc-id');
      expect(db.collection('pilots').doc().delete).toHaveBeenCalledWith();
      expect(db.collection('users').doc).toHaveBeenCalledWith('pilot-uid');
      expect(db.collection('users').doc().update).toHaveBeenCalledWith({ pilotId: null });
      expect(response.options.status).toBe(204);
    });

    test('should return 403 Forbidden for a Pilot trying to delete a pilot', async () => {
      simulateAuthRequest('Pilot', 'pilot-uid');
      mockRequest.url = 'http://localhost/api/pilots?id=another-pilot-id';
      const response = await DELETE(mockRequest, mockContext);

      expect(response.options.status).toBe(403);
      expect(response.data.error).toBe('Forbidden: You do not have the necessary permissions');
    });
  });
});
