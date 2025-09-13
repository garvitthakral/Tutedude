import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

const VideoCall = () => {
  const { interviewID } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [username, setUsername] = useState(location.state?.username || "");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingStartRef = useRef(null);

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
      a.download = `interview_${interviewID || "session"}_${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      navigate("/thank-you");
    } catch (error) {
      console.error("Error ending call:", error);
    }
  };

  useEffect(() => {
    const startVideoAndRecord = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);

        if (recordingStartRef.current) return;
        recordingStartRef.current = true;

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

  return (
    <div>
      <h1>Video Call</h1>
      <p>Interview ID: {interviewID}</p>
      <p>Username: {username}</p>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-4xl h-auto bg-black"
      />
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
