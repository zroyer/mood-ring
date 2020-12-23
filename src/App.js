import React, {useEffect, useRef, useState} from 'react';
import * as faceapi from 'face-api.js';
import {PieChart} from 'react-minimal-pie-chart';
import './App.css';

const App = () => {
  const [insights, setInsights] = useState([]);

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
        const canvas = faceapi.createCanvasFromMedia(video);
        document.body.append(canvas);
        const displaySize = {width: video.width, height: video.height};
        faceapi.matchDimensions(canvas, displaySize);
        setInterval(async () => {
          const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
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
              { title: 'Angry 😠', value: angry ? angry * 100 : 0, color: 'red'},
              { title: 'Disgusted 🤢', value: disgusted ? disgusted * 100 : 0, color: 'brown'},
              { title: 'Fearful 😨', value: fearful ? fearful * 100 : 0, color: 'purple'},
              { title: 'Happy 😀', value: happy ? happy * 100 : 0, color: 'green'},
              { title: 'Neutral 😐', value: neutral ? neutral * 100 : 0, color: 'grey'},
              { title: 'Sad 😔', value: sad ? sad * 100 : 0, color: 'blue'},
              { title: 'Surprised 😯', value: surprised ? surprised * 100 : 0, color: 'orange'},
            ]);
          }

          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
          faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
        }, 250);
      });
    }
  }

  const videoEl = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
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
          label={({ dataEntry }) => dataEntry.value > 5 ? dataEntry.title : null}
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
