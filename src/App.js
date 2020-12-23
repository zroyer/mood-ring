import React, {useEffect, useRef} from 'react';
import * as faceapi from 'face-api.js';
import './App.css';

const App = () => {
  async function loadModels() {
    console.log('loading...');
    Promise.all([
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      await faceapi.nets.faceExpressionNet.loadFromUri('/models')
    ])
      .then(() => startVideo())
      .then(() => startDetections())
      .then((detection) => console.log(detection))
      .catch((error) => console.log(error));
  }

  async function startVideo() {
    const video = document.getElementById('video');
    console.log('starting video...');
    navigator.getUserMedia(
      {video: {}},
      (stream) => (video.srcObject = stream),
      (err) => console.error(err)
    );
  }

  async function startDetections() {
    const video = document.getElementById('video');
    video.addEventListener('play', () => {
      const canvas = faceapi.createCanvasFromMedia(video);
      document.body.append(canvas);
      const displaySize = {width: video.width, height: video.height};
      faceapi.matchDimensions(canvas, displaySize);
      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();
        console.log(detections)
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      }, 200);
    });
  }

  const videoEl = useRef(null);
  useEffect(() => {
    const handleLoadModels = async () => {
      await loadModels();
    };
    let isMounted = false;
    if (!videoEl) {
      return;
    }
    if (!isMounted ) {
      handleLoadModels();
    }
    return () => {
      isMounted = true;
    };
  }, []);


  return (
    <>
      <div className="video-container">
        <video ref={videoEl} id="video" width="800" height="600" autoPlay muted></video>
      </div>
      <div className="overlay-circle"/>
      <div className="overlay-bg"/>
    </>

  );
};

export default App;
