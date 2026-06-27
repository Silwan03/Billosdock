/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, X, AlertCircle, FileUp } from "lucide-react";

interface CameraUploadProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

export default function CameraUpload({ onCapture, onClose }: CameraUploadProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  async function startCamera(mode: "user" | "environment" = facingMode) {
    setLoading(true);
    setError(null);
    
    // Stop any existing streams first
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setLoading(false);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError(
        "Could not access camera. Please check camera permissions in your browser or try selecting a file instead."
      );
      setLoading(false);
    }
  }

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  function toggleCamera() {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  }

  function captureFrame() {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        // Match canvas to video aspect ratio
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Extract data URL
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        onCapture(dataUrl);
        
        // Stop camera tracks
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  }

  return (
    <div id="camera_modal" className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-brand-500" />
          <h2 className="font-display font-semibold text-lg">Scan Bill Document</h2>
        </div>
        <button 
          id="close_camera_btn"
          onClick={onClose} 
          className="p-1 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main viewport */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-10">
            <RefreshCw className="w-10 h-10 animate-spin text-brand-500 mb-2" />
            <p className="text-sm text-slate-400">Requesting camera access...</p>
          </div>
        )}

        {error ? (
          <div className="p-6 max-w-md text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={() => startCamera()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-semibold rounded-lg transition-colors border border-slate-700 mb-2"
            >
              Retry Camera Access
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover max-w-2xl max-h-[80vh] bg-slate-950"
          />
        )}

        {/* Hidden Canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      {!error && !loading && (
        <div className="p-6 bg-slate-900 flex items-center justify-around border-t border-slate-800 pb-10">
          <button
            id="flip_camera_btn"
            onClick={toggleCamera}
            className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 active:scale-95 transition-all text-slate-300"
            title="Flip Camera"
          >
            <RefreshCw className="w-6 h-6" />
          </button>

          <button
            id="shutter_btn"
            onClick={captureFrame}
            className="w-16 h-16 rounded-full bg-white border-4 border-slate-300 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
            title="Capture Bill"
          >
            <div className="w-12 h-12 rounded-full bg-brand-500" />
          </button>

          <div className="w-12 h-12" /> {/* spacer */}
        </div>
      )}
    </div>
  );
}
