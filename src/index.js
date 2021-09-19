import React from "react";
import ReactDOM from "react-dom";
import { Route, Switch, BrowserRouter as Router } from "react-router-dom";
import "./index.css";
import App from "./App";
import Landing from "./Landing";
import reportWebVitals from "./reportWebVitals";

const routing = (
  <Router>
    <Switch>
      <Route exact path="/" component={Landing} />
      <Route exact path="/play" component={App} />
    </Switch>
  </Router>
);

ReactDOM.render(routing, document.getElementById("root"));

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
