import { useRef, useState, useEffect } from "react";
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [image, setImage] = useState(null);
  const [email, setEmail] = useState("");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);

  // Handle video stream when stream state changes
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play()
        .then(() => {
          console.log("Video playing successfully");
        })
        .catch(err => {
          console.error("Play error:", err);
        });
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Handle video can play
  const handleVideoCanPlay = () => {
    console.log("Video is ready to play");
  };

  // Start Camera
  const startCamera = async () => {
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser does not support camera access. Please use a modern browser.");
        return;
      }

      const constraints = {
        video: true,
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set stream to state - useEffect will handle playing
      setStream(mediaStream);
      setIsCameraOn(true);
      setError(null);
      
    } catch (err) {
      console.error("Camera error:", err);
      setError(err.message);
      
      let errorMessage = "Unable to access camera.";
      
      if (err.name === "NotAllowedError") {
        errorMessage = "Camera access denied. Please allow camera permissions in your browser settings and refresh the page.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found. Please connect a camera and try again.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application. Please close other apps using the camera.";
      } else if (err.name === "OverconstrainedError") {
        errorMessage = "Camera does not support the requested settings.";
      }
      
      alert(errorMessage);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  // Capture Photo
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/png");
    setImage(imageData);
    stopCamera();
  };

  // Retake Photo
  const retakePhoto = () => {
    setImage(null);
    startCamera();
  };

  // Send to Backend
  const sendToBackend = async () => {
    if (!image) {
      alert("Please capture image first");
      return;
    }

    if (!email) {
      alert("Please enter email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          image: image,
        }),
      });

      const data = await response.json();
      alert(data.message || "Photo sent successfully!");
      
      if (data.message && data.message.includes("Successfully")) {
        setEmail("");
        setImage(null);
        startCamera();
      }

    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📷 Snap Mail</h1>
        <p className="tagline">Capture a moment & share it instantly</p>
      </header>

      <main className="camera-section">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!image ? (
          <div className="camera-wrapper">
            {isCameraOn ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline
                  muted
                  onCanPlay={handleVideoCanPlay}
                  className="camera-feed"
                />
                <div className="camera-overlay">
                  <span className="recording-dot"></span>
                  <span>Live</span>
                </div>
              </>
            ) : (
              <div className="camera-placeholder">
                <span className="placeholder-icon">📷</span>
                <p>Camera is off</p>
              </div>
            )}
            
            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
          </div>
        ) : (
          <div className="photo-preview">
            <img src={image} alt="captured" className="captured-image" />
          </div>
        )}

        <div className="controls">
          {!image ? (
            <>
              {!isCameraOn ? (
                <button 
                  className="btn btn-primary" 
                  onClick={startCamera}
                >
                  <span className="btn-icon">🎥</span>
                  Start Camera
                </button>
              ) : (
                <button 
                  className="btn btn-capture" 
                  onClick={capturePhoto}
                >
                  <span className="capture-icon"></span>
                </button>
              )}
            </>
          ) : (
            <div className="action-buttons">
              <button 
                className="btn btn-secondary" 
                onClick={retakePhoto}
              >
                ↩️ Retake
              </button>
            </div>
          )}
        </div>

        {image && (
          <div className="email-section">
            <h3>Send to Email</h3>
            <div className="email-input-group">
              <input
                type="email"
                placeholder="Enter recipient email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="email-input"
              />
              <button 
                className="btn btn-send" 
                onClick={sendToBackend}
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "✉️ Send"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;


