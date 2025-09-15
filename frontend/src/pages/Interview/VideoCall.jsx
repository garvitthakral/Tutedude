import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import useFaceDetection from "../../hook/FaceDetectorHook";
import { useSocket } from "../../context/SocketContext.jsx";
import useObjectDetection from "../../hook/useObjectDetection.jsx";
import { motion, AnimatePresence } from "framer-motion";
import socketApi from "../../api/SocketApi.js";

const VideoCall = () => {
  const { interviewID } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();

  const [username, setUsername] = useState(location.state?.username || "");
  const [role, setRole] = useState(location.state?.role || "");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showRedAlert, setShowRedAlert] = useState(false);
  const [redAlert, setRedAlert] = useState({
    label: "",
    name: "",
  });
  const [meetingData, setMeetingData] = useState({
    name: location.state?.username || "",
    start: new Date().toISOString(),
    end: new Date().toISOString(),
    events: [],
    duration: 0,
    length: 0,
    score: 0,
  });

  const videoRef = useRef(null);
  const remoteRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingStartRef = useRef(null);
  const readyRef = useRef(false);

  //video call var
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [peerConnections, setPeerConnections] = useState(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [mediaReady, setMediaReady] = useState(false);

  const alertVariants = {
    hidden: { opacity: 0, x: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      x: 50,
      scale: 0.95,
      transition: { duration: 0.4, ease: "easeIn" },
    },
  };

  // End call handler: stop recorder, stop camera, auto-download
  const handleEndCall = async () => {
    try {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
        console.log("Recording stopped by user.");
      }

      if (videoRef.current) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        setIsCameraOn(false);
        videoRef.current = null;
      }

      if (role !== "interviewer") {
        await new Promise((res) => setTimeout(res, 200));

        if (!recordedBlob && chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, {
            type: chunksRef.current[0]?.type || "video/webm",
          });
          setRecordedBlob(blob);
        }

        const blobToUse =
          recordedBlob ||
          (chunksRef.current.length ? new Blob(chunksRef.current) : null);

        if (!blobToUse) {
          throw new Error("No recorded data available to save.");
        }

        const url = URL.createObjectURL(blobToUse);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `interview_${username}_${
          interviewID || "session"
        }_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        handleSubmit();
      }

      navigate("/thank-you");
    } catch (error) {
      console.error("Error ending call:", error);
    }
  };

  const handleSubmit = () => {
    const newData = {
      ...meetingData,
      end: new Date().toISOString(),
      length: meetingData.events.length,
    };
    socket.emit("submit-report", { newData });
  };

  const createPeerConnection = (socketId) => {
    console.log(`🔗 Creating peer connection for ${socketId}`);

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
      iceCandidatePoolSize: 10,
    });

    if (localStream) {
      console.log(`📤 Adding local tracks to peer connection for ${socketId}`);
      localStream.getTracks().forEach((track) => {
        console.log(`📡 Adding track:`, track.kind, track.enabled);
        peerConnection.addTrack(track, localStream);
      });
    }

    peerConnection.ontrack = (event) => {
      console.log(`📥 Received remote track from ${socketId}:`, event);
      const [remoteStream] = event.streams;
      console.log("🎥 Remote stream:", remoteStream);
      console.log("📹 Remote video tracks:", remoteStream.getVideoTracks());
      remoteRef.current = remoteStream;

      setRemoteStreams((prev) => {
        const newMap = new Map(prev);
        newMap.set(socketId, remoteStream);
        console.log("🗺️ Updated remote streams map:", newMap);
        return newMap;
      });
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`🧊 Sending ICE candidate to ${socketId}`);
        socketApi.emit("ice-candidate", {
          interviewID,
          candidate: event.candidate,
          to: socketId,
        });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(
        `🔄 Connection state changed for ${socketId}:`,
        peerConnection.connectionState
      );
    };

    return peerConnection;
  };

  useEffect(() => {
    console.log(username, readyRef.current, role, interviewID);
    if (!username) {
      navigate("/");
      return;
    }

    readyRef.current = true;
    console.log("enttering room");
    socket.emit("joinRoom", interviewID, username);
    setMeetingData((prev) => ({ ...prev, start: new Date().toISOString() }));
  }, []);

  useEffect(() => {
    console.log(username, readyRef.current, role, interviewID);
    if (!readyRef.current) return;
    const startVideoAndRecord = async () => {
      console.log("now media will be taken");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setLocalStream(stream);
        setIsCameraOn(true);

        if (recordingStartRef.current) return;
        recordingStartRef.current = true;
        if (role !== "interviewer") {
          // recording logic
          chunksRef.current = [];
          let mimeType = "video/webm; codecs=vp9";
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            const fallbacks = ["video/webm; codecs=vp8", "video/webm"];
            mimeType =
              fallbacks.find((m) => MediaRecorder.isTypeSupported(m)) || "";
          }

          const recorder = mimeType
            ? new MediaRecorder(stream, { mimeType })
            : new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;

          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              chunksRef.current.push(event.data);
            }
          };

          recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, {
              type: chunksRef.current[0]?.type || "video/webm",
            });
            setRecordedBlob(blob);
          };

          recorder.onerror = (ev) => {
            console.error("MediaRecorder error:", ev);
            setError("Recording error");
          };

          recorder.start(1000); // start recording immediately
          console.log("Recording started...");
          setIsRecording(true);
        }
      } catch (error) {
        setIsCameraOn(false);
        console.error("Error accessing media devices.", error);
      }
    };

    startVideoAndRecord();

    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
        console.log("Recording stopped...");
      }
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // keep ref to timeout so we can clear on unmount
    const timeoutRef = { id: null };

    const handleReceivedRedAlert = ({ label, username }) => {
      console.log("Received-Red-Alert:", label, username);
      setRedAlert({ label, name: username });
      setShowRedAlert(true);

      // clear any previous timeout
      if (timeoutRef.id) clearTimeout(timeoutRef.id);

      // hide after 100s
      timeoutRef.id = setTimeout(() => {
        setShowRedAlert(false);
        timeoutRef.id = null;
      }, 10000);
    };

    // attach listener once
    socket.on("Received-Red-Alert", handleReceivedRedAlert);
    console.log("Listening for Received-Red-Alert");

    // cleanup when socket changes / component unmounts
    return () => {
      socket.off("Received-Red-Alert", handleReceivedRedAlert);
      if (timeoutRef.id) clearTimeout(timeoutRef.id);
    };
  }, [socket]);

  // WebRTC signaling handlers
    useEffect(() => {
      const handleOffer = async ({ offer, from }) => {
        console.log(`📥 Received offer from ${from}`);
        console.log("📋 Offer details:", offer);

        const peerConnection = createPeerConnection(from);
        setPeerConnections((prev) => new Map(prev.set(from, peerConnection)));

        try {
          await peerConnection.setRemoteDescription(offer);
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          console.log(`📤 Sending answer to ${from}`);

          socketApi.emit("answer", {
            interviewID,
            answer,
            to: from,
          });
        } catch (error) {
          console.error("❌ Error handling offer:", error);
        }
      };

      const handleAnswer = async ({ answer, from }) => {
        console.log(`📥 Received answer from ${from}`);
        console.log("📋 Answer details:", answer);

        const peerConnection = peerConnections.get(from);
        if (peerConnection) {
          try {
            await peerConnection.setRemoteDescription(answer);
            console.log(`✅ Set remote description for ${from}`);
          } catch (error) {
            console.error("❌ Error setting remote description:", error);
          }
        }
      };

      const handleIceCandidate = async ({ candidate, from }) => {
        console.log(`🧊 Received ICE candidate from ${from}`);

        const peerConnection = peerConnections.get(from);
        if (peerConnection) {
          try {
            await peerConnection.addIceCandidate(candidate);
            console.log(`✅ Added ICE candidate for ${from}`);
          } catch (error) {
            console.error("❌ Error adding ICE candidate:", error);
          }
        }
      };

      const handleUserLeft = ({ socketId }) => {
        console.log(`👋 User left: ${socketId}`);

        const peerConnection = peerConnections.get(socketId);
        if (peerConnection) {
          peerConnection.close();
          setPeerConnections((prev) => {
            const newMap = new Map(prev);
            newMap.delete(socketId);
            return newMap;
          });
        }

        setRemoteStreams((prev) => {
          const newMap = new Map(prev);
          newMap.delete(socketId);
          return newMap;
        });
      };

      const handleUserJoined = async ({
        username: joinedUsername,
        socketId,
      }) => {
        console.log(`👋 ${joinedUsername} joined the room with ${socketId}`);

        const peerConnection = createPeerConnection(socketId);
        setPeerConnections(
          (prev) => new Map(prev.set(socketId, peerConnection))
        );

        try {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          console.log(`📤 Sending offer to ${socketId}`);

          socketApi.emit("offer", {
            interviewID,
            offer,
            to: socketId,
          });
        } catch (error) {
          console.error("❌ Error creating offer:", error);
        }
      };

      socketApi.on("user-joined", handleUserJoined);
      socketApi.on("offer", handleOffer);
      socketApi.on("answer", handleAnswer);
      socketApi.on("ice-candidate", handleIceCandidate);
      socketApi.on("user-left", handleUserLeft);

      return () => {
        socketApi.off("offer", handleOffer);
        socketApi.off("answer", handleAnswer);
        socketApi.off("ice-candidate", handleIceCandidate);
        socketApi.off("user-left", handleUserLeft);
      };
    }, [localStream, peerConnections, interviewID]);


  const handleProctorEvent = (event) => {
    console.log("PROCTOR EVENT:", event);
    const { details, timestamp, type } = event;
    const newEvent = {
      eventType: type,
      timestamp: timestamp,
      details: details,
    };
    setMeetingData((prev) => ({ ...prev, events: [...prev.events, newEvent] }));
  };

  useFaceDetection({
    videoRef,
    onProctorEvent: handleProctorEvent,
    enabled: role === "candidate",
  });

  const handleItemDetected = (event) => {
    console.log("ITEM DETECTED", event);
    const { type, label, score, timestamp, snapshot } = event;
    const newEvent = { eventType: type, timestamp: timestamp, details: label };
    setMeetingData((prev) => ({ ...prev, events: [...prev.events, newEvent] }));
    socket.emit("Red-Alert", { interviewID, username, label });
  };

  // run detection only for candidate
  useObjectDetection(
    videoRef,
    handleItemDetected,
    role === "candidate" // enabled only for candidate
  );

  return (
    <div>
      <AnimatePresence>
        {showRedAlert && (
          <motion.div
            className="absolute bottom-10 right-10 z-50"
            variants={alertVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h1 className="bg-blue-800 text-white py-2 px-4 rounded-lg shadow-lg">
              🚨 {redAlert?.name} is using {redAlert?.label}
            </h1>
          </motion.div>
        )}
      </AnimatePresence>
      <h1>Video Call</h1>
      <p>Interview ID: {interviewID}</p>
      <p>Username: {username}</p>
      <p>Role: {role}</p>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-sm rounded-2xl absolute top-8 right-8 h-auto bg-black"
      />
      <div className="w-4xl h-auto bg-black">
        {remoteStreams.size === 0 ? (
          <div className="text-center text-gray-400">
            <div className="text-6xl mb-4">📹</div>
            <div>Waiting for other participants...</div>
          </div>
        ) : (
          Array.from(remoteStreams.entries()).map(([socketId, stream]) => {
            if(remoteRef) {
              remoteRef.current.srcObject = stream;
            }
            
            return (
            <div key={socketId} className="relative m-2">
              <video
                ref={remoteRef}
                autoPlay
                playsInline
                className="w-full h-full rounded-lg bg-gray-900"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                {socketId.slice(0, 8)}...
              </div>
            </div>
          )} )
        )}
      </div>
      {recordedBlob && (
        <p className="text-green-500 mt-2">Recording saved locally ✅</p>
      )}
      <button
        onClick={() => handleEndCall()}
        className="px-4 py-2 bg-red-600 text-white rounded shadow cursor-pointer hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        disabled={!isRecording && !isCameraOn}
      >
        End Call & Save Recording
      </button>
    </div>
  );
};

export default VideoCall;
