const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'gym_owner', 'trainer', 'member'],
    required: true,
  },
  profileImage: {
    type: String, // Cloudinary URL
    default: '',
  },
  contactNumber: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);