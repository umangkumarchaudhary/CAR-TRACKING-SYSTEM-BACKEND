const mongoose = require("mongoose");


// Define Vehicle Schema with Event-based Tracking
const VehicleSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true }, // ✅ Unique removed for multiple entries
  entryTime: { type: Date, required: true }, // ✅ Entry remains fixed
  exitTime: { type: Date, default: null }, // ✅ Store exit timestamp
  stages: [
    {
      stageName: { type: String, required: true }, // ✅ E.g., Security Gate, Interactive Bay
      role: { type: String, required: true }, // ✅ Who performed the scan
      eventType: { type: String, required: true }, // ✅ Logs action: Entry, Work Started, Job Created, etc.
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const Vehicle = mongoose.model("Vehicle", VehicleSchema);

module.exports = Vehicle;
