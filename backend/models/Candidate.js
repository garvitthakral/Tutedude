import mongoose from "mongoose";

const SuspiciousEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // flexible object (can hold anything)
    default: {},
  },
});

const CandidateSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },

    // Interview timing
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },

    // suspicious events
    suspiciousEvents: {
      type: [SuspiciousEventSchema],
      default: [],
    },

    interviewDuration: {
      type: String, // store as milliseconds
    },
    focusLostCount: {
      type: Number,
      default: 0,
    },

    finalScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Candidate = mongoose.model("Candidate", CandidateSchema);

export default Candidate;
