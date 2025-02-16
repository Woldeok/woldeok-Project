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

// ✅ 서버 실행 로그
console.log("✅ 서버 시작됨");

// ✅ 모든 요청에 대해 로그 출력하는 미들웨어
app.use((req, res, next) => {
    console.log(`📌 요청: ${req.method} ${req.url}`);
    if (Object.keys(req.query).length > 0) {
        console.log("   📍 요청 쿼리:", req.query);
    }
    next();
});

// 📌 메인 페이지 제공
app.get("/", (req, res) => {
    console.log("✅ index.html 제공");
    res.sendFile(path.join(__dirname, "public/html", "index.html"));
});

// 1️⃣ 학교 코드 검색 API
app.get("/api/school", async (req, res) => {
    const { educationOfficeCode, schoolName } = req.query;
    console.log(`📚 학교 검색 요청: 교육청(${educationOfficeCode}), 학교(${schoolName})`);

    try {
        const response = await axios.get(SCHOOL_API_URL, {
            params: { KEY: API_KEY, Type: "json", SCHUL_NM: schoolName },
        });

        const schoolList = response.data?.schoolInfo?.[1]?.row;
        if (!schoolList || schoolList.length === 0) {
            console.warn(`⚠️ 해당 학교가 존재하지 않음: ${schoolName}`);
            return res.status(404).json({ message: "해당 학교를 찾을 수 없습니다." });
        }

        // ✅ 사용자가 선택한 교육청에서 학교가 있는지 확인
        const matchedSchool = schoolList.find(school => school.ATPT_OFCDC_SC_CODE === educationOfficeCode);

        if (!matchedSchool) {
            // ✅ 다른 교육청에서 해당 학교가 있는지 찾기
            const otherEducationOffice = schoolList[0].ATPT_OFCDC_SC_CODE;
            const otherEducationOfficeName = schoolList[0].ATPT_OFCDC_SC_NM;
            console.warn(`⚠️ 선택한 교육청(${educationOfficeCode})에 해당 학교 없음. 다른 교육청(${otherEducationOffice})에서 발견됨.`);

            return res.status(404).json({
                message: `⚠️ 선택한 교육청(${educationOfficeCode})에 해당 학교가 없습니다. \n📌 ${otherEducationOfficeName}(${otherEducationOffice})에서 확인되었습니다.`,
                correctEducationOfficeCode: otherEducationOffice
            });
        }

        console.log("✅ 학교 검색 결과:", matchedSchool);
        res.json({
            educationOfficeCode: matchedSchool.ATPT_OFCDC_SC_CODE,
            schoolCode: matchedSchool.SD_SCHUL_CODE,
        });

    } catch (error) {
        console.error("❌ 학교 검색 오류:", error.message);
        res.status(500).json({ error: error.message });
    }
});



// 2️⃣ 급식 정보 조회 API
app.get("/api/meal", async (req, res) => {
    const { schoolCode, educationOfficeCode, date } = req.query;

    if (!schoolCode || !educationOfficeCode || !date) {
        console.warn("⚠️ 필수 파라미터 누락:", req.query);
        return res.status(400).json({ error: "필수 파라미터가 누락되었습니다." });
    }

    console.log(`🍽️ 급식 조회 요청: 학교코드(${schoolCode}), 교육청코드(${educationOfficeCode}), 날짜(${date})`);

    try {
        const response = await axios.get(MEAL_API_URL, {
            params: {
                KEY: API_KEY,
                Type: "json",
                ATPT_OFCDC_SC_CODE: educationOfficeCode,
                SD_SCHUL_CODE: schoolCode,
                MLSV_YMD: date, // YYYYMMDD 형식
            },
        });

        if (response.data.mealServiceDietInfo) {
            console.log("✅ 급식 정보 응답:", response.data.mealServiceDietInfo[1].row);
            res.json(response.data.mealServiceDietInfo[1].row);
        } else {
            console.warn("⚠️ 해당 날짜의 급식 정보 없음:", date);
            res.status(404).json({ message: "해당 날짜의 급식 정보가 없습니다." });
        }
    } catch (error) {
        console.error("❌ 급식 정보 조회 오류:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ✅ 서버 실행
app.listen(PORT, () => console.log(`🚀 서버 실행 중: http://localhost:${PORT}`));
