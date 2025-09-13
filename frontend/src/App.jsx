import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/landing/home";
import VideoCall from "./pages/Interview/VideoCall";

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/interview/:interviewID" element={<VideoCall />} />
      </Routes>
    </div>
  );
};

export default App;
