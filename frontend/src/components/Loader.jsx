import React from "react";
import { motion } from "framer-motion";

const SIZE_MAP = {
  sm: 48,
  md: 80,
  lg: 120,
  xl: 160,
};


const Loader = ({ size = 'md', className = '' }) => {
  const px = SIZE_MAP[size] || SIZE_MAP.md;
  const orb = px * 0.18;
  const ring = px * 0.52;

  return (
    <>
      <div
        className={`flex flex-col items-center justify-center gap-4 ${className}`}
      >
        <div
          style={{ width: px, height: px }}
          className="relative flex items-center justify-center"
          aria-hidden
        >
          {/* Outer gradient ring that slowly rotates */}
          <motion.div
            style={{ width: ring, height: ring }}
            className="rounded-full p-1"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 via-pink-500 to-rose-400 shadow-2xl" />
          </motion.div>

          {/* Inner frosted disc */}
          <div
            style={{ width: px * 0.72, height: px * 0.72 }}
            className="absolute rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-inner"
          >
            {/* Three orbiting orbs */}
            <svg
              width={px * 0.6}
              height={px * 0.6}
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="g1" x1="0" x2="1">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {/* subtle center bloom */}
              <circle cx="50" cy="50" r="18" fill="url(#g1)" opacity="0.06" />

              {/* animated orbs with motion elements outside svg for crisp animation */}
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              {/* Orb 1: fast small */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: orb,
                  height: orb,
                  background:
                    "radial-gradient(circle at 30% 30%, #fff, #60a5fa)",
                }}
                animate={{
                  x: [0, ring * 0.28, 0],
                  y: [-(ring * 0.12), ring * 0.16, -(ring * 0.12)],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.8,
                  ease: "easeInOut",
                }}
              />

              {/* Orb 2: slower, different hue */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: orb * 1.1,
                  height: orb * 1.1,
                  background:
                    "radial-gradient(circle at 30% 30%, #fff, #fb7185)",
                }}
                animate={{
                  x: [-(ring * 0.18), ring * 0.22, -(ring * 0.18)],
                  y: [ring * 0.08, -(ring * 0.14), ring * 0.08],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.6,
                  ease: "easeInOut",
                }}
              />

              {/* Orb 3: gentle, dreamy */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: orb * 1.4,
                  height: orb * 1.4,
                  background:
                    "radial-gradient(circle at 30% 30%, #fff, #f472b6)",
                }}
                animate={{
                  x: [ring * 0.14, -(ring * 0.24), ring * 0.14],
                  y: [ring * 0.14, -(ring * 0.08), ring * 0.14],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3.2,
                  ease: "easeInOut",
                }}
              />

              {/* Center pulse */}
              <motion.div
                className="rounded-full"
                style={{
                  width: px * 0.18,
                  height: px * 0.18,
                  background: "linear-gradient(90deg,#fff,#fef3c7)",
                  boxShadow: "0 6px 24px rgba(99,102,241,0.16)",
                }}
                animate={{ scale: [1, 1.35, 1], opacity: [1, 0.7, 1] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.6,
                  ease: "easeInOut",
                }}
              />
            </div>
          </div>

          {/* Floating glass highlight */}
          <motion.div
            className="absolute -top-1 -left-1 w-10 h-6 rounded-full opacity-30 blur-sm"
            animate={{ rotate: [0, 10, -6, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          />
        </div>
      </div>
    </>
  );
};

export default Loader;