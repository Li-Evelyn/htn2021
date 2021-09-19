import React from "react";
import "./Landing.css";
import "./stars.scss";
import { useHistory } from "react-router-dom";

function Landing() {
  const history = useHistory();

  return (
    <div class="landing">
      <div id="stars"></div>
      <div id="stars2"></div>
      <div id="stars3"></div>
      <div class="filler"></div>
      <div class="background"></div>
      <h1>Clap. Dance. Pose.</h1>
      <button onClick={() => history.push("/play")}>begin</button>
    </div>
  );
}

export default Landing;
