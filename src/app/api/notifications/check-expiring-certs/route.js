// src/app/api/notifications/check-expiring-certs/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse';
import { db } from '@/lib/firebaseAdmin'; // Import Firestore db
import { isCertificationExpiringSoon } from '@/lib/utils'; // Utility to check expiry

const handleCheckExpiringCerts = async (request) => {
  try {
    // Find all pilots
    const pilotsSnapshot = await db.collection('pilots').get();
    const pilots = pilotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    let notificationsCreated = 0;

    for (const pilot of pilots) {
      // Ensure pilot.certifications exists and is an array
      if (pilot.certifications && Array.isArray(pilot.certifications)) {
        for (const cert of pilot.certifications) {
          // Convert Firestore Timestamp to Date object for isCertificationExpiringSoon
          const expiresDate = cert.expires ? cert.expires.toDate() : null;

          if (expiresDate && isCertificationExpiringSoon(expiresDate)) {
            // Check if a notification for this specific expiring cert already exists
            const existingNotificationsSnapshot = await db.collection('notifications')
              .where('userId', '==', pilot.userId)
              .where('type', '==', 'alert')
              .where('message', '==', `Pilot ${pilot.name} certification ${cert.type} expiring soon (${expiresDate.toLocaleDateString()}).`)
              .where('read', '==', false)
              .get();

            if (existingNotificationsSnapshot.empty) {
              const newNotification = {
                userId: pilot.userId, // Link to the user associated with the pilot
                type: 'alert',
                message: `Pilot ${pilot.name} certification ${cert.type} expiring soon (${expiresDate.toLocaleDateString()}).`,
                date: new Date(), // Firestore Timestamp will be automatically set on add
                read: false,
              };
              await db.collection('notifications').add(newNotification);
              notificationsCreated++;
            }
          }
        }
      }
    }

    return successResponse({ message: `Checked for expiring certifications. ${notificationsCreated} new notifications created.`, notificationsCreated });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(handleCheckExpiringCerts, ['Administrator']); // Only administrators can trigger this check
