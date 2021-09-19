import { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import * as tf from '@tensorflow/tfjs';
import * as tmPose from '@teachablemachine/pose';
import * as dance from './dance.json';
import music from "./YMCA.wav";

function App() {
  const [currentStep, setCurrentStep] = useState(-1);

  const URL = "https://teachablemachine.withgoogle.com/models/iVB1AnIP3/";
  let model, ctx, webcam, labelContainer, maxPredictions;
  let stepScores = {
    "Y" : 0,
    "M" : 0,
    "C" : 0,
    "A" : 0,
    "clap" : 0,
  };
  // let audio = new Audio("./YMCA.mp3");
  const SONG = dance.ymca;


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
    setCurrentStep(0);
    webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);

    // append/get elements to the DOM
    const canvas = document.getElementById("canvas");
    canvas.width = size; canvas.height = size;
    ctx = canvas.getContext("2d");
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) { // and class labels
        labelContainer.appendChild(document.createElement("div")); // predictions
    }
    // audio.play();
    document.getElementById("audio1").play();
  }

  async function loop() {
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
        let step = prediction[i].className;
        let prob = prediction[i].probability.toFixed(2);
        const classPrediction = step + ": " + prob;
        labelContainer.childNodes[i].innerHTML = classPrediction;
        stepScores[step] = prob > stepScores[step] ? prob : stepScores[step];
        console.log(stepScores);
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

  function calculateScore() {
    let pose = dance.ymca.timings[currentStep].pose;
    let elem = document.getElementById("score");
    // do a different case for clapping maybe? for sound - rn it's just a generic clapping pose which i guess we can fall back on if we need to do so
    console.log(stepScores);
    if (stepScores[pose] >= 0.5) {
      elem.innerHTML = "Perfect";
    } else if (stepScores[pose] >= 0.25) {
      elem.innerHTML = "Good";
    } else if (stepScores[pose] >= 0.1) {
      elem.innerHTML = "OK";
    } else {
      elem.innerHTML = "Miss";
    }
    for (let score in stepScores) { // reset for next step
      stepScores[score] = 0;
    }
  }
  
  // useEffect(() => {
  //   audio.load();
  // });

  useEffect(() => {
    console.log("hello");
    if (currentStep >= 0) {
      console.log(currentStep + ": " + dance.ymca.timings[currentStep].pose + ": " + dance.ymca.timings[currentStep].beats * 60000/(dance.ymca.bpm));
      document.getElementById("currentStep").innerHTML = dance.ymca.timings[currentStep].pose;
      const timer = setTimeout(() => {
        if (currentStep < dance.ymca.timings.length - 1) {
          // do score calculation here
          calculateScore();
          setCurrentStep(currentStep + 1);
        }
      }, dance.ymca.timings[currentStep].beats * 60000/(dance.ymca.bpm));
      return () => {
        clearTimeout(timer);
      }
    }
  }, [currentStep]);

  return (
    <div className="App">
      <div>Teachable Machine Pose Model</div>
      <div><canvas id="canvas"></canvas></div>
      <audio id="audio1" controls="controls" preload="auto" src="http://freewavesamples.com/files/Korg-Triton-Slow-Choir-ST-C4.wav" type="audio/wav"></audio>
      <button type="button" onClick={init}>Start</button>
      <div id="label-container"></div>
      <div id="currentStep"></div>
      <div id="score"></div>
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