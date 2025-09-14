import { useEffect, useRef } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";

export default function useObjectDetectionDebug(videoRef, onDetect, enabled = true) {
  const modelRef = useRef(null);
  const intervalRef = useRef(null);
  const lastEmitRef = useRef({});

  const INTERVAL_MS = 900;
  const SCORE_THRESHOLD = 0.6;
  const COOLDOWN_MS = 5000;
  const TARGET_SUBSTRINGS = ["cell phone", "phone", "book", "laptop", "keyboard", "mouse", "remote"];

  const snapshot = (videoEl, scale = 0.5) => {
    try {
      if (!videoEl || videoEl.readyState < 2) return null;
      const w = Math.max(160, Math.floor(videoEl.videoWidth * scale));
      const h = Math.max(120, Math.floor(videoEl.videoHeight * scale));
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d").drawImage(videoEl, 0, 0, w, h);
      return c.toDataURL("image/jpeg", 0.6);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await tf.ready();
        const m = await cocoSsd.load();
        if (mounted) modelRef.current = m;
      } catch (err) {
        console.error("useSimpleObjectDetection: model load error", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    let running = true;
    const startWhenReady = async () => {
      const start = Date.now();
      while (running && (!modelRef.current || !videoRef?.current)) {
        await new Promise((r) => setTimeout(r, 100));
        if (Date.now() - start > 10000) break;
      }
      if (!running || !modelRef.current || !videoRef.current) return;

      intervalRef.current = setInterval(async () => {
        try {
          const v = videoRef.current;
          if (!v || v.readyState < 2) return;
          const preds = await modelRef.current.detect(v);
          if (!preds || preds.length === 0) return;

          const best = {};
          preds.forEach((p) => {
            const lbl = String(p.class).toLowerCase();
            if (!best[lbl] || p.score > best[lbl].score) best[lbl] = p;
          });

          const now = Date.now();
          for (const [lbl, p] of Object.entries(best)) {
            // match target substrings
            const matches = TARGET_SUBSTRINGS.some((t) => lbl.includes(t));
            if (!matches) continue;
            if (p.score < SCORE_THRESHOLD) continue;

            const last = lastEmitRef.current[lbl] || 0;
            if (now - last < COOLDOWN_MS) continue;

            lastEmitRef.current[lbl] = now;
            const evt = {
              type: "item_detected",
              label: lbl,
              score: p.score,
              timestamp: new Date().toISOString(),
              snapshot: snapshot(v),
            };
            try {
              onDetect?.(evt);
            } catch (e) {
              console.error("useSimpleObjectDetection onDetect handler error", e);
            }
          }
        } catch (err) {
          console.warn("useSimpleObjectDetection loop error", err?.message || err);
        }
      }, INTERVAL_MS);
    };

    startWhenReady();

    return () => {
      running = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled]);
}
