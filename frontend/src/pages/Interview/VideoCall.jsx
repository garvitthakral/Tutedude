import React, { useState } from "react";
import { useParams, useLocation } from "react-router-dom";

const VideoCall = () => {
  const { interviewID } = useParams();
  const location = useLocation();
  const [username, setUsername] = useState(location.state?.username || "");

  return (
    <div>
      <h1>Video Call</h1>
      <p>Interview ID: {interviewID}</p>
      <p>Username: {username}</p>
    </div>
  );
};

export default VideoCall;
