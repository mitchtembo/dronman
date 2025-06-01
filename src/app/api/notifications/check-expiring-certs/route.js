// src/app/api/notifications/check-expiring-certs/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Pilot from '@/models/Pilot';
import Notification from '@/models/Notification';
import { isCertificationExpiringSoon } from '@/lib/utils'; // Utility to check expiry
import { withAuth } from '@/lib/authMiddleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse'; // Import API response helpers

const handleCheckExpiringCerts = async (request) => {
  await dbConnect();

  try {
    // Find all pilots
    const pilots = await Pilot.find({});
    let notificationsCreated = 0;

    for (const pilot of pilots) {
      for (const cert of pilot.certifications) {
        if (isCertificationExpiringSoon(cert.expires) && cert.status !== 'Expiring Soon Notified') {
          // Check if a notification for this specific expiring cert already exists
          const existingNotification = await Notification.findOne({
            userId: pilot.userId, // Assuming pilot.userId is the user's ObjectId
            type: 'alert',
            message: new RegExp(`Pilot ${pilot.name} certification ${cert.type} expiring soon`), // Match message
            read: false,
          });

          if (!existingNotification) {
            const newNotification = {
              userId: pilot.userId, // Link to the user associated with the pilot
              type: 'alert',
              message: `Pilot ${pilot.name} certification ${cert.type} expiring soon (${new Date(cert.expires).toLocaleDateString()}).`,
              date: new Date(),
              read: false,
            };
            await Notification.create(newNotification);
            notificationsCreated++;

            // Optionally update the certification status to prevent duplicate notifications
            // This would require updating the pilot document
            // cert.status = 'Expiring Soon Notified';
            // await pilot.save();
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
