require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path"); // ✅ path 모듈 추가

const app = express();
const PORT = 3000;
const API_KEY = process.env.API_KEY; // .env에서 API 키 불러오기

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // 📁 public 폴더 정적 제공

const SCHOOL_API_URL = "https://open.neis.go.kr/hub/schoolInfo";
const MEAL_API_URL = "https://open.neis.go.kr/hub/mealServiceDietInfo";
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/html", "index.html"));
});

// 1️⃣ 학교 코드 검색 API
app.get("/api/school", async (req, res) => {
    const { schoolName } = req.query;
    try {
        const response = await axios.get(SCHOOL_API_URL, {
            params: { KEY: API_KEY, Type: "json", SCHUL_NM: schoolName },
        });

        const schoolData = response.data?.schoolInfo?.[1]?.row?.[0];
        if (schoolData) {
            res.json({
                educationOfficeCode: schoolData.ATPT_OFCDC_SC_CODE,
                schoolCode: schoolData.SD_SCHUL_CODE,
            });
        } else {
            res.status(404).json({ message: "학교를 찾을 수 없습니다." });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2️⃣ 급식 정보 조회 API
app.get("/api/meal", async (req, res) => {
    const { schoolCode, educationOfficeCode, date } = req.query;
    try {
        const response = await axios.get(MEAL_API_URL, {
            params: { KEY: API_KEY, Type: "json", ATPT_OFCDC_SC_CODE: educationOfficeCode, SD_SCHUL_CODE: schoolCode, MLSV_YMD: date },
        });

        const mealData = response.data?.mealServiceDietInfo?.[1]?.row;
        if (mealData) {
            res.json(mealData);
        } else {
            res.status(404).json({ message: "급식 정보를 찾을 수 없습니다." });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
