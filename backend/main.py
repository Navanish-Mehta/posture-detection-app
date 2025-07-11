from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field
import cv2
import mediapipe as mp
import numpy as np
import base64
from typing import List, Dict, Any
import logging

app = FastAPI(title="Posture Detection API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error for request to {request.url}: {exc.errors()} | Body: {await request.body()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": (await request.body()).decode()},
    )

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

def calculate_angle(a, b, c):
    """Calculate angle between three points."""
    a = np.array([a.x, a.y])
    b = np.array([b.x, b.y])
    c = np.array([c.x, c.y])
    
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    
    if angle > 180.0:
        angle = 360 - angle
    
    return angle

def get_visibilities(landmarks, indices):
    return [landmarks[idx].visibility if hasattr(landmarks[idx], 'visibility') else 0.0 for idx in indices]

def analyze_squat_pose(landmarks):
    issues = []
    required = [mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.LEFT_HIP, mp_pose.PoseLandmark.LEFT_KNEE, mp_pose.PoseLandmark.LEFT_ANKLE,
                mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_HIP, mp_pose.PoseLandmark.RIGHT_KNEE, mp_pose.PoseLandmark.RIGHT_ANKLE]
    visibilities = get_visibilities(landmarks, required)
    avg_vis = float(np.mean(visibilities)) if visibilities else 0.0
    num_visible = sum(1 for v in visibilities if v >= 0.3)
    logger.info(f"Squat: Visibilities for required keypoints: {visibilities}")
    logger.info(f"Squat: Average visibility: {avg_vis:.2f}, Keypoints above threshold: {num_visible}/8")
    if num_visible < 5:
        logger.warning("Squat: Pose not clear due to too few visible keypoints.")
        return ["Pose not clear"], avg_vis, visibilities
    left_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP]
    left_knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE]
    left_ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE]
    right_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP]
    right_knee = landmarks[mp_pose.PoseLandmark.RIGHT_KNEE]
    right_ankle = landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE]
    left_back_angle = calculate_angle(landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER], left_hip, left_knee)
    right_back_angle = calculate_angle(landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER], right_hip, right_knee)
    left_knee_x = left_knee.x
    left_ankle_x = left_ankle.x
    right_knee_x = right_knee.x
    right_ankle_x = right_ankle.x
    logger.info(f"Squat: Left back angle: {left_back_angle:.2f}, Right back angle: {right_back_angle:.2f}")
    logger.info(f"Squat: Left knee x: {left_knee_x:.2f}, Left ankle x: {left_ankle_x:.2f}, Right knee x: {right_knee_x:.2f}, Right ankle x: {right_ankle_x:.2f}")
    if left_back_angle < 130 or right_back_angle < 130:
        issues.append("Back bent")
    if left_knee_x > left_ankle_x or right_knee_x > right_ankle_x:
        issues.append("Knee over toe")
    if not issues:
        issues.append("Good posture!")
    logger.info(f"Squat issues: {issues}")
    return issues, avg_vis, visibilities

def analyze_desk_pose(landmarks):
    issues = []
    required = [mp_pose.PoseLandmark.LEFT_EAR, mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.LEFT_HIP, mp_pose.PoseLandmark.LEFT_KNEE,
                mp_pose.PoseLandmark.RIGHT_EAR, mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_HIP, mp_pose.PoseLandmark.RIGHT_KNEE]
    visibilities = get_visibilities(landmarks, required)
    avg_vis = float(np.mean(visibilities)) if visibilities else 0.0
    num_visible = sum(1 for v in visibilities if v >= 0.3)
    logger.info(f"Desk: Visibilities for required keypoints: {visibilities}")
    logger.info(f"Desk: Average visibility: {avg_vis:.2f}, Keypoints above threshold: {num_visible}/8")
    if num_visible < 5:
        logger.warning("Desk: Pose not clear due to too few visible keypoints.")
        return ["Pose not clear"], avg_vis, visibilities
    left_neck_angle = calculate_angle(landmarks[mp_pose.PoseLandmark.LEFT_EAR], landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER], landmarks[mp_pose.PoseLandmark.LEFT_HIP])
    right_neck_angle = calculate_angle(landmarks[mp_pose.PoseLandmark.RIGHT_EAR], landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER], landmarks[mp_pose.PoseLandmark.RIGHT_HIP])
    left_back_angle = calculate_angle(landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER], landmarks[mp_pose.PoseLandmark.LEFT_HIP], landmarks[mp_pose.PoseLandmark.LEFT_KNEE])
    right_back_angle = calculate_angle(landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER], landmarks[mp_pose.PoseLandmark.RIGHT_HIP], landmarks[mp_pose.PoseLandmark.RIGHT_KNEE])
    logger.info(f"Desk: Left neck angle: {left_neck_angle:.2f}, Right neck angle: {right_neck_angle:.2f}")
    logger.info(f"Desk: Left back angle: {left_back_angle:.2f}, Right back angle: {right_back_angle:.2f}")
    if left_neck_angle > 45 or right_neck_angle > 45:
        issues.append("Neck bent")
    if left_back_angle < 130 or right_back_angle < 130:
        issues.append("Back slouched")
    if not issues:
        issues.append("Good posture!")
    logger.info(f"Desk issues: {issues}")
    return issues, avg_vis, visibilities

# Pydantic models for request bodies
class ImagePostureRequest(BaseModel):
    image_data: str = Field(..., description="Base64 encoded image")
    exercise_type: str = Field("squat", description="Type of exercise (squat or desk)")

class VideoPostureRequest(BaseModel):
    video_data: str = Field(..., description="Base64 encoded video")
    exercise_type: str = Field("squat", description="Type of exercise (squat or desk)")

class FeedbackResponse(BaseModel):
    feedback: list[str]
    frame: Any = None

@app.get("/")
async def root():
    return {"message": "Posture Detection API is running"}

@app.post("/analyze-posture", response_model=FeedbackResponse)
async def analyze_posture(request: ImagePostureRequest, fastapi_request: Request):
    image_data = request.image_data
    exercise_type = request.exercise_type
    try:
        if await fastapi_request.is_disconnected():
            logger.warning("Client disconnected before processing started.")
            return FeedbackResponse(feedback=["Client disconnected"], frame=None)
        image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            logger.error("Invalid image data: could not decode image.")
            return FeedbackResponse(feedback=["Invalid image data"], frame=None)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        with mp_pose.Pose(
            static_image_mode=True,
            model_complexity=2,
            enable_segmentation=False,
            min_detection_confidence=0.5
        ) as pose:
            results = pose.process(image_rgb)
            if not results.pose_landmarks:
                logger.info("No pose detected in image.")
                return FeedbackResponse(feedback=["No pose detected"], frame=None)
            logger.info("Landmarks detected.")
            lm = results.pose_landmarks.landmark
            # Log coordinates for key joints
            key_joints = {
                'LEFT_SHOULDER': lm[mp_pose.PoseLandmark.LEFT_SHOULDER],
                'RIGHT_SHOULDER': lm[mp_pose.PoseLandmark.RIGHT_SHOULDER],
                'LEFT_HIP': lm[mp_pose.PoseLandmark.LEFT_HIP],
                'RIGHT_HIP': lm[mp_pose.PoseLandmark.RIGHT_HIP],
                'LEFT_KNEE': lm[mp_pose.PoseLandmark.LEFT_KNEE],
                'RIGHT_KNEE': lm[mp_pose.PoseLandmark.RIGHT_KNEE],
                'LEFT_ANKLE': lm[mp_pose.PoseLandmark.LEFT_ANKLE],
                'RIGHT_ANKLE': lm[mp_pose.PoseLandmark.RIGHT_ANKLE],
                'LEFT_EAR': lm[mp_pose.PoseLandmark.LEFT_EAR],
                'RIGHT_EAR': lm[mp_pose.PoseLandmark.RIGHT_EAR],
            }
            for joint, landmark in key_joints.items():
                logger.info(f"{joint}: x={landmark.x:.3f}, y={landmark.y:.3f}, z={landmark.z:.3f}, vis={landmark.visibility:.2f}")
            try:
                if exercise_type.lower() == "squat":
                    feedback, avg_vis, visibilities = analyze_squat_pose(lm)
                elif exercise_type.lower() == "desk":
                    feedback, avg_vis, visibilities = analyze_desk_pose(lm)
                else:
                    logger.error(f"Invalid exercise type: {exercise_type}")
                    feedback, avg_vis, visibilities = ["Invalid exercise type"], 0.0, []
            except Exception as angle_exc:
                logger.error(f"Error calculating angles: {str(angle_exc)}")
                return FeedbackResponse(feedback=["Error calculating angles"], frame=None)
            logger.info(f"Final Feedback: {feedback}")
            if await fastapi_request.is_disconnected():
                logger.warning("Client disconnected before response.")
                return FeedbackResponse(feedback=["Client disconnected"], frame=None)
            return FeedbackResponse(feedback=feedback, frame={"avg_confidence": avg_vis, "visibilities": visibilities})
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return FeedbackResponse(feedback=[f"Error processing image: {str(e)}"], frame=None)

@app.post("/analyze-video")
async def analyze_video(request: VideoPostureRequest):
    video_data = request.video_data
    exercise_type = request.exercise_type
    """
    Analyze posture from base64 encoded video.
    
    Args:
        video_data: Base64 encoded video
        exercise_type: Type of exercise ("squat" or "desk")
    
    Returns:
        Analysis results for each frame
    """
    try:
        # Decode base64 video
        video_bytes = base64.b64decode(video_data.split(',')[1] if ',' in video_data else video_data)
        
        # Save video to temporary file
        with open("temp_video.mp4", "wb") as f:
            f.write(video_bytes)
        
        # Open video
        cap = cv2.VideoCapture("temp_video.mp4")
        
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Could not open video")
        
        frame_analyses = []
        frame_count = 0
        
        with mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            enable_segmentation=True,
            min_detection_confidence=0.5
        ) as pose:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Convert BGR to RGB
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # Process frame
                results = pose.process(frame_rgb)
                
                if results.pose_landmarks:
                    # Analyze posture based on exercise type
                    if exercise_type.lower() == "squat":
                        analysis, avg_vis, visibilities = analyze_squat_pose(results.pose_landmarks.landmark)
                        required = [mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.LEFT_HIP, mp_pose.PoseLandmark.LEFT_KNEE, mp_pose.PoseLandmark.LEFT_ANKLE,
                                    mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_HIP, mp_pose.PoseLandmark.RIGHT_KNEE, mp_pose.PoseLandmark.RIGHT_ANKLE]
                    elif exercise_type.lower() == "desk":
                        analysis, avg_vis, visibilities = analyze_desk_pose(results.pose_landmarks.landmark)
                        required = [mp_pose.PoseLandmark.LEFT_EAR, mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.LEFT_HIP, mp_pose.PoseLandmark.LEFT_KNEE,
                                    mp_pose.PoseLandmark.RIGHT_EAR, mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_HIP, mp_pose.PoseLandmark.RIGHT_KNEE]
                    else:
                        analysis, avg_vis, visibilities = ["Invalid exercise type"], 0.0, []
                        required = []
                    confidence = avg_vis
                    frame_analyses.append({
                        "frame": frame_count,
                        "issues": analysis if isinstance(analysis, list) else analysis.get("issues", []),
                        "angles": analysis.get("angles", {}) if isinstance(analysis, dict) else {},
                        "has_pose": True,
                        "confidence": confidence,
                        "visibilities": visibilities
                    })
                else:
                    frame_analyses.append({
                        "frame": frame_count,
                        "issues": ["No pose detected"],
                        "angles": {},
                        "has_pose": False,
                        "confidence": 0.0,
                        "visibilities": []
                    })
                
                frame_count += 1
        
        cap.release()
        
        # Clean up temporary file
        import os
        if os.path.exists("temp_video.mp4"):
            os.remove("temp_video.mp4")
        
        return {
            "success": True,
            "message": "Video analysis completed",
            "exercise_type": exercise_type,
            "total_frames": frame_count,
            "frame_analyses": frame_analyses
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 