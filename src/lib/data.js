const users = [
  { id: 1, username: 'admin', password: 'password', role: 'Administrator', pilotId: null },
  { id: 2, username: 'pilot1', password: 'password', role: 'Pilot', pilotId: 'P001' },
  { id: 3, username: 'viewer1', password: 'password', role: 'Viewer', pilotId: null },
  { id: 4, username: 'mitchtembo@gmail.com', password: 'adm123', role: 'Administrator', pilotId: null } // New admin user
];

const pilots = [
  { id: 'P001', userId: 2, name: "Ethan Moyo", email: "ethan.moyo@dsz.co.zw", contact: "ethan.moyo@dsz.co.zw", status: "Active", 
    certifications: [
      { type: "RPL", issued: "2023-01-01", expires: "2024-12-31", status: "Valid" },
      { type: "Night Flight", issued: "2023-03-01", expires: "2025-12-01", status: "Valid" }
    ]
  },
  { id: 'P002', userId: null, name: "Tinashe Ndlovu", email: "tinashe.ndlovu@dsz.co.zw", contact: "tinashe.ndlovu@dsz.co.zw", status: "Suspended", 
    certifications: [
      { type: "RPL", issued: "2022-05-01", expires: "2025-11-15", status: "Expired" }
    ]
  },
  { id: 'P003', userId: null, name: "Grace Mutasa", email: "grace.mutasa@dsz.co.zw", contact: "grace.mutasa@dsz.co.zw", status: "Inactive", 
    certifications: [
      { type: "RPL", issued: "2023-06-01", expires: "2025-06-30", status: "Valid" }
    ]
  },
  { id: 'P004', userId: null, name: "Takudzwa Mahere", email: "takudzwa.mahere@dsz.co.zw", contact: "takudzwa.mahere@dsz.co.zw", status: "Active", 
    certifications: [
      { type: "RPL", issued: "2023-08-01", expires: "2024-08-31", status: "Valid" },
      { type: "Agricultural Spraying", issued: "2023-09-01", expires: "2025-09-01", status: "Valid" }
    ]
  },
  { id: 'P005', userId: null, name: "Chipo Dziva", email: "chipo.dziva@dsz.co.zw", contact: "chipo.dziva@dsz.co.zw", status: "Suspended", 
    certifications: [
      { type: "RPL", issued: "2022-12-01", expires: "2023-12-31", status: "Expired" },
      { type: "Night Flight", issued: "2023-01-01", expires: "2024-01-01", status: "Expired" }
    ]
  }
];

const drones = [
  { id: 'D001', model: "DJI Phantom 4 Pro", serial: "SN123456789", make: "DJI", purchaseDate: "2022-01-15", status: "Available", lastMaintenance: "2023-08-15", nextServiceDate: "2024-02-15" },
  { id: 'D002', model: "DJI Mavic 2 Pro", serial: "SN987654321", make: "DJI", purchaseDate: "2021-11-01", status: "In Maintenance", lastMaintenance: "2023-07-20", nextServiceDate: "2024-01-20" },
  { id: 'D003', model: "Autel Evo II Pro", serial: "SN112233445", make: "Autel", purchaseDate: "2023-03-10", status: "Available", lastMaintenance: "2023-09-01", nextServiceDate: "2024-03-01" }
];

const missions = [
  { id: 'M001', name: "Aerial Survey of Victoria Falls", client: "Ministry of Tourism", location: "Victoria Falls", pilotId: 'P001', droneId: 'D001', date: "2023-07-15", status: "Scheduled" },
  { id: 'M002', name: "Agricultural Mapping in Mashonaland", client: "AgriCorp Zimbabwe", location: "Mashonaland", pilotId: 'P002', droneId: 'D002', date: "2023-07-22", status: "Confirmed" }
];

const flightLogs = [
  { id: 'FL001', pilotId: 'P001', droneId: 'D001', date: "2023-07-10", duration: 45, location: "Harare Agricultural Showgrounds", missionType: "Training", weather: "Sunny, 22°C, Wind 3km/h E", incidents: "None", notes: "Successful training flight." },
  { id: 'FL002', pilotId: 'P002', droneId: 'D002', date: "2023-07-12", duration: 45, location: "Hwange National Park", missionType: "Wildlife Survey", weather: "Partly cloudy, 28°C, Wind 5km/h W", incidents: "Minor bird strike avoidance", notes: "Collected all required imagery." }
];

const notifications = [
  { id: 1, userId: 1, type: "alert", message: "Pilot P002 certification expiring soon (2023-11-15).", date: "2023-10-01", read: false },
  { id: 2, userId: 2, type: "info", message: "New mission assigned: M001.", date: "2023-07-01", read: true }
];

export { users, pilots, drones, missions, flightLogs, notifications };
