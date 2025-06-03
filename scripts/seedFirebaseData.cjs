const admin = require('firebase-admin');
const serviceAccount = require('../drone-solutions-backend-firebase-adminsdk-fbsvc-bca6d6f48d.json'); // Corrected path

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // databaseURL: "https://your-project-id.firebaseio.com" // Uncomment and set if using Realtime Database
  });
}

const db = admin.firestore();

const seedData = async () => {
  console.log('Seeding Firebase data...');

  // --- Drones Collection ---
  const dronesRef = db.collection('drones');
  const dummyDrones = [
    {
      model: "DJI Mavic 3",
      serial: "M3-SN-001",
      make: "DJI",
      purchaseDate: new Date("2023-03-10"),
      status: "Available",
      lastMaintenance: new Date("2024-01-20"),
      nextServiceDate: new Date("2024-07-20"),
    },
    {
      model: "Autel Evo Lite+",
      serial: "AE-SN-002",
      make: "Autel Robotics",
      purchaseDate: new Date("2022-11-01"),
      status: "In Use",
      lastMaintenance: new Date("2024-02-15"),
      nextServiceDate: new Date("2024-08-15"),
    },
    {
      model: "Parrot Anafi",
      serial: "PA-SN-003",
      make: "Parrot",
      purchaseDate: new Date("2021-06-20"),
      status: "Under Maintenance",
      lastMaintenance: new Date("2024-03-01"),
      nextServiceDate: new Date("2024-09-01"),
    },
  ];

  for (const drone of dummyDrones) {
    await dronesRef.add(drone);
    console.log(`Added drone: ${drone.model}`);
  }

  // --- Pilots Collection (assuming some pilots are already linked via login automation) ---
  // We need to get existing pilot UIDs to link missions/flightlogs
  const pilotsSnapshot = await db.collection('pilots').get();
  const existingPilots = pilotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (existingPilots.length === 0) {
    console.warn('No existing pilots found. Please ensure you have logged in with at least one pilot user to create a pilot profile before seeding missions/flightlogs.');
    // Optionally create a dummy pilot if none exist for seeding purposes
    const dummyPilotRef = await db.collection('pilots').add({
      userId: 'dummyUserId123', // This won't link to a real user unless manually set
      name: 'Dummy Pilot',
      email: 'dummy@example.com',
      contact: '123-456-7890',
      status: 'Active',
      certifications: [],
    });
    existingPilots.push({ id: dummyPilotRef.id, name: 'Dummy Pilot' });
    console.log(`Created dummy pilot: ${dummyPilotRef.id}`);
  }

  const pilot1Id = existingPilots[0]?.id;
  const drone1Id = (await db.collection('drones').limit(1).get()).docs[0]?.id;

  if (!pilot1Id || !drone1Id) {
    console.error('Cannot seed missions/flightlogs: Missing pilot or drone IDs.');
    return;
  }

  // --- Missions Collection ---
  const missionsRef = db.collection('missions');
  const dummyMissions = [
    {
      name: "Aerial Survey of Victoria Falls",
      client: "Ministry of Tourism",
      location: "Victoria Falls",
      pilotId: pilot1Id,
      droneId: drone1Id,
      date: new Date("2024-07-15"),
      status: "Scheduled",
    },
    {
      name: "Farm Land Mapping",
      client: "AgriCorp Ltd.",
      location: "Mazowe Valley",
      pilotId: pilot1Id,
      droneId: drone1Id,
      date: new Date("2024-06-20"),
      status: "Completed",
    },
  ];

  for (const mission of dummyMissions) {
    await missionsRef.add(mission);
    console.log(`Added mission: ${mission.name}`);
  }

  // --- FlightLogs Collection ---
  const flightLogsRef = db.collection('flightlogs');
  const dummyFlightLogs = [
    {
      pilotId: pilot1Id,
      droneId: drone1Id,
      date: new Date("2024-06-20"),
      duration: 45,
      location: "Mazowe Valley",
      missionType: "Mapping",
      weather: "Sunny, 25°C",
      incidents: "None",
      notes: "Successful mapping flight.",
    },
    {
      pilotId: pilot1Id,
      droneId: drone1Id,
      date: new Date("2024-05-10"),
      duration: 30,
      location: "Harare Training Grounds",
      missionType: "Training",
      weather: "Cloudy, 18°C",
      incidents: "Minor GPS glitch",
      notes: "Routine training, GPS recovered quickly.",
    },
  ];

  for (const log of dummyFlightLogs) {
    await flightLogsRef.add(log);
    console.log(`Added flight log for: ${log.location}`);
  }

  // --- Notifications Collection ---
  const usersSnapshot = await db.collection('users').get();
  const existingUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const user1Id = existingUsers[0]?.id;

  if (!user1Id) {
    console.warn('No existing users found. Cannot seed notifications.');
  } else {
    const notificationsRef = db.collection('notifications');
    const dummyNotifications = [
      {
        userId: user1Id,
        type: "alert",
        message: "Drone AE-SN-002 requires immediate maintenance check.",
        date: new Date(),
        read: false,
      },
      {
        userId: user1Id,
        type: "info",
        message: "New software update available for DJI Mavic 3.",
        date: new Date(),
        read: true,
      },
    ];

    for (const notification of dummyNotifications) {
      await notificationsRef.add(notification);
      console.log(`Added notification for user: ${notification.userId}`);
    }
  }

  console.log('Firebase data seeding complete.');
};

seedData().catch(console.error);
