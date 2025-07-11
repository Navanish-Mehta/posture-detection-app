# Posture Detection App

A full-stack web application that analyzes posture using rule-based logic and MediaPipe pose detection. The app can detect bad posture in squats and desk sitting positions, providing real-time feedback and detailed analysis.

## Features

### 🏋️ Squat Analysis
- **Knee Over Toe Detection**: Flags when knees go beyond toes
- **Back Angle Analysis**: Ensures back angle stays above 150°
- **Squat Depth Monitoring**: Checks for proper squat depth (90-120° knee angle)
- **Form Feedback**: Real-time posture correction suggestions

### 💺 Desk Sitting Analysis
- **Neck Angle Monitoring**: Detects neck bending beyond 30°
- **Back Straightness**: Ensures back remains straight
- **Shoulder Level Check**: Monitors shoulder alignment
- **Posture Correction**: Provides specific improvement tips

### 📹 Video & Webcam Support
- **Video Upload**: Upload and analyze recorded videos
- **Webcam Capture**: Real-time analysis using device camera
- **Frame-by-Frame Analysis**: Detailed breakdown of posture issues
- **Progress Tracking**: Monitor improvement over time

## Tech Stack

### Frontend
- **React 19**: Modern UI framework
- **CSS3**: Custom styling with glassmorphism effects
- **WebRTC**: Camera access and video capture
- **Responsive Design**: Mobile-friendly interface

### Backend
- **FastAPI**: High-performance Python web framework
- **MediaPipe**: Google's pose detection library
- **OpenCV**: Computer vision processing
- **NumPy**: Numerical computations
- **Python 3.10**: Compatible with MediaPipe

## Project Structure

```
Posture-Detection-App/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── VideoUpload.js
│   │   │   ├── WebcamCapture.js
│   │   │   ├── PostureAnalysis.js
│   │   │   └── *.css        # Component styles
│   │   ├── App.js           # Main app component
│   │   └── App.css          # Main app styles
│   └── package.json
├── backend/                  # FastAPI application
│   ├── main.py              # Main API server
│   ├── requirements.txt     # Python dependencies
│   └── venv/               # Virtual environment
└── README.md               # Project documentation
```

## Installation & Setup

### Prerequisites
- **Python 3.10** (required for MediaPipe compatibility)
- **Node.js 16+** and npm
- **Git**

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**
   ```bash
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the backend server:**
   ```bash
   python main.py
   ```
   
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install react-webcam axios
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```
   
   The app will be available at `http://localhost:3000`
## 🌐 Live Demo

Click the link below to access the deployed app:

🔗 [Posture Detection App - Live](https://posture-detection-app-navanish-mehtas-projects.vercel.app/)

---

## 👨‍💻 Author

Made with ❤️ by **Navanish Mehta**  
📬 [Portfolio](https://navanish-mehta.github.io/Portfolio-app/)  
📧 navanishmehta@gmail.com

## Usage

### 1. Choose Exercise Type
- Select between "Squat" or "Desk Sitting" from the dropdown

### 2. Upload Video
- Click "Select Video File" to choose a video
- Preview the video before analysis
- Click "Analyze Posture" to process the video

### 3. Use Webcam
- Click "Start Camera" to enable webcam
- Position yourself in frame
- Click "Capture Image" to take a photo
- Click "Analyze Posture" to analyze the captured image

### 4. Review Results
- View detected posture issues
- Check joint angles and measurements
- See specific form recommendations
- For videos, review frame-by-frame analysis

## API Endpoints

### POST `/analyze-posture`
Analyzes a single image for posture issues.

**Request Body:**
```json
{
  "image_data": "base64_encoded_image",
  "exercise_type": "squat" | "desk"
}
```

**Response:**
```json
{
  "success": true,
  "issues": ["Back angle too low"],
  "angles": {
    "left_knee": 95.2,
    "right_knee": 94.8
  }
}
```

### POST `/analyze-video`
Analyzes a video file frame by frame.

**Request Body:**
```json
{
  "video_data": "base64_encoded_video",
  "exercise_type": "squat" | "desk"
}
```

**Response:**
```json
{
  "success": true,
  "total_frames": 150,
  "frame_analyses": [
    {
      "frame": 0,
      "has_pose": true,
      "issues": ["Knees over toes"],
      "angles": {...}
    }
  ]
}
```

## Rule-Based Logic

### Squat Analysis Rules
1. **Knee Over Toe**: `knee.x > ankle.x` (relative position)
2. **Back Angle**: `back_angle < 150°` (shoulder-hip-knee angle)
3. **Squat Depth**: `knee_angle < 90°` (too deep) or `knee_angle > 120°` (too shallow)

### Desk Sitting Rules
1. **Neck Deviation**: `|180° - neck_angle| > 30°`
2. **Back Deviation**: `|180° - back_angle| > 20°`
3. **Shoulder Level**: `|left_shoulder.y - right_shoulder.y| > 0.05`

## Deployment

### Backend Deployment (Render/Railway)
1. Connect your GitHub repository
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables if needed

### Frontend Deployment (Vercel/Netlify)
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `build`
4. Configure environment variables for API URL

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Troubleshooting

### Common Issues

**MediaPipe Installation Error:**
- Ensure Python 3.10 is installed
- Upgrade pip: `python -m pip install --upgrade pip`
- Try: `pip install mediapipe --no-cache-dir`

**Camera Access Issues:**
- Ensure HTTPS is enabled for production
- Check browser permissions
- Try different browsers

**Video Upload Problems:**
- Check file format (MP4, AVI, MOV supported)
- Ensure file size < 50MB
- Verify video contains clear human poses

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **MediaPipe**: Google's pose detection library
- **FastAPI**: Modern Python web framework
- **React**: Frontend framework
- **OpenCV**: Computer vision library

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review existing GitHub issues
3. Create a new issue with detailed information

---

**Note**: This application is for educational and fitness purposes. Always consult with fitness professionals for proper form guidance.
