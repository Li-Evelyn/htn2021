import { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import "./Landing.css";
import * as tf from "@tensorflow/tfjs";
import * as tmPose from "@teachablemachine/pose";
import * as dance from "./dance.json";
import ReactPlayer from "react-player";
// import music from "./YMCA.wav";

import AudioReactRecorder, { RecordState } from "audio-react-recorder";

function App(props) {
  const search = props.location.search;
  const challenge = new URLSearchParams(search).get("challenge");
  console.log("chllange", challenge);
  const [recordState, setRecordState] = useState(null);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [audioClassifications, setAudioClassifications] = useState([]);
  const [playing, setPlaying] = useState(false);
  // let audioClassifications = [];
  // let audio = new Audio("./YMCA.mp3");
  let model, ctx, webcam, labelContainer, maxPredictions;
  const URL = "https://teachablemachine.withgoogle.com/models/iVB1AnIP3/";
  let scores = {
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

  async function onStop(audioData) {
    console.log("hello");
    console.log("audioData", audioData);
    setRecordedAudio(audioData);
    // send audio for classification
    var fd = new FormData();
    console.log("recorded audio", audioData);
    var audioFile = new File([audioData.blob], "recorded_audio");
    fd.append("audio", audioFile);
    console.log("sending audio");
    const result = await fetch("/api/classify", {
      headers: { Accept: "application/json" },
      method: "POST",
      body: fd,
    });
    const resJson = await result.json();
    console.log("audio classifications", resJson);
    setAudioClassifications(resJson);
    // score the claps
    let elem = document.getElementById("score");
    let elemTotal = document.getElementById("total");
    let streakElem = document.getElementById("streak");
    if (resJson.length < 3) {
      // recognition error occured
      console.log("Ok"); // give em a pass for it
      elem.style.color = "orange";
      // currentTotalScore += 15;
      streak = 0;
    } else if (
      resJson.includes("Applause") ||
      resJson.includes("Clapping") ||
      resJson.includes("Sound effect")
    ) {
      elem.innerHTML = "Perfect";
      console.log("perfect");
      // currentTotalScore += 50 + streak * 5;
      elem.style.color = "green";
      // streak++;
    } else if (resJson.includes("Speech") || resJson.includes("Music")) {
      elem.innerHTML = "Good";
      console.log("Good");
      elem.style.color = "yellow";
      // currentTotalScore += 30 + streak * 5;
      streak++;
    } else if (resJson[0] == "Silence") {
      elem.innerHTML = "Miss";
      console.log("Miss");
      elem.style.color = "red";
      // streak = 0;
    } else {
      elem.innerHTML = "Ok";
      console.log("Ok");
      elem.style.color = "orange";
      // currentTotalScore += 15;
      // streak = 0;
    }
    elemTotal.innerHTML = currentTotalScore;
    streakElem.innerHTML = streak;
    if (streak > 5) {
      streakElem.style.color = "green";
    } else if (streak > 3) {
      streakElem.style.color = "yellow";
    } else if (streak > 0) {
      streakElem.style.color = "orange";
    } else {
      streakElem.style.color = "white";
    }
    // elem.innerHTML = "I DID A CLAP" + Date.now();
    // .then((res) => res.json())
    // .then((result) => {
    //   console.log(result);
    //   setAudioClassifications(result);
    //   // audioClassifications = result;
    //   console.log("audio classifications", audioClassifications);
    // });
    // recordedAudio = audioData;
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
    console.log("recorded audio", recordedAudio);
    var audioFile = new File([recordedAudio.blob], "recorded_audio");
    fd.append("audio", audioFile);
    console.log("sending audio");
    const result = await fetch("/api/classify", {
      headers: { Accept: "application/json" },
      method: "POST",
      body: fd,
    });
    // .then((res) => res.json())
    // .then((result) => console.log(result));
    // console.log(res);
    return result.json();
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
    setPlaying(true);

    // append/get elements to the DOM
    const canvas = document.getElementById("canvas");
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");
    // labelContainer = document.getElementById("label-container");
    // for (let i = 0; i < maxPredictions; i++) {
    //   // and class labels
    //   labelContainer.appendChild(document.createElement("div")); // predictions
    // }
    // audio.play();
    // document.getElementById("audio1").play();
    window.requestAnimationFrame(run);
    start(); // make sure recording starts
    setPlaying(true);
  }

  async function run() {
    setPlaying(true);
    let song = dance.ymca;
    document.getElementById("currentStep").innerHTML =
      dance.ymca.timings[currentStep].pose;
    // start recording at "clap", end at "endclap"
    if (dance.ymca.timings[currentStep].pose == "clap") {
      start();
    } else if (dance.ymca.timings[currentStep].pose == "endclap") {
      stop();
    }
    const timer = setTimeout(() => {
      should_exit = true;
    }, (dance.ymca.timings[currentStep].beats * 60000) / dance.ymca.bpm);
    while (!should_exit) {
      webcam.update();
      await predict();
    }
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
      let congrats = "";
      if (challenge && currentTotalScore > challenge) {
        document.getElementById("endscreen").innerHTML =
          "You did it! " + "Your final score was " + currentTotalScore + "🎉";
        document.getElementById("challenge").innerHTML =
          "Challenge your friends: http://localhost:3000/home?challenge=" +
          currentTotalScore;
      } else if (challenge) {
        document.getElementById("endscreen").innerHTML =
          "Your final score was " + currentTotalScore + " ):";
        document.getElementById("challenge").innerHTML = "Try again?";
      } else {
        document.getElementById("endscreen").innerHTML =
          "Your final score was " + currentTotalScore;
        document.getElementById("challenge").innerHTML =
          "Challenge your friend: http://localhost:3000/home?challenge=" +
          currentTotalScore;
      }
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
      //labelContainer.childNodes[i].innerHTML = classPrediction;
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
    let elemTotal = document.getElementById("total");
    let streakElem = document.getElementById("streak");
    console.log("calculation: ", scores, "score: ", scores[pose]);
    let score = scores[pose];
    if (score >= 0.5) {
      elem.innerHTML = "Perfect";
      currentTotalScore += 50 + streak * 5;
      elem.style.color = "green";
      streak++;
    } else if (score >= 0.25) {
      elem.innerHTML = "Good";
      elem.style.color = "yellow";
      currentTotalScore += 30 + streak * 5;
      streak++;
    } else if (score >= 0.1) {
      elem.innerHTML = "OK";
      elem.style.color = "orange";
      currentTotalScore += 15;
      streak = 0;
    } else {
      elem.innerHTML = "Miss";
      elem.style.color = "red";
      streak = 0;
    }
    elemTotal.innerHTML = currentTotalScore;
    streakElem.innerHTML = streak;
    if (streak > 5) {
      streakElem.style.color = "green";
    } else if (streak > 3) {
      streakElem.style.color = "yellow";
    } else if (streak > 0) {
      streakElem.style.color = "orange";
    } else {
      streakElem.style.color = "white";
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

  return (
    <div className="App">
      <h1>MEWSdance Model</h1>
      {challenge && <h3>CAN YOU BEAT {challenge}?</h3>}
      <div class="info">
        <div>
          <canvas id="canvas"></canvas>
        </div>
        <div>
          <ReactPlayer
            url="https://youtu.be/IVgqR3HGXKg"
            playing={playing}
            width={"500px"}
          />
          ;
        </div>
        <div class="score">
          <h2>Current Step:</h2>
          <div id="currentStep" class="wow"></div>
          <h2>Current Score:</h2>
          <div id="score" class="wow"></div>
          <h2>Total Score:</h2>
          <div id="total" class="wow"></div>
          <h2>Streak!</h2>
          <div id="streak" class="wow"></div>
        </div>
      </div>
      {/* <audio
        id="audio1"
        preload="auto"
        src="http://freewavesamples.com/files/Korg-Triton-Slow-Choir-ST-C4.wav"
        type="audio/wav"
        class="noshow"
      ></audio> */}
      <button type="button" onClick={init}>
        Start
      </button>
      <div id="label-container"></div>
      <div class="hidden">
        <AudioReactRecorder state={recordState} onStop={onStop} />

        <button onClick={start}>Start</button>
        <button onClick={stop}>Stop</button>
        <button onClick={sendAudio}>Send Audio</button>
      </div>
      <div id="currentStep"></div>
      <div id="score"></div>
      <div id="endscreen"></div>
      <div id="challenge"></div>
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
