import { useEffect, useRef } from "react";
import * as faceMesh from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

export default function useFaceDetection({
  videoRef,
  onProctorEvent,
  enabled,
}) {
  const meshRef = useRef(null);
  const cameraRef = useRef(null);

  // timers/state (not React state because this is high-frequency)
  const lastFaceSeenAtRef = useRef(Date.now());
  const lastLookingAwayAtRef = useRef(null);
  const lastMultipleFacesAtRef = useRef(null);
  const currentlyFlagged = useRef({
    noFace: false,
    lookingAway: false,
    multipleFaces: false,
  });

  useEffect(() => {
    if (!enabled) return;
    if (!videoRef?.current) return;

    const onResults = (results) => {
      const now = Date.now();

      const multi = (results.multiFaceLandmarks || []).length;
      // 1) face presence
      if (multi === 0) {
        // no face visible -> update lastFaceSeenAt
        // lastFaceSeenAt stays until face reappears
      } else {
        lastFaceSeenAtRef.current = now;
      }

      // 2) multiple faces
      if (multi > 1) {
        lastMultipleFacesAtRef.current = now;
        if (!currentlyFlagged.current.multipleFaces) {
          currentlyFlagged.current.multipleFaces = true;
          onProctorEvent?.({
            type: "multiple_faces",
            timestamp: new Date(now).toISOString(),
            details: { count: multi },
            // optionally include snapshotUrl (see below)
          });
        }
      } else {
        // reset multiple faces flag (so we can raise again later)
        currentlyFlagged.current.multipleFaces = false;
      }

      const fml = results.multiFaceLandmarks && results.multiFaceLandmarks[0];
      if (fml) {
        try {
          const leftEye = fml[33];
          const rightEye = fml[263];
          const noseTip = fml[1];

          // compute horizontal gaze proxy: eye-mid x vs nose x
          const eyeMidX = (leftEye.x + rightEye.x) / 2;
          const noseX = noseTip.x;
          const offset = eyeMidX - noseX;

          // compute a rough threshold
          const LOOK_AWAY_THRESHOLD = 0.035;
          if (Math.abs(offset) > LOOK_AWAY_THRESHOLD) {
            if (!lastLookingAwayAtRef.current)
              lastLookingAwayAtRef.current = now;
            // if continuous >5s -> emit looking_away
            if (
              !currentlyFlagged.current.lookingAway &&
              now - lastLookingAwayAtRef.current > 5000
            ) {
              currentlyFlagged.current.lookingAway = true;
              onProctorEvent?.({
                type: "looking_away",
                timestamp: new Date(now).toISOString(),
                details: { offset },
              });
            }
          } else {
            // reset looking away timer
            lastLookingAwayAtRef.current = null;
            currentlyFlagged.current.lookingAway = false;
          }
        } catch (e) {
          // if landmarks indexing mismatch, just ignore
        }
      }

      // 4) no-face detection: if continuous absence for >10s
      if (now - lastFaceSeenAtRef.current > 10000) {
        if (!currentlyFlagged.current.noFace) {
          currentlyFlagged.current.noFace = true;
          onProctorEvent?.({
            type: "no_face",
            timestamp: new Date(now).toISOString(),
            details: { durationMs: now - lastFaceSeenAtRef.current },
          });
        }
      } else {
        currentlyFlagged.current.noFace = false;
      }
    };

    // Initialize MediaPipe FaceMesh
    const fm = new faceMesh.FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    fm.setOptions({
      maxNumFaces: 2, // detect multiple faces
      refineLandmarks: true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5,
    });
    fm.onResults(onResults);
    meshRef.current = fm;

    // Now connect camera util which feeds frames into FaceMesh
    cameraRef.current = new Camera(videoRef.current, {
      onFrame: async () => {
        try {
          const videoEl = videoRef.current;
          if (!videoEl) return;
          if (videoEl.readyState < 2) return;
          if (!meshRef.current) return;

          await meshRef.current.send({ image: videoRef.current });
        } catch (e) {
          console.warn("FaceMesh frame error:", e);
        }
      },
      width: 1280,
      height: 720,
    });
    cameraRef.current.start();

    return () => {
      // cleanup
      try {
        cameraRef.current?.stop();
        meshRef.current?.close();
      } catch (e) {}
    };
  }, [videoRef.current]);

  return null;
}
