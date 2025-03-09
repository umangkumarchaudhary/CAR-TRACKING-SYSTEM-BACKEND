const express = require("express");
const Vehicle = require("./models/vehicle");

const router = express.Router();

const MIN_TIME_GAP = 1000; // 1 second minimum time between entry and exit

// ✅ Role-to-Stage Mapping
const ROLE_TO_STAGE = {
  "Security Guard": "Security Gate",
  "Inspection Technician": "Interactive Bay",
  "Service Advisor": "Job Card Creation and Customer Approval",
  "Repair Technician": "Maintenance",
  "Additional Work Technician": "Additional Work",
  "Service Advisor (Approval)": "Waiting for Customer Approval",
  "Bay Allocator": "Waiting for Bay Allocation",
  "Final Inspector": "Final Inspection",
  "Washing Staff": "Washing",
  "Security Guard (Exit)": "Exit Gate",
};

// ✅ Vehicle Check API (Handles Entry, Stage Updates, and Work Status)
router.post("/vehicle-check", async (req, res) => {
  try {
    console.log("🔹 Incoming Request Data:", req.body);
    const { vehicleNumber, role, stageName, eventType } = req.body;

    if (!vehicleNumber || !role || !stageName || !eventType) {
      return res.status(400).json({ success: false, message: "Vehicle number, role, stage name, and event type are required." });
    }

    const formattedVehicleNumber = vehicleNumber.trim().toUpperCase();

    // ✅ Find the most recent vehicle record
    let vehicle = await Vehicle.findOne({ vehicleNumber: formattedVehicleNumber }).sort({ entryTime: -1 });

    // ✅ Case 1: First Entry → Create New Vehicle Entry
    if (!vehicle) {
      vehicle = new Vehicle({
        vehicleNumber: formattedVehicleNumber,
        entryTime: new Date(),
        exitTime: null,
        stages: [
          {
            stageName,
            role,
            eventType,
            timestamp: new Date(),
          },
        ],
        status: eventType === "Start" ? "Work in Progress" : "Pending",
        jobCardStarted: stageName === "Job Card Creation and Customer Approval" && eventType === "Start", // 🔥 Track Job Card Creation
      });

      await vehicle.save();
      return res.status(201).json({ success: true, newVehicle: true, message: "New vehicle entry recorded.", vehicle });
    }

    // ✅ Case 2: Prevent Duplicate Entry at the Same Stage
    const lastStage = vehicle.stages[vehicle.stages.length - 1];
    if (eventType === "Entry" && lastStage.stageName === stageName && lastStage.role === role) {
      return res.status(400).json({ success: false, message: "Vehicle already entered at this stage." });
    }

    // ✅ Case 3: Add New Entry for a Different Stage
    vehicle.stages.push({
      stageName,
      role,
      eventType,
      timestamp: new Date(),
    });

    // ✅ Case 4: Handle "Start" and "Finish" Actions
    if (eventType === "Start") {
      vehicle.status = "Work in Progress";

      // ✅ Track Job Card Creation
      if (stageName === "Job Card Creation and Customer Approval") {
        vehicle.jobCardStarted = true;
      }
    } else if (eventType === "Finish") {
      vehicle.status = "Finished";
    }

    // ✅ Case 5: Allow Exit Even If Entry Was Missed
    if (eventType === "Exit") {
      vehicle.exitTime = new Date();
    }

    await vehicle.save();
    return res.status(200).json({ success: true, message: "Vehicle stage updated.", vehicle });

  } catch (error) {
    console.error("Error in /vehicle-check:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
});

// ✅ Fetch all vehicles
router.get("/vehicles", async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.status(200).json({ success: true, vehicles });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
});

// In vehicleRoute.js (Backend) SERVICE ADVISOR
router.get("/vehicles/in-progress", async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      "stages.stageName": "Job Card Creation + Customer Approval",
    });

    return res.json({ success: true, vehicles });
  } catch (error) {
    console.error("Error fetching vehicles in progress:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/vehicles/bay-in-progress", async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      "stages.stageName": "Bay Work Started",
    });

    return res.json({ success: true, vehicles });
  } catch (error) {
    console.error("Error fetching vehicles in Bay Work:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/vehicles/final-inspection-in-progress", async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      "stages.stageName": "Final Inspection Started",
    });

    return res.json({ success: true, vehicles });
  } catch (error) {
    console.error("Error fetching ongoing Final Inspection jobs:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


router.get("/vehicles/washing-in-progress", async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      "stages.stageName": "Washing Started",
    });
    return res.json({ success: true, vehicles });
  } catch (error) {
    console.error("Error fetching ongoing washing:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});



// ✅ DELETE all vehicles
router.delete("/vehicles", async (req, res) => {
  try {
    const result = await Vehicle.deleteMany({});
    res.status(200).json({ success: true, message: "All vehicles deleted.", deletedCount: result.deletedCount });
  } catch (error) {
    console.error("Error deleting vehicles:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
});

module.exports = router;
