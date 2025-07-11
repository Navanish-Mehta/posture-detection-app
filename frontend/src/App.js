import React, { useState } from 'react';
import './App.css';
import VideoUpload from './components/VideoUpload';
import WebcamCapture from './components/WebcamCapture';
import PostureAnalysis from './components/PostureAnalysis';

function App() {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exerciseType, setExerciseType] = useState('squat');

  const handleAnalysisComplete = (results) => {
    setAnalysisResults(results);
    setLoading(false);
  };

  const handleAnalysisStart = () => {
    setLoading(true);
    setAnalysisResults(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Posture Detection App</h1>
        <p>Analyze your posture for squats and desk sitting</p>
      </header>

      <main className="App-main">
        <div className="exercise-selector">
          <label>
            Exercise Type:
            <select 
              value={exerciseType} 
              onChange={(e) => setExerciseType(e.target.value)}
            >
              <option value="squat">Squat</option>
              <option value="desk">Desk Sitting</option>
            </select>
          </label>
        </div>

        <div className="input-methods">
          <div className="method-section">
            <h2>Upload Video</h2>
            <VideoUpload 
              exerciseType={exerciseType}
              onAnalysisStart={handleAnalysisStart}
              onAnalysisComplete={handleAnalysisComplete}
            />
          </div>

          <div className="method-section">
            <h2>Use Webcam</h2>
            <WebcamCapture 
              exerciseType={exerciseType}
              onAnalysisStart={handleAnalysisStart}
              onAnalysisComplete={handleAnalysisComplete}
            />
          </div>
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Analyzing posture...</p>
          </div>
        )}

        {analysisResults && (
          <PostureAnalysis 
            results={analysisResults}
            exerciseType={exerciseType}
          />
        )}
      </main>
    </div>
  );
}

export default App;
