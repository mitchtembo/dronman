// scripts/migrateDataToMongo.js
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '../.env.local');
console.log('Loading environment from:', envPath);

// Load environment variables
dotenv.config({ path: envPath });

// Check both possible environment variables
const mongoUri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI;
if (!mongoUri) {
  console.error('Available environment variables:', Object.keys(process.env));
  throw new Error('MongoDB URI not found in environment variables');
}
console.log('Found MongoDB URI starting with:', mongoUri.substring(0, mongoUri.indexOf('@')));

import dbConnect from '../src/lib/dbConnect.js';
import User from '../src/models/User.js';
import Pilot from '../src/models/Pilot.js';
import Drone from '../src/models/Drone.js';
import Mission from '../src/models/Mission.js';
import FlightLog from '../src/models/FlightLog.js';
import Notification from '../src/models/Notification.js';
import bcrypt from 'bcryptjs'; // Import bcrypt

import { users, pilots, drones, missions, flightLogs, notifications } from '../src/lib/data.js';

async function migrateData() {
  try {
    console.log('Connecting to MongoDB...');
    await dbConnect();

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Pilot.deleteMany({}),
      Drone.deleteMany({}),
      Mission.deleteMany({}),
      FlightLog.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('Existing data cleared.');

    // Insert new data
    console.log('Migrating users...');
    const userMap = {}; // Map old user ID to new MongoDB _id
    const usersToInsert = await Promise.all(users.map(async user => {
      const newUser = {
        ...user,
        // Hash the password before inserting
        password: await bcrypt.hash(user.password, 10) // 10 is the salt rounds
      };
      // Remove the old numeric ID if Mongoose generates _id automatically
      delete newUser.id; 
      return newUser;
    }));
    const insertedUsers = await User.insertMany(usersToInsert);
    insertedUsers.forEach((user, index) => {
      userMap[users[index].id] = user._id; // Map old numeric ID to new ObjectId
    });
    console.log(`${insertedUsers.length} users migrated.`);

    console.log('Migrating pilots...');
    const pilotsToInsert = pilots.map(pilot => ({
      ...pilot,
      // Map userId to ObjectId if it exists and is in our map
      userId: pilot.userId ? userMap[pilot.userId] : null,
      certifications: pilot.certifications.map(cert => ({
        ...cert,
        issued: new Date(cert.issued),
        expires: new Date(cert.expires)
      }))
    }));
    const migratedPilots = await Pilot.insertMany(pilotsToInsert);
    console.log(`${migratedPilots.length} pilots migrated.`);

    console.log('Migrating drones...');
    const migratedDrones = await Drone.insertMany(drones.map(drone => ({
      ...drone,
      purchaseDate: new Date(drone.purchaseDate),
      lastMaintenance: new Date(drone.lastMaintenance),
      nextServiceDate: new Date(drone.nextServiceDate)
    })));
    console.log(`${migratedDrones.length} drones migrated.`);

    console.log('Migrating missions...');
    const migratedMissions = await Mission.insertMany(missions.map(mission => ({
      ...mission,
      date: new Date(mission.date)
    })));
    console.log(`${migratedMissions.length} missions migrated.`);

    console.log('Migrating flight logs...');
    const migratedFlightLogs = await FlightLog.insertMany(flightLogs.map(log => ({
      ...log,
      date: new Date(log.date)
    })));
    console.log(`${migratedFlightLogs.length} flight logs migrated.`);

    console.log('Migrating notifications...');
    const notificationsToInsert = notifications.map(notif => ({
      ...notif,
      // Map userId to ObjectId if it exists and is in our map
      userId: notif.userId ? userMap[notif.userId] : null,
      date: new Date(notif.date)
    }));
    const migratedNotifications = await Notification.insertMany(notificationsToInsert);
    console.log(`${migratedNotifications.length} notifications migrated.`);

    console.log('Data migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Data migration failed:', error);
    process.exit(1);
  }
}

migrateData();
