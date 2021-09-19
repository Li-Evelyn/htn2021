const express = require("express");
const multer = require("multer");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + ".wav"); //Appending .wav
  },
});

var upload = multer({ storage: storage });
const _ = require("lodash");
const { exec } = require("child_process");

const app = express();
const port = 3001;

app.get("/api", (req, res) => {
  exec("rune run yamnet.rune --sound clapping.wav", (error, stdout, stderr) => {
    const startPos = stderr.search(':\\[\\"');
    const endPos = stderr.search(`\\"dimensions\\":\\[3\\]\\}\\]`);
    const classifications = stderr
      .substring(startPos + 3, endPos - 3)
      .split(`","`);
    console.log("classifications:", startPos + 3, endPos - 3, classifications);
    // if (error) {
    //   console.error(`error: ${error.message}`);
    //   // return;
    // }

    // if (stderr) {
    //   console.error(`stderr: \n${stderr}`);
    //   // return;
    // }

    // console.log(`stdout:\n${stdout}`);
    console.error(`stderr: \n${stderr}`);
    // console.error(`error: ${error.message}`);
    console.log(`stdout:\n${stdout}`);
    res.send(JSON.stringify(classifications));
  });
  // res.send("Hello World!");
});

app.post("/api/classify", upload.single("audio"), (req, res) => {
  console.log(req.file);
  exec(
    `rune run yamnet.rune --sound ${req.file.path}`,
    (error, stdout, stderr) => {
      console.error(`stderr: \n${stderr}`);
      // console.error(`error: ${error.message}`);
      console.log(`stdout:\n${stdout}`);
      const startPos = stderr.search(':\\[\\"');
      const endPos = stderr.search(`\\"dimensions\\":\\[3\\]\\}\\]`);
      const classifications = stderr
        .substring(startPos + 3, endPos - 3)
        .split(`","`);
      console.log(
        "classifications:",
        startPos + 3,
        endPos - 3,
        classifications
      );
      res.send(JSON.stringify(classifications));
    }
  );
});

app.listen(port, () => {
  console.log(
    `Yamnet audio classification app listening at http://localhost:${port}`
  );
});
