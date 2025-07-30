const mongoose = require('mongoose');

const maintenanceLogSchema = mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Vehicle',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
    },
    mileage: {
      type: Number,
      required: true,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    nextDueDate: {
      type: Date,
    },
    // New fields for approval system
    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    adminPrice: {
      type: Number,
      min: 0,
    },
    completionDate: {
      type: Date,
    },
    adminNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const MaintenanceLog = mongoose.model('MaintenanceLog', maintenanceLogSchema);

module.exports = MaintenanceLog; 