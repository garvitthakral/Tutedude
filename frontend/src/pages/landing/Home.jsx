import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  const handleStartInterview = () => {
    if (!username.trim()) {
      alert("Please enter a valid username.");
      return;
    }

    // creating a random interview ID for demonstration purposes
    const interviewID = Math.random().toString(36).substring(2, 8);
    navigate(`/interview/${interviewID}`, {
      state: { username },
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
      <div className="mt-20 flex items-center gap-3 min-w-2xl">
        <motion.input
          type="text"
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
          className="flex items-center gap-2 text-white py-2 px-4 rounded-lg bg-gray-800"
          onClick={handleStartInterview}
        >
          Start Now <FaArrowRight />
        </motion.button>
      </div>
    </div>
  );
};

export default Home;
