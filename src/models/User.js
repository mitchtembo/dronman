// src/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    maxlength: [40, 'Username cannot be more than 40 characters'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  role: {
    type: String,
    enum: ['Administrator', 'Pilot', 'Viewer'],
    default: 'Viewer',
  },
  pilotId: {
    type: String, // Assuming pilotId is a string like 'P001'
    default: null,
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
