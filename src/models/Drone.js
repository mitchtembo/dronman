// src/models/Drone.js
import mongoose from 'mongoose';

const DroneSchema = new mongoose.Schema({
  id: { // Custom ID like D001
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  model: {
    type: String,
    required: true,
    trim: true,
  },
  serial: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  make: {
    type: String,
    required: true,
    trim: true,
  },
  purchaseDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Available', 'In Maintenance', 'Retired'], // Added 'Retired' as a possible status
    default: 'Available',
  },
  lastMaintenance: {
    type: Date,
    default: null,
  },
  nextServiceDate: {
    type: Date,
    default: null,
  },
});

export default mongoose.models.Drone || mongoose.model('Drone', DroneSchema);
