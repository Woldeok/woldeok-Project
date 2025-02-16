const express = require("express");
const db = require("../db");
const path = require('path'); // ✅ path 모듈 추가

const router = express.Router();
router.get("/%EB%A1%9C%EA%B7%B8%EC%9D%B8", (req, res) => {
    console.log("✅ index.html 제공");
    res.sendFile(path.join(__dirname, "../public/html", "Login.html"));
});
module.exports = router;