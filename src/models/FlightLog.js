// src/models/FlightLog.js
import mongoose from 'mongoose';

const FlightLogSchema = new mongoose.Schema({
  id: { // Custom ID like FL001
    type: String,
    required: true,
    unique: true,
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
  duration: { // in minutes
    type: Number,
    required: true,
    min: 0,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  missionType: {
    type: String,
    required: true,
    trim: true,
  },
  weather: {
    type: String,
    trim: true,
  },
  incidents: {
    type: String,
    trim: true,
    default: 'None',
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
});

export default mongoose.models.FlightLog || mongoose.model('FlightLog', FlightLogSchema);
