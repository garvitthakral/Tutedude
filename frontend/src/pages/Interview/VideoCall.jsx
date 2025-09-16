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

  const [username] = useState(location.state?.username || "");
  const [role] = useState(location.state?.role || "");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showRedAlert, setShowRedAlert] = useState(false);
  const [redAlert, setRedAlert] = useState({ label: "", name: "" });
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
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingStartRef = useRef(null);
  const readyRef = useRef(false);

  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const remoteVideoRefs = useRef(new Map());
  const makingOfferRef = useRef(new Map());
  const ignoreOfferRef = useRef(new Map());
  const pendingCandidatesRef = useRef(new Map());

  const [remoteStreamsMap, setRemoteStreamsMap] = useState(new Map());

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

  const pretty = (iso) =>
    new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });

  const handleEndCall = async () => {
    try {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
        console.log("Recording stopped by user.");
      }

      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        setIsCameraOn(false);
        videoRef.current.srcObject = null;
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

        if (blobToUse) {
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
        } else {
          console.warn("No blob to save.");
        }
      }

      peerConnectionsRef.current.forEach((pc, id) => {
        try {
          pc.close();
        } catch (e) {}
      });
      peerConnectionsRef.current.clear();
      socketApi.emit("leave-call", { interviewID });
      localStreamRef.current = null;

      navigate("/thank-you", {
        state: { role },
      });
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
    console.log(`PC[${socketId}] => creating`);
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    // store candidate queue
    pendingCandidatesRef.current.set(socketId, []);

    // add local tracks if available
    const localStream = localStreamRef.current;
    if (localStream) {
      localStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, localStream));
    }

    // track negotiation state for perfect negotiation
    makingOfferRef.current.set(socketId, false);
    ignoreOfferRef.current.set(socketId, false);

    pc.onicecandidate = (evt) => {
      if (evt.candidate) {
        console.log(`ICE[${socketId}] => sending candidate`, evt.candidate);
        socketApi.emit("ice-candidate", {
          interviewID,
          candidate: evt.candidate,
          to: socketId,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log(`TRACK[${socketId}] => ontrack`, event);
      const [stream] = event.streams;
      setRemoteStreamsMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(socketId, stream);
        return newMap;
      });
    };

    pc.onconnectionstatechange = () => {
      console.log(`PC[${socketId}] state:`, pc.connectionState);
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        try {
          pc.close();
        } catch (e) {}
        peerConnectionsRef.current.delete(socketId);
        setRemoteStreamsMap((prev) => {
          const newMap = new Map(prev);
          newMap.delete(socketId);
          return newMap;
        });
      }
    };

    pc.onnegotiationneeded = async () => {
      console.log(`NEG[${socketId}] => negotiationneeded`);
      try {
        makingOfferRef.current.set(socketId, true);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log(`OFFER[${socketId}] => emitting offer`);
        socketApi.emit("offer", {
          interviewID,
          offer: pc.localDescription,
          to: socketId,
        });
      } catch (err) {
        console.error(`NEG[${socketId}] error:`, err);
      } finally {
        makingOfferRef.current.set(socketId, false);
      }
    };

    return pc;
  };

  useEffect(() => {
    if (!localStreamRef.current) return;
    peerConnectionsRef.current.forEach((pc, socketId) => {
      try {
        // check if tracks already added by seeing senders
        const existingVideoSender = pc
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (!existingVideoSender) {
          localStreamRef.current
            .getTracks()
            .forEach((t) => pc.addTrack(t, localStreamRef.current));
          console.log(
            `PC[${socketId}] => added local tracks after stream arrived`
          );
        }
      } catch (e) {
        console.error("Error adding tracks to PC:", e);
      }
    });
  }, [isCameraOn]);

  useEffect(() => {
    console.log(
      "init: username, readyRef",
      username,
      readyRef.current,
      role,
      interviewID
    );
    if (!username) {
      navigate("/");
      return;
    }
    readyRef.current = true;
    socket.emit("joinRoom", interviewID, username);
    setMeetingData((prev) => ({ ...prev, start: new Date().toISOString() }));
  }, []);

  useEffect(() => {
    if (!readyRef.current) return;
    const startVideoAndRecord = async () => {
      try {
        console.log("now media will be taken");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: { echoCancellation: true, noiseSuppression: true },
        });

        if (videoRef.current) videoRef.current.srcObject = stream;
        localStreamRef.current = stream;
        setIsCameraOn(true);

        if (recordingStartRef.current) return;
        recordingStartRef.current = true;

        if (role !== "interviewer") {
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
          recorder.onerror = (ev) => console.error("MediaRecorder error:", ev);

          recorder.start(1000);
          setIsRecording(true);
          console.log("Recording started...");
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
      }
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      localStreamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!socketApi) return;

    const handleUserJoined = async ({ username: joinedUsername, socketId }) => {
      console.log(`user-joined -> ${joinedUsername} ${socketId}`);
      if (peerConnectionsRef.current.has(socketId)) {
        console.log(`PC[${socketId}] already exists`);
        return;
      }
      const pc = createPeerConnection(socketId);
      peerConnectionsRef.current.set(socketId, pc);

      // If local stream not ready, wait a bit (simple wait)
      if (!localStreamRef.current) {
        console.log(`PC[${socketId}] waiting for localStream...`);
        await new Promise((res) => {
          let attempts = 0;
          const tick = () => {
            if (localStreamRef.current || attempts > 100) return res();
            attempts++;
            setTimeout(tick, 50);
          };
          tick();
        });
      }

      try {
        makingOfferRef.current.set(socketId, true);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log(`OFFER[${socketId}] -> sending offer`);
        socketApi.emit("offer", {
          interviewID,
          offer: pc.localDescription,
          to: socketId,
        });
      } catch (e) {
        console.error(`Error creating offer for ${socketId}`, e);
      } finally {
        makingOfferRef.current.set(socketId, false);
      }
    };

    const handleOffer = async ({ offer, from }) => {
      console.log(`OFFER[${from}] received`, offer);
      const pcExists = peerConnectionsRef.current.has(from);
      const pc = pcExists
        ? peerConnectionsRef.current.get(from)
        : createPeerConnection(from);
      if (!pcExists) peerConnectionsRef.current.set(from, pc);

      const makingOffer = makingOfferRef.current.get(from) || false;
      const ignore = ignoreOfferRef.current.get(from) || false;
      console.log(
        `NEG[${from}] makingOffer=${makingOffer} ignore=${ignore} pc.signalingState=${pc.signalingState}`
      );

      if (makingOffer && pc.signalingState !== "stable") {
        console.warn(`OFFER[${from}] ignored due to glare`);
        ignoreOfferRef.current.set(from, true);
        return;
      }

      ignoreOfferRef.current.set(from, false);

      try {
        await pc.setRemoteDescription(offer);
        console.log(`OFFER[${from}] -> remote description set`);
        const queued = pendingCandidatesRef.current.get(from) || [];
        for (const c of queued) {
          try {
            await pc.addIceCandidate(c);
            console.log(`ICE[${from}] -> applied queued candidate`);
          } catch (e) {
            console.error("Error applying queued candidate", e);
          }
        }
        pendingCandidatesRef.current.set(from, []);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log(`ANSWER[${from}] -> sending answer`);
        socketApi.emit("answer", {
          interviewID,
          answer: pc.localDescription,
          to: from,
        });
      } catch (err) {
        console.error("Error handling offer", err);
      }
    };

    const handleAnswer = async ({ answer, from }) => {
      console.log(`ANSWER[${from}] received`);
      const pc = peerConnectionsRef.current.get(from);
      if (!pc) {
        console.warn(`ANSWER[${from}] -> no pc exists`);
        return;
      }
      try {
        await pc.setRemoteDescription(answer);
        console.log(`ANSWER[${from}] -> remote desc set`);
      } catch (err) {
        console.error("Error setting remote description (answer)", err);
      }
    };

    const handleIceCandidate = async ({ candidate, from }) => {
      // candidate may arrive before remote description set. queue it.
      const pc = peerConnectionsRef.current.get(from);
      if (!pc) {
        // queue for later; create entry
        const q = pendingCandidatesRef.current.get(from) || [];
        q.push(candidate);
        pendingCandidatesRef.current.set(from, q);
        console.log(`ICE[${from}] -> queued candidate (no PC yet)`);
        return;
      }
      try {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(candidate);
          console.log(`ICE[${from}] -> added candidate`);
        } else {
          const q = pendingCandidatesRef.current.get(from) || [];
          q.push(candidate);
          pendingCandidatesRef.current.set(from, q);
          console.log(`ICE[${from}] -> queued candidate (remoteDesc missing)`);
        }
      } catch (err) {
        console.error("Error adding ICE candidate", err);
      }
    };

    const handleUserLeft = ({ socketId }) => {
      console.log("user-left", socketId);
      const pc = peerConnectionsRef.current.get(socketId);
      if (pc) {
        try {
          pc.close();
        } catch (e) {}
        peerConnectionsRef.current.delete(socketId);
      }
      pendingCandidatesRef.current.delete(socketId);
      makingOfferRef.current.delete(socketId);
      ignoreOfferRef.current.delete(socketId);
      setRemoteStreamsMap((prev) => {
        const newMap = new Map(prev);
        newMap.delete(socketId);
        return newMap;
      });
    };

    socketApi.on("user-joined", handleUserJoined);
    socketApi.on("offer", handleOffer);
    socketApi.on("answer", handleAnswer);
    socketApi.on("ice-candidate", handleIceCandidate);
    socketApi.on("user-left", handleUserLeft);

    return () => {
      socketApi.off("user-joined", handleUserJoined);
      socketApi.off("offer", handleOffer);
      socketApi.off("answer", handleAnswer);
      socketApi.off("ice-candidate", handleIceCandidate);
      socketApi.off("user-left", handleUserLeft);
    };
  }, [interviewID]);

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
      }, 1000);
    };

    // attach listener once
    socket.on("Received-Red-Alert", handleReceivedRedAlert);
    console.log("Listening for Received-Red-Alert");

    return () => {
      socket.off("Received-Red-Alert", handleReceivedRedAlert);
      if (timeoutRef.id) clearTimeout(timeoutRef.id);
    };
  }, [socket]);

  const handleProctorEvent = (event) => {
    console.log("PROCTOR EVENT:", event);
    const { details, timestamp, type } = event;
    const newEvent = { eventType: type, timestamp, details };
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
    const newEvent = { eventType: type, timestamp, details: label };
    setMeetingData((prev) => ({ ...prev, events: [...prev.events, newEvent] }));
    socket.emit("Red-Alert", { interviewID, username, label });
  };

  useObjectDetection(videoRef, handleItemDetected, role === "candidate");

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white p-6 relative">
      <AnimatePresence>
        {showRedAlert && (
          <motion.div
            className="absolute bottom-8 right-8 z-50"
            variants={alertVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="rounded-xl bg-amber-600/95 ring-1 ring-amber-300/20 shadow-lg px-4 py-2 flex items-center gap-3">
              <span className="text-lg">🚨</span>
              <div className="text-sm">
                <div className="font-semibold">{redAlert?.name}</div>
                <div className="text-xs text-amber-100/90">
                  is using {redAlert?.label}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header / Info */}
      <header className="w-full max-w-5xl mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-indigo-300">
              Video Call
            </h1>
            <p className="text-sm text-gray-400 mt-1">Live interview session</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-lg bg-white/3 text-sm text-gray-200 border border-white/5">
              <span className="text-xs text-gray-300">Interview ID</span>
              <div className="font-medium text-sm truncate max-w-[140px]">
                {interviewID}
              </div>
            </div>

            <div className="px-3 py-1 rounded-lg bg-white/3 text-sm text-gray-200 border border-white/5">
              <span className="text-xs text-gray-300">User</span>
              <div className="font-medium text-sm">{username}</div>
            </div>

            <div className="px-3 py-1 rounded-lg bg-white/3 text-sm text-gray-200 border border-white/5">
              <span className="text-xs text-gray-300">Role</span>
              <div className="font-medium text-sm">{role}</div>
            </div>
          </div>
        </div>
      </header>

      {/* small local preview (keeps your exact video element and ref) */}
      <div className="absolute top-33 right-8 z-40">
        <div className="w-40 md:w-52 rounded-2xl overflow-hidden bg-black/60 border border-white/6 shadow-xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto bg-black"
          />
          <div className="px-3 py-2 bg-black/60 flex items-center justify-between text-xs text-gray-300">
            <span>You</span>
            <span className="text-amber-300">
              {isRecording ? "Recording" : "Live"}
            </span>
          </div>
        </div>
      </div>

      {/* Remote streams area */}
      <main className="w-full max-w-7xl mt-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="grid gap-4 grid-cols-1 sm:grid-cols-1 lg:grid-cols-1"
        >
          {remoteStreamsMap.size === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-24 rounded-lg bg-black/40 border border-white/6 text-center">
              <div className="text-6xl mb-4">📹</div>
              <div className="text-gray-400">
                Waiting for other participants...
              </div>
            </div>
          ) : (
            Array.from(remoteStreamsMap.entries()).map(([socketId, stream]) => (
              <div
                key={socketId}
                className="relative rounded-lg overflow-hidden bg-gradient-to-br from-gray-900/60 to-black/40 border border-white/6 shadow-lg"
              >
                <video
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover aspect-video rounded-2xl bg-gray-900"
                  ref={(el) => {
                    if (el) {
                      remoteVideoRefs.current.set(socketId, el);
                      if (el.srcObject !== stream) {
                        try {
                          el.srcObject = stream;
                        } catch (e) {
                          console.error("set srcObject failed", e);
                        }
                      }
                    } else {
                      remoteVideoRefs.current.delete(socketId);
                    }
                  }}
                />
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                  {socketId.slice(0, 8)}...
                </div>
              </div>
            ))
          )}
        </motion.div>
      </main>

      {/* Recording saved indicator */}
      {recordedBlob && (
        <div className="mt-4">
          <span className="inline-flex items-center gap-2 bg-emerald-700/20 text-emerald-300 px-3 py-1 rounded-md text-sm border border-emerald-600/20 shadow-sm">
            ✅ Recording saved locally
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={() => handleEndCall()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          disabled={!isRecording && !isCameraOn}
        >
          End Call & Save Recording
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
