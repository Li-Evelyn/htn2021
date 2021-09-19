import { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import * as tf from "@tensorflow/tfjs";
import * as tmPose from "@teachablemachine/pose";
import * as dance from "./dance.json";
// import music from "./YMCA.wav";

import AudioReactRecorder, { RecordState } from "audio-react-recorder";

function App() {
  const [recordState, setRecordState] = useState(null);
  const [recordedAudio, setRecordedAudio] = useState(null);
  // let audio = new Audio("./YMCA.mp3");
  const runeURL = "https://0e1c-72-142-79-238.ngrok.io/static.rune";
  const apiURL = "http://localhost:3001";
  let scores = { // could convert to single score for the step
    Y: 0,
    M: 0,
    C: 0,
    A: 0,
    clap: 0,
  };
  let should_exit = false;
  let currentStep = 0;
  let currentTotalScore = 0;
  let streak = 0;

  const URL = "https://teachablemachine.withgoogle.com/models/iVB1AnIP3/";
  let model, ctx, webcam, labelContainer, maxPredictions;
  // let audio = new Audio("./YMCA.mp3");
  const SONG = dance.ymca;

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
    await webcam.setup(); // request access to the webcam
    await webcam.play();

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
    window.requestAnimationFrame(run);
  }

  async function run() {
    let song = dance.ymca;
    document.getElementById("currentStep").innerHTML =
      dance.ymca.timings[currentStep].pose;
    const timer = setTimeout(() => {
      should_exit = true;
    }, (dance.ymca.timings[currentStep].beats * 60000) / dance.ymca.bpm);
    while (!should_exit) {
      webcam.update();
      await predict();
    }
    // loop();
    // while (let i = 0; i < song.timings.length; i++) {
    //

    // }
    await calculateScore(currentStep);
    scores = {
      Y: 0,
      M: 0,
      C: 0,
      A: 0,
      clap: 0,
    };
    should_exit = false;
    clearTimeout(timer);
    currentStep += 1;
    if (currentStep < song.timings.length) {
      await run();
    } else {
      console.log(currentTotalScore);
    }
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
      // update
      let step = prediction[i].className;
      let prob = prediction[i].probability.toFixed(2);
      const classPrediction = step + ": " + prob;
      labelContainer.childNodes[i].innerHTML = classPrediction;
      // if (currentStep >= 0) {
      //   console.log("got in one layer");
      //   console.log("step: " + step + " current: " + dance.ymca.timings[currentStep].pose);
      //   if (step == dance.ymca.timings[currentStep].pose) {
      //     setScore(prob > score ? prob : score);
      //     console.log("hello" + prob > score ? prob : score);
      //   }
      // }
      // let burnerObject = scores;
      // burnerObject[step] = prob > scores[step] ? prob : scores[step];
      scores[step] = prob > scores[step] ? prob : scores[step];
      // setscores(burnerObject);
      // console.log("in predict ", scores);
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

  async function calculateScore(i) {
    let pose = dance.ymca.timings[i].pose;
    let elem = document.getElementById("score");
    // do a different case for clapping maybe? for sound - rn it's just a generic clapping pose which i guess we can fall back on if we need to do so
    console.log("calculation: ", scores, "score: ", scores[pose]);
    let score = scores[pose];
    if (score >= 0.5) {
      elem.innerHTML = "Perfect";
      currentTotalScore += 50 + (streak * 5);
      streak++;
    } else if (score >= 0.25) {
      elem.innerHTML = "Good";
      currentTotalScore += 30 + (streak * 5);
      streak++;
    } else if (score >= 0.1) {
      elem.innerHTML = "OK";
      currentTotalScore += 15;
      streak = 0;
    } else {
      elem.innerHTML = "Miss";
      streak = 0;
    }
    console.log("total: ", currentTotalScore);
    scores = {
      Y: 0,
      M: 0,
      C: 0,
      A: 0,
      clap: 0,
    };
  }

  // useEffect(() => {
  //   audio.load();
  // });

  // useEffect(() => {
  //   if (currentStep >= 0) {
  //     // const interval = setInterval(() => {
  //     //   loop();
  //     // }, 5);

  //     return () => {
  //       clearTimeout(timer);
  //     };
  //   }
  // }, [currentStep]);

  // useEffect(() => {
  //   if (currentStep >= 0) {
  //     document.getElementById("currentStep").innerHTML =
  //       dance.ymca.timings[currentStep].pose;
  //     const timer = setTimeout(() => {
  //       if (currentStep < dance.ymca.timings.length - 1) {
  //         // do score calculation here
  //         calculateScore();
  //         setCurrentStep(currentStep + 1);
  //       }
  //     }, (dance.ymca.timings[currentStep].beats * 60000) / dance.ymca.bpm);
  //     return () => {
  //       clearTimeout(timer);
  //     };
  //   }
  // }, [currentStep]);

  return (
    <div className="App">
      <div>Teachable Machine Pose Model</div>
      <div>
        <canvas id="canvas"></canvas>
      </div>
      <audio
        id="audio1"
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
