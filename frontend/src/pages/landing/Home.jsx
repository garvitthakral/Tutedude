import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { MdKey } from "react-icons/md";

const Home = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("interviewer");
  const [interviewID, setInterviewID] = useState("")

  const handleGenerateKey = () => {
    const key = Math.random().toString(36).substring(2, 8);
    setInterviewID(key);
  }

  const handleStartInterview = () => {
    if (!username.trim() || !interviewID) {
      alert("Please enter a valid username.");
      return;
    }

    navigate(`/interview/${interviewID}`, {
      state: { username, role },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen overflow-hidden bg-gradient-to-r from-gray-900 via-black to-gray-900 relative">
      <motion.h1
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative text-4xl md:text-8xl font-extralight text-white text-center drop-shadow-xl"
      >
        Start the Interview Process
      </motion.h1>
      <div className="mt-20 flex items-center justify-center gap-3 min-w-2xl">
        <motion.label
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          className={`flex flex-col gap-1 text-sm`}
        >
          <span className="flex items-center gap-2 cursor-pointer text-white py-2 px-4 rounded-lg bg-gray-800">
            Select role
          </span>
        </motion.label>
        <motion.select
          value={role}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          onChange={(e) => setRole(e.target.value)}
          className="w-full max-w-md px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md"
          aria-label="Select role"
        > 
          <option value="interviewer">Interviewer</option>
          <option value="candidate">Candidate</option>
        </motion.select>
      </div>
      <div className="mt-4 flex items-center justify-center gap-3 min-w-2xl">
        <motion.input
          type="text"
          value={interviewID}
          onChange={(e) => setInterviewID(e.target.value)}
          placeholder="Enter your Interview ID"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md"
        />
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          className="flex items-center gap-2 cursor-pointer text-white py-2 px-4 rounded-lg bg-gray-800 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-md"
          onClick={handleGenerateKey}
        >
          Generate <MdKey />
        </motion.button>
      </div>
      <div className="mt-4 flex items-center justify-center gap-3 min-w-2xl">
        <motion.input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md"
        />
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          className="flex items-center gap-2 cursor-pointer text-white py-2 px-4 rounded-lg bg-gray-800 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-md"
          onClick={handleStartInterview}
        >
          Start Now <FaArrowRight />
        </motion.button>
      </div>
    </div>
  );
};

export default Home;
