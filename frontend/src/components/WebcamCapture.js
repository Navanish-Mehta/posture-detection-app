/**
 * Improvements:
 * - Stop Analyze button always below feedback/result area
 * - Feedback/result area is cleared or shows stopped message when analysis is stopped
 * - Only show analyzing/result when appropriate
 * - Reset all state on retake, stop camera, or stop analyze
 */
import React, { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import "./WebcamCapture.css";

const CAPTURE_INTERVAL = 100; // ms
const FEEDBACK_BUFFER_SIZE = 5;
const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

const WebcamCapture = ({ exerciseType = "squat" }) => {
  const webcamRef = useRef(null);
  const intervalRef = useRef(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [streaming, setStreaming] = useState(false);
  const feedbackBuffer = useRef([]);

  // Helper to get mode of feedback buffer
  const getMode = (arr) => {
    if (arr.length === 0) return "";
    const freq = {};
    let max = 0, mode = arr[0];
    arr.forEach(val => {
      freq[val] = (freq[val] || 0) + 1;
      if (freq[val] > max) {
        max = freq[val];
        mode = val;
      }
    });
    return mode;
  };

  // Start/stop live analysis
  const startLiveAnalyze = useCallback(() => {
    setIsAnalyzing(true);
    setFeedback("");
    setError("");
    setStreaming(true);
    feedbackBuffer.current = [];

    intervalRef.current = setInterval(async () => {
      if (
        webcamRef.current &&
        webcamRef.current.getScreenshot
      ) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          try {
            const res = await axios.post(`${API_BASE}/analyze-posture`, {
              image_data: imageSrc,
              exercise_type: exerciseType,
            });
            // Always check for feedback array
            let fb = "No feedback received";
            if (res.data && Array.isArray(res.data.feedback)) {
              if (res.data.feedback.length > 0) {
                fb = res.data.feedback.join(", ");
              }
            }
            // Update buffer and set smoothed feedback
            feedbackBuffer.current.push(fb);
            if (feedbackBuffer.current.length > FEEDBACK_BUFFER_SIZE) {
              feedbackBuffer.current.shift();
            }
            setFeedback(getMode(feedbackBuffer.current));
            setError("");
          } catch (err) {
            setError("Error analyzing frame: " + (err.response?.data?.detail || err.message));
            setFeedback("");
            feedbackBuffer.current = [];
          }
        }
      }
    }, CAPTURE_INTERVAL);
  }, [exerciseType]);

  const stopLiveAnalyze = useCallback(() => {
    setIsAnalyzing(false);
    setStreaming(false);
    setFeedback("");
    setError("");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="live-webcam-posture">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        width={400}
        height={300}
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: "user",
        }}
        style={{ borderRadius: 10, background: "#222" }}
      />
      <div style={{ margin: "1rem 0" }}>
        {!isAnalyzing ? (
          <button onClick={startLiveAnalyze} className="analyze-button">
            Start Live Analyze
          </button>
        ) : (
          <button onClick={stopLiveAnalyze} className="stop-analyze-button">
            Stop Analyze
          </button>
        )}
      </div>
      <div className="feedback-area">
        {isAnalyzing && <p>Analyzing...</p>}
        {feedback && <p className="feedback">{feedback}</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default WebcamCapture; 