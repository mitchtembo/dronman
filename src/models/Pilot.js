// src/models/Pilot.js
import mongoose from 'mongoose';

const CertificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true,
  },
  issued: {
    type: Date,
    required: true,
  },
  expires: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Valid', 'Expiring Soon', 'Expired'],
    default: 'Valid',
  },
});

const PilotSchema = new mongoose.Schema({
  id: { // Custom ID like P001
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to User model if using ObjectId for User ID
    ref: 'User',
    default: null,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  contact: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active',
  },
  certifications: [CertificationSchema], // Array of sub-documents
});

export default mongoose.models.Pilot || mongoose.model('Pilot', PilotSchema);
