// src/models/Notification.js
import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  id: { // Custom ID (though MongoDB _id is usually sufficient)
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to User model if using ObjectId for User ID
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['alert', 'info', 'warning'], // Added 'warning' as a possible type
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
