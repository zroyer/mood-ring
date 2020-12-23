import React, {useEffect, useRef, useState} from 'react';
import {
  createCanvasFromMedia,
  detectAllFaces,
  draw,
  matchDimensions,
  nets,
  resizeResults,
  TinyFaceDetectorOptions
} from 'face-api.js';
import {PieChart} from 'react-minimal-pie-chart';
import './App.css';

const App = () => {
  const [insights, setInsights] = useState([{ title: 'Neutral 😐', value: 100, color: '#666666'},]);

  const startVideo = async () => {
    const video = document.getElementById('video');
    navigator.getUserMedia(
      {video: {}},
      (stream) => (video.srcObject = stream),
      (err) => console.error(err)
    );
  }

  const startDetections = async () => {
    const video = document.getElementById('video');
    if (video.getAttribute('listener') !== 'true') {
      video.addEventListener('play', () => {
        const canvas = createCanvasFromMedia(video);
        document.body.append(canvas);
        const displaySize = {width: video.width, height: video.height};
        matchDimensions(canvas, displaySize);
        setInterval(async () => {
          const detections = await detectAllFaces(video, new TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

          if (detections?.[0]) {
            const {
              angry,
              disgusted,
              fearful,
              happy,
              neutral,
              sad,
              surprised
            } = detections[0].expressions;

            setInsights([
              { title: 'Angry 😠', value: angry ? angry * 100 : 0, color: '#F82B60'},
              { title: 'Disgusted 🤢', value: disgusted ? disgusted * 100 : 0, color: '#FCB400'},
              { title: 'Fearful 😨', value: fearful ? fearful * 100 : 0, color: '#FE0AC2'},
              { title: 'Happy 😀', value: happy ? happy * 100 : 0, color: '#1DC932'},
              { title: 'Neutral 😐', value: neutral ? neutral * 100 : 0, color: '#666666'},
              { title: 'Sad 😔', value: sad ? sad * 100 : 0, color: '#2E7EF9'},
              { title: 'Surprised 😯', value: surprised ? surprised * 100 : 0, color: '#FF702B'},
            ]);
          }

          const resizedDetections = resizeResults(detections, displaySize);
          canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
          draw.drawDetections(canvas, resizedDetections);
          draw.drawFaceLandmarks(canvas, resizedDetections);
          draw.drawFaceExpressions(canvas, resizedDetections);
        }, 250);
      });
    }
  }

  const videoEl = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      Promise.all([
        await nets.tinyFaceDetector.loadFromUri('/models'),
        await nets.faceLandmark68Net.loadFromUri('/models'),
        await nets.faceRecognitionNet.loadFromUri('/models'),
        await nets.faceExpressionNet.loadFromUri('/models')
      ])
        .then(() => startVideo())
        .then(() => startDetections())
        .then((detection) => console.log(detection))
        .catch((error) => console.log(error));
    }
    let isMounted = false;
    if (!videoEl) {
      return;
    }
    if (!isMounted ) {
      loadModels();
    }
    return () => {
      isMounted = true;
    };
  }, []);

  return (
    <>
      <div className="container">
        <video ref={videoEl} id="video" width="800" height="600" autoPlay muted></video>
      </div>
      <div className="overlay">
        <PieChart
          lineWidth={25}
          data={insights}
          label={({ dataEntry }) => insights.length > 1 && dataEntry.value > 3 ? dataEntry.title : null}
          labelPosition={87.5}
          labelStyle={{
            fill: '#fff',
            fontFamily: 'sans-serif',
            pointerEvents: 'none',
            fontSize: '2px',
          }}
          animate
        />;
      </div>
    </>
  );
};

export default App;
