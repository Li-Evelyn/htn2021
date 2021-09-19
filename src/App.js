import { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import * as tf from "@tensorflow/tfjs";
import * as tmPose from "@teachablemachine/pose";
import * as dance from "./dance.json";
// import { exec } from "child_process";
// import music from "./YMCA.wav";

import AudioReactRecorder, { RecordState } from "audio-react-recorder";

function App() {
  const URL = "https://teachablemachine.withgoogle.com/models/nMEk7cNI4/";
  let model, ctx, webcam, labelContainer, maxPredictions, music;
  const [recordState, setRecordState] = useState(null);
  const [recordedAudio, setRecordedAudio] = useState(null);
  // let audio = new Audio("./YMCA.mp3");
  const runeURL = "https://0e1c-72-142-79-238.ngrok.io/static.rune";
  const apiURL = "http://localhost:3001";

  function start() {
    setRecordState(RecordState.START);
    console.log("recording");
  }

  function stop() {
    setRecordState(RecordState.STOP);
    console.log("stopped");
  }

  function onStop(audioData) {
    console.log("hello");
    console.log("audioData", audioData);
    setRecordedAudio(audioData);
  }

  useEffect(() => {
    const classifyAudio = async () => {
      fetch("/api")
        .then((res) => res.json())
        .then((list) => console.log(list));
    };

    classifyAudio();
  }, []);

  const sendAudio = async () => {
    var fd = new FormData();
    var audioFile = new File([recordedAudio.blob], "recorded_audio");
    fd.append("audio", audioFile);
    console.log("sending audio");
    fetch("/api/classify", {
      headers: { Accept: "application/json" },
      method: "POST",
      body: fd,
    })
      .then((res) => res.json())
      .then((result) => console.log(result));
    // console.log(res);
  };

  async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // Note: the pose library adds a tmPose object to your window (window.tmPose)
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const size = 400;
    const flip = true; // whether to flip the webcam
    webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    console.log(webcam);
    await webcam.setup(); // request access to the webcam
    console.log(webcam);
    await webcam.play();
    window.requestAnimationFrame(loop);

    // append/get elements to the DOM
    const canvas = document.getElementById("canvas");
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
      // and class labels
      labelContainer.appendChild(document.createElement("div")); // predictions
    }
    // audio.play();
    document.getElementById("audio1").play();
    console.log(dance);
  }

  async function loop(timestamp) {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
  }

  async function predict() {
    // Prediction #1: run input through posenet
    // estimatePose can take in an image, video or canvas html element
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);

    for (let i = 0; i < maxPredictions; i++) {
      const classPrediction =
        prediction[i].className + ": " + prediction[i].probability.toFixed(2); // actual prediction value
      labelContainer.childNodes[i].innerHTML = classPrediction;
    }

    // finally draw the poses
    drawPose(pose);
  }

  function drawPose(pose) {
    if (webcam.canvas) {
      ctx.drawImage(webcam.canvas, 0, 0);
      // draw the keypoints and skeleton
      if (pose) {
        const minPartConfidence = 0.5;
        tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
        tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
      }
    }
  }

  // useEffect(() => {
  //   audio.load();
  // });

  return (
    <div className="App">
      <div>Teachable Machine Pose Model</div>
      <div>
        <canvas id="canvas"></canvas>
      </div>
      <audio
        id="audio1"
        controls="controls"
        preload="auto"
        src="http://freewavesamples.com/files/Korg-Triton-Slow-Choir-ST-C4.wav"
        type="audio/wav"
      ></audio>
      <button type="button" onClick={init}>
        Start
      </button>
      <div id="label-container"></div>
      <div>
        <AudioReactRecorder state={recordState} onStop={onStop} />

        <button onClick={start}>Start</button>
        <button onClick={stop}>Stop</button>
        <button onClick={sendAudio}>Send Audio</button>
      </div>
    </div>
  );
}

export default App;

// import React, { useEffect, useState } from 'react';
// import ReactMusicPlayer from 'react-music-player';

// function App() {

//   var songs = [
//     {
//       url: "./YMCA.mp3",
//       cover: "",
//       artist: {
//         name : "me",
//         song : "YMCA"
//       }
//     }
//   ]

//   useEffect(() => {
//     document.getElementsByClassName("audio-element")[0].play();
//   })

//   return (
//     <div className="App">

//     <ReactMusicPlayer songs={songs} autoplay />
//     </div>
//   );
// }

// export default App;
