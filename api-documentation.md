# Drone Pilot Management System API Documentation

This document outlines the API endpoints for the Drone Pilot Management System. All endpoints are protected by JWT authentication and Role-Based Access Control (RBAC).

**Base URL:** `/api`

---

## Authentication

### `POST /api/auth/login`

Authenticates a user and returns a JWT token.

-   **Roles:** Public
-   **Request Body:**
    ```json
    {
      "username": "string",
      "password": "string"
    }
    ```
-   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "token": "your_jwt_token_here",
        "user": {
          "id": "user_mongodb_id",
          "username": "string",
          "role": "Administrator | Pilot | Viewer",
          "pilotId": "pilot_custom_id | null"
        }
      }
    }
    ```
-   **Error Response (401 Unauthorized):**
    ```json
    {
      "success": false,
      "error": "Invalid credentials"
    }
    ```

---

## User Management

### `GET /api/users`

Retrieves a list of all users or a specific user by ID/username.

-   **Roles:** Administrator
-   **Query Parameters:**
    -   `id`: User's MongoDB `_id` (optional)
    -   `username`: User's username (optional)
-   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "data": [
        {
          "_id": "user_mongodb_id",
          "username": "string",
          "role": "Administrator | Pilot | Viewer",
          "pilotId": "pilot_custom_id | null",
          "email": "string"
        }
      ]
    }
    ```
-   **Error Responses:**
    -   `401 Unauthorized`
    -   `403 Forbidden`
    -   `404 Not Found` (if specific user not found)

### `POST /api/users`

Creates a new user.

-   **Roles:** Administrator
-   **Request Body:**
    ```json
    {
      "username": "string",
      "password": "string",
      "role": "Administrator | Pilot | Viewer",
      "email": "string",
      "pilotId": "pilot_custom_id | null"
    }
    ```
-   **Success Response (201 Created):**
    ```json
    {
      "success": true,
      "data": {
        "_id": "new_user_mongodb_id",
        "username": "string",
        "role": "Administrator | Pilot | Viewer",
        "email": "string"
      }
    }
    ```
-   **Error Responses:**
    -   `400 Bad Request` (Validation failed)
    -   `401 Unauthorized`
    -   `403 Forbidden`
    -   `409 Conflict` (User with username/email already exists)

### `PUT /api/users`

Updates an existing user.

-   **Roles:** Administrator
-   **Request Body:**
    ```json
    {
      "id": "user_mongodb_id",
      "username": "string (optional)",
      "password": "string (optional)",
      "role": "Administrator | Pilot | Viewer (optional)",
      "email": "string (optional)",
      "pilotId": "pilot_custom_id | null (optional)"
    }
    ```
-   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "_id": "updated_user_mongodb_id",
        "username": "string",
        "role": "Administrator | Pilot | Viewer",
        "email": "string"
      }
    }
    ```
-   **Error Responses:**
    -   `400 Bad Request` (Validation failed)
    -   `401 Unauthorized`
    -   `403 Forbidden`
    -   `404 Not Found`

### `DELETE /api/users`

Deletes a user.

-   **Roles:** Administrator
-   **Query Parameters:**
    -   `id`: User's MongoDB `_id` (required)
-   **Success Response (204 No Content):**
    -   No response body.
-   **Error Responses:**
    -   `400 Bad Request` (ID required)
    -   `401 Unauthorized`
    -   `403 Forbidden`
    -   `404 Not Found`

---

## Pilot Management

### `GET /api/pilots`

Retrieves a list of all pilots or a specific pilot by ID.

-   **Roles:** Administrator, Pilot, Viewer
-   **Query Parameters:**
    -   `id`: Pilot's custom `id` (e.g., "P001") (optional)
-   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "data": [
        {
          "_id": "pilot_mongodb_id",
          "id": "P001",
          "userId": "user_mongodb_id | null",
          "name": "string",
          "email": "string",
          "contact": "string",
          "status": "Active | Inactive | Suspended",
          "certifications": [
            {
              "type": "string",
              "issued": "date",
              "expires": "date",
              "status": "Valid | Expired | Expiring Soon"
            }
          ]
        }
      ]
    }
    ```

### `POST /api/pilots`

Creates a new pilot.

-   **Roles:** Administrator
-   **Request Body:**
    ```json
    {
      "name": "string",
      "email": "string",
      "contact": "string",
      "status": "Active | Inactive | Suspended",
      "certifications": [
        {
          "type": "string",
          "issued": "date (YYYY-MM-DD)",
          "expires": "date (YYYY-MM-DD)",
          "status": "Valid | Expired | Expiring Soon"
        }
      ],
      "userId": "user_mongodb_id | null"
    }
    ```

### `PUT /api/pilots`

Updates an existing pilot.

-   **Roles:** Administrator, Pilot (can update their own profile)
-   **Request Body:**
    ```json
    {
      "id": "pilot_custom_id",
      "name": "string (optional)",
      "email": "string (optional)",
      "contact": "string (optional)",
      "status": "Active | Inactive | Suspended (optional)",
      "certifications": [ ... ] (optional, replaces entire array)
    }
    ```

### `DELETE /api/pilots`

Deletes a pilot.

-   **Roles:** Administrator
-   **Query Parameters:**
    -   `id`: Pilot's custom `id` (required)

---

## Drone Management

### `GET /api/drones`

Retrieves a list of all drones or a specific drone by ID.

-   **Roles:** Administrator, Pilot, Viewer
-   **Query Parameters:**
    -   `id`: Drone's custom `id` (e.g., "D001") (optional)

### `POST /api/drones`

Creates a new drone.

-   **Roles:** Administrator
-   **Request Body:**
    ```json
    {
      "model": "string",
      "serial": "string",
      "make": "string",
      "purchaseDate": "date (YYYY-MM-DD)",
      "status": "Available | In Maintenance",
      "lastMaintenance": "date (YYYY-MM-DD)",
      "nextServiceDate": "date (YYYY-MM-DD)"
    }
    ```

### `PUT /api/drones`

Updates an existing drone.

-   **Roles:** Administrator
-   **Request Body:**
    ```json
    {
      "id": "drone_custom_id",
      "model": "string (optional)",
      "serial": "string (optional)",
      "status": "Available | In Maintenance (optional)",
      "lastMaintenance": "date (YYYY-MM-DD) (optional)"
    }
    ```

### `DELETE /api/drones`

Deletes a drone.

-   **Roles:** Administrator
-   **Query Parameters:**
    -   `id`: Drone's custom `id` (required)

---

## Mission Management

### `GET /api/missions`

Retrieves a list of all missions or a specific mission by ID.

-   **Roles:** Administrator, Pilot, Viewer
-   **Query Parameters:**
    -   `id`: Mission's custom `id` (e.g., "M001") (optional)

### `POST /api/missions`

Creates a new mission.

-   **Roles:** Administrator
-   **Request Body:**
    ```json
    {
      "name": "string",
      "client": "string",
      "location": "string",
      "pilotId": "pilot_custom_id",
      "droneId": "drone_custom_id",
      "date": "date (YYYY-MM-DD)",
      "status": "Scheduled | Confirmed | Completed"
    }
    ```

### `PUT /api/missions`

Updates an existing mission.

-   **Roles:** Administrator
-   **Request Body:**
    ```json
    {
      "id": "mission_custom_id",
      "name": "string (optional)",
      "status": "Scheduled | Confirmed | Completed (optional)"
    }
    ```

### `DELETE /api/missions`

Deletes a mission.

-   **Roles:** Administrator
-   **Query Parameters:**
    -   `id`: Mission's custom `id` (required)

---

## Flight Log Management

### `GET /api/flights`

Retrieves a list of all flight logs or a specific flight log by ID.

-   **Roles:** Administrator, Pilot, Viewer
-   **Query Parameters:**
    -   `id`: Flight log's custom `id` (e.g., "FL001") (optional)

### `POST /api/flights`

Creates a new flight log.

-   **Roles:** Administrator, Pilot
-   **Request Body:**
    ```json
    {
      "pilotId": "pilot_custom_id",
      "droneId": "drone_custom_id",
      "date": "date (YYYY-MM-DD)",
      "duration": "number (minutes)",
      "location": "string",
      "missionType": "string",
      "weather": "string",
      "incidents": "string",
      "notes": "string"
    }
    ```

### `PUT /api/flights`

Updates an existing flight log.

-   **Roles:** Administrator, Pilot (can update their own logs)
-   **Request Body:**
    ```json
    {
      "id": "flight_log_custom_id",
      "duration": "number (minutes) (optional)",
      "notes": "string (optional)"
    }
    ```

### `DELETE /api/flights`

Deletes a flight log.

-   **Roles:** Administrator
-   **Query Parameters:**
    -   `id`: Flight log's custom `id` (required)

### `GET /api/pilots/[id]/flight-hours`

Retrieves total flight hours for a specific pilot.

-   **Roles:** Administrator, Pilot, Viewer
-   **Path Parameters:**
    -   `id`: Pilot's custom `id` (e.g., "P001") (required)
-   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "pilotId": "P001",
        "totalHours": 123.5
      }
    }
    ```

### `GET /api/drones/[id]/flight-hours`

Retrieves total flight hours for a specific drone.

-   **Roles:** Administrator, Pilot, Viewer
-   **Path Parameters:**
    -   `id`: Drone's custom `id` (e.g., "D001") (required)
-   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "droneId": "D001",
        "totalHours": 75.2
      }
    }
    ```

---

## Notification Management

### `GET /api/notifications`

Retrieves a list of all notifications or notifications for a specific user.

-   **Roles:** Administrator, Pilot, Viewer
-   **Query Parameters:**
    -   `id`: Notification's custom `id` (optional)
    -   `userId`: User's MongoDB `_id` (optional, if not admin, only own notifications)

### `POST /api/notifications`

Creates a new notification.

-   **Roles:** Administrator
-   **Request Body:**
    ```json
    {
      "userId": "user_mongodb_id",
      "type": "alert | info",
      "message": "string",
      "read": "boolean (optional, default: false)"
    }
    ```

### `PUT /api/notifications`

Updates an existing notification (e.g., marks as read).

-   **Roles:** Administrator, Pilot, Viewer (can update their own notifications)
-   **Request Body:**
    ```json
    {
      "id": "notification_custom_id",
      "read": "boolean (optional)"
    }
    ```

### `DELETE /api/notifications`

Deletes a notification.

-   **Roles:** Administrator
-   **Query Parameters:**
    -   `id`: Notification's custom `id` (required)

### `GET /api/notifications/check-expiring-certs`

Manually triggers a check for expiring pilot certifications and creates notifications.

-   **Roles:** Administrator
-   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "message": "Checked for expiring certifications. X new notifications created.",
        "notificationsCreated": "number"
      }
    }
    ```

---

**Note:** This documentation is a starting point. For a full production API, consider using tools like Postman or Swagger/OpenAPI for interactive documentation and testing.
