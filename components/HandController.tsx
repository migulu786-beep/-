import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { HandGesture } from '../types';

interface HandControllerProps {
  onGestureUpdate: (gesture: HandGesture) => void;
}

const HandController: React.FC<HandControllerProps> = ({ onGestureUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const lastVideoTimeRef = useRef(-1);
  const requestRef = useRef<number>(0);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const initHandLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        setLoading(false);
        startWebcam();
      } catch (e) {
        console.error("Error loading MediaPipe:", e);
        setLoading(false);
      }
    };

    initHandLandmarker();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      // Clean up stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
  }, []);

  const startWebcam = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: "user" }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.addEventListener("loadeddata", predictWebcam);
            }
        } catch (err) {
            console.error("Webcam error:", err);
        }
    }
  };

  const predictWebcam = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = handLandmarkerRef.current;

    if (video && canvas && landmarker) {
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        
        const startTimeMs = performance.now();
        // Ensure video has dimensions before detecting
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            try {
                const results = landmarker.detectForVideo(video, startTimeMs);
                
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.save();
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    // Flip visualization for mirror effect
                    ctx.scale(-1, 1);
                    ctx.translate(-canvas.width, 0);

                    // Draw Webcam feed slightly transparent
                    ctx.globalAlpha = 0.4;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    ctx.globalAlpha = 1.0;

                    if (results.landmarks && results.landmarks.length > 0) {
                        const landmarks = results.landmarks[0];
                        const drawingUtils = new DrawingUtils(ctx);
                        
                        // Draw skeleton
                        drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
                            color: "#FF69B4",
                            lineWidth: 2
                        });
                        drawingUtils.drawLandmarks(landmarks, { 
                            color: "#00FFFF", 
                            lineWidth: 1, 
                            radius: 3 
                        });

                        // --- GESTURE LOGIC ---
                        // 1. Pinch Detection (Thumb Tip 4 vs Index Tip 8)
                        const thumbTip = landmarks[4];
                        const indexTip = landmarks[8];
                        const distance = Math.sqrt(
                            Math.pow(thumbTip.x - indexTip.x, 2) + 
                            Math.pow(thumbTip.y - indexTip.y, 2)
                        );
                        
                        const isPinching = distance < 0.08;

                        // 2. Position for Rotation (Use Wrist or Palm Center)
                        // Coordinates are 0-1.
                        const palmX = landmarks[0].x; // 0 is wrist

                        onGestureUpdate({
                            isPinching,
                            handPresent: true,
                            palmPositionX: palmX
                        });

                        // Draw status text on canvas (needs to be un-flipped)
                        ctx.restore();
                        ctx.fillStyle = isPinching ? "#00FF00" : "#FF0000";
                        ctx.font = "16px Rajdhani";
                        ctx.fillText(isPinching ? "GRAB: FORM TREE" : "OPEN: EXPLODE", 10, 20);
                        
                    } else {
                        onGestureUpdate({
                            isPinching: false,
                            handPresent: false,
                            palmPositionX: 0.5
                        });
                        ctx.restore();
                    }
                }
            } catch (e) {
                // Ignore transient errors during stream spin-up
            }
        }
      }
    }
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="absolute bottom-4 right-4 z-50 border-2 border-pink-500/30 rounded-lg overflow-hidden bg-black/50 backdrop-blur-sm shadow-[0_0_15px_rgba(255,105,180,0.3)]">
      {loading && <div className="p-4 text-pink-400 animate-pulse">Init AI Vision...</div>}
      <div className="relative w-[160px] h-[120px]">
        <video ref={videoRef} autoPlay playsInline muted className="absolute opacity-0 w-full h-full" />
        <canvas ref={canvasRef} width={320} height={240} className="w-full h-full" />
      </div>
    </div>
  );
};

export default HandController;