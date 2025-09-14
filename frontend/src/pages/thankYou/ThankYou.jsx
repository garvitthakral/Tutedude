import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const ThankYou = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white px-4">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-xl"
      >
        Thank You!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
        className="text-lg md:text-2xl text-gray-300 text-center max-w-xl"
      >
        Your interview has been recorded successfully.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mt-8"
      >
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-lg transition cursor-pointer"
        >
          Back to Home
        </button>
      </motion.div>
    </div>
  );
};

export default ThankYou;
