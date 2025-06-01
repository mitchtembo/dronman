// src/models/Mission.js
import mongoose from 'mongoose';

const MissionSchema = new mongoose.Schema({
  id: { // Custom ID like M001
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  client: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  pilotId: {
    type: String, // Assuming pilotId is a string like 'P001'
    required: true,
  },
  droneId: {
    type: String, // Assuming droneId is a string like 'D001'
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Confirmed', 'Completed', 'Cancelled'], // Added 'Cancelled'
    default: 'Scheduled',
  },
});

export default mongoose.models.Mission || mongoose.model('Mission', MissionSchema);
