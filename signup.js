const express = require("express");
const db = require("../db");
const router = express.Router();
signup.get("/%ED%9A%8C%EC%9B%90%EA%B0%80%EC%9E%85", (req, res) => {
    console.log("✅ index.html 제공");
    res.sendFile(path.join(__dirname, "public/html", "signup.html"));
});
