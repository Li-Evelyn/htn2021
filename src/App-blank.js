import { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import * as tf from "@tensorflow/tfjs";
import * as tmPose from "@teachablemachine/pose";
import * as dance from "./dance.json";
import music from "./YMCA.wav";

function App() {
  const URL = "https://teachablemachine.withgoogle.com/models/iVB1AnIP3/";
  let model, ctx, webcam, labelContainer, maxPredictions;
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
    webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);
    console.log("set the webcam up");

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
  }

  async function loop() {
    console.log("loopin");
    webcam.update();
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
      <div id="currentStep"></div>
      <div id="score"></div>
    </div>
  );
}

export default App;
