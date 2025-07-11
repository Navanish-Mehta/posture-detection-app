import React, { useState, useRef } from 'react';
import './VideoUpload.css';

const VideoUpload = ({ exerciseType, onAnalysisStart, onAnalysisComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      alert('Please select a valid video file');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      alert('Please select a video file first');
      return;
    }

    setUploading(true);
    onAnalysisStart();

    try {
      // Convert video to base64
      const base64 = await fileToBase64(selectedFile);
      
      // Send to backend
      const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${API_BASE}/analyze-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_data: base64,
          exercise_type: exerciseType
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const results = await response.json();
      onAnalysisComplete(results);
    } catch (error) {
      console.error('Error analyzing video:', error);
      alert('Error analyzing video. Please try again.');
      onAnalysisComplete(null);
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="video-upload">
      <div className="upload-area">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="file-input"
        />
        <button 
          className="upload-button"
          onClick={() => fileInputRef.current?.click()}
        >
          Select Video File
        </button>
      </div>

      {selectedFile && (
        <div className="file-info">
          <p>Selected: {selectedFile.name}</p>
          <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          <button onClick={handleClear} className="clear-button">
            Clear
          </button>
        </div>
      )}

      {previewUrl && (
        <div className="video-preview">
          <video 
            src={previewUrl} 
            controls 
            width="100%" 
            height="auto"
            className="preview-video"
          />
        </div>
      )}

      {selectedFile && (
        <button 
          onClick={handleAnalyze}
          disabled={uploading}
          className="analyze-button"
        >
          {uploading ? 'Analyzing...' : 'Analyze Posture'}
        </button>
      )}
    </div>
  );
};

export default VideoUpload; 