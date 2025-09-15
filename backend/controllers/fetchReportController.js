import Candidate from "../models/Candidate.js";

export const fetchReport = async (req, res) => {
  try {
    const candidates = await Candidate.find({}).lean().exec();
    res.status(200).json(candidates.map((c) => ({ ...c, _id: c._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
