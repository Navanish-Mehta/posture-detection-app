import React from 'react';
import './PostureAnalysis.css';

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

const PostureAnalysis = ({ results, exerciseType }) => {
  if (!results) {
    return (
      <div className="posture-analysis">
        <h3>Analysis Results</h3>
        <p>No analysis results available.</p>
      </div>
    );
  }

  const renderVideoAnalysis = () => {
    if (!results.frame_analyses) return null;

    const totalFrames = results.total_frames;
    const framesWithIssues = results.frame_analyses.filter(frame => 
      frame.issues && frame.issues.length > 0 && frame.issues[0] !== "No pose detected"
    ).length;
    const framesWithPose = results.frame_analyses.filter(frame => frame.has_pose).length;

    // Smoothing: collect all feedbacks and show the mode
    const allFeedbacks = results.frame_analyses.map(frame =>
      frame.issues && frame.issues.length > 0 ? frame.issues.join(", ") : "Good posture!"
    );
    const smoothedFeedback = getMode(allFeedbacks);

    return (
      <div className="video-analysis">
        <h3>Video Analysis Summary</h3>
        <div className="video-stats">
          <div className="stat">
            <span className="stat-label">Total Frames:</span>
            <span className="stat-value">{totalFrames}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Frames with Pose:</span>
            <span className="stat-value">{framesWithPose}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Frames with Issues:</span>
            <span className="stat-value">{framesWithIssues}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Issue Rate:</span>
            <span className="stat-value">
              {framesWithPose > 0 ? ((framesWithIssues / framesWithPose) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
        <div className="smoothed-feedback">
          <h4>Smoothed Feedback (Most Common):</h4>
          <p>{smoothedFeedback}</p>
        </div>
        <div className="frame-analysis">
          <h4>Frame-by-Frame Analysis</h4>
          <div className="frames-container">
            {results.frame_analyses.slice(0, 10).map((frame, index) => (
              <div key={index} className="frame-item">
                <div className="frame-header">
                  <span className="frame-number">Frame {frame.frame}</span>
                  <span className={`pose-status ${frame.has_pose ? 'detected' : 'not-detected'}`}>
                    {frame.has_pose ? 'Pose Detected' : 'No Pose'}
                  </span>
                </div>
                {frame.has_pose && frame.issues && frame.issues.length > 0 && (
                  <ul className="frame-issues">
                    {frame.issues.map((issue, issueIndex) => (
                      <li key={issueIndex} className="frame-issue">
                        {issue}
                      </li>
                    ))}
                  </ul>
                )}
                {frame.has_pose && frame.angles && (
                  <div className="frame-angles">
                    {Object.entries(frame.angles).map(([joint, angle]) => (
                      <span key={joint} className="angle-item">
                        {joint.replace('_', ' ').toUpperCase()}: {angle.toFixed(1)}°
                      </span>
                    ))}
                  </div>
                )}
                {/* Optionally display keypoint confidence if available */}
                {frame.has_pose && frame.confidence && (
                  <div className="frame-confidence">
                    <span>Keypoint Confidence: {frame.confidence.toFixed(2)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {results.frame_analyses.length > 10 && (
            <p className="more-frames">
              Showing first 10 frames. Total frames analyzed: {results.frame_analyses.length}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderImageAnalysis = () => {
    if (!results.success) {
      return (
        <div className="analysis-error">
          <h3>Analysis Failed</h3>
          <p>{results.message || 'Unable to analyze the image'}</p>
        </div>
      );
    }

    return (
      <div className="image-analysis">
        <h3>Image Analysis Results</h3>
        
        {results.issues && results.issues.length > 0 ? (
          <div className="issues-section">
            <h4>Posture Issues Detected:</h4>
            <ul className="issues-list">
              {results.issues.map((issue, index) => (
                <li key={index} className="issue-item">
                  <span className="issue-icon">⚠️</span>
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="good-posture-section">
            <h4>✅ Good Posture!</h4>
            <p>No posture issues detected in this {exerciseType}.</p>
          </div>
        )}

        {results.angles && Object.keys(results.angles).length > 0 && (
          <div className="angles-section">
            <h4>Joint Angles:</h4>
            <div className="angles-grid">
              {Object.entries(results.angles).map(([joint, angle]) => (
                <div key={joint} className="angle-card">
                  <span className="angle-label">{joint.replace('_', ' ').toUpperCase()}</span>
                  <span className="angle-value">{angle.toFixed(1)}°</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {exerciseType === 'squat' && results.knee_over_toe && (
          <div className="squat-specific">
            <h4>Squat Form Analysis:</h4>
            <div className="form-checks">
              <div className={`form-check ${results.knee_over_toe.left ? 'issue' : 'good'}`}>
                <span>Left Knee: {results.knee_over_toe.left ? 'Over Toes ⚠️' : 'Good Position ✅'}</span>
              </div>
              <div className={`form-check ${results.knee_over_toe.right ? 'issue' : 'good'}`}>
                <span>Right Knee: {results.knee_over_toe.right ? 'Over Toes ⚠️' : 'Good Position ✅'}</span>
              </div>
            </div>
          </div>
        )}

        {exerciseType === 'desk' && results.deviations && (
          <div className="desk-specific">
            <h4>Desk Posture Analysis:</h4>
            <div className="deviation-checks">
              <div className={`deviation-check ${results.deviations.neck > 30 ? 'issue' : 'good'}`}>
                <span>Neck Deviation: {results.deviations.neck.toFixed(1)}° {results.deviations.neck > 30 ? '⚠️' : '✅'}</span>
              </div>
              <div className={`deviation-check ${results.deviations.back > 20 ? 'issue' : 'good'}`}>
                <span>Back Deviation: {results.deviations.back.toFixed(1)}° {results.deviations.back > 20 ? '⚠️' : '✅'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="posture-analysis">
      {results.frame_analyses ? renderVideoAnalysis() : renderImageAnalysis()}
    </div>
  );
};

export default PostureAnalysis; 