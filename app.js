require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path"); // ✅ path 모듈 추가
const db = require("./db");
const backup = require("./backup");

const fs = require("fs"); // ✅ 파일 시스템 모듈 추가

const API_KEY = process.env.API_KEY; // .env에서 API 키 불러오기
const pino = require("pino");
const pinoHttp = require("pino-http");
const rfs = require("rotating-file-stream");
const LOG_DIR = path.join(__dirname, "logs/logs"); // 로그 디렉토리 경로

// 로그 디렉토리 생성 (없다면 생성)
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
}

// ✅ 1시간마다 새로운 로그 파일 생성
const logStream = rfs.createStream((time, index) => {
    if (!time) return "app.log"; // 초기 파일 이름
    const date = new Date(time);
    return `app-${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}-${date
        .getHours()
        .toString()
        .padStart(2, "0")}.log`;
}, {
    interval: "1h", // 1시간마다 새 파일 생성
    path: LOG_DIR
});
// ✅ Pino 로거 생성 (파일에 즉시 저장)
const logger = pino(
    {
        level: "info",
        transport: {
            target: "pino-pretty",
            options: { colorize: true }
        }
    },
    logStream // 로그를 파일에 저장
);
const app = express();
const PORT = 8080;
// ✅ Pino HTTP 미들웨어 (모든 요청 자동 로깅)
app.use(pinoHttp({ logger }));

// ✅ 5시간 지난 로그 자동 삭제
const cleanOldLogs = () => {
    const now = Date.now();
    fs.readdir(LOG_DIR, (err, files) => {
        if (err) {
            console.error("❌ 로그 파일 목록을 불러오는 중 오류 발생:", err);
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(LOG_DIR, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error("❌ 파일 정보를 가져오는 중 오류 발생:", err);
                    return;
                }

                const fileAge = (now - stats.mtimeMs) / (1000 * 60 * 60); // 시간 단위 계산
                if (fileAge > 5) {
                    fs.unlink(filePath, (err) => {
                        if (!err) {
                            console.log(`🗑️  ${file} 삭제됨 (5시간 경과)`);
                        }
                    });
                }
            });
        });
    });
};

// ✅ 1시간마다 로그 정리 실행
setInterval(cleanOldLogs, 60 * 60 * 1000); // 1시간마다 실행

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // 📁 public 폴더 정적 제공

const SCHOOL_API_URL = "https://open.neis.go.kr/hub/schoolInfo";
const MEAL_API_URL = "https://open.neis.go.kr/hub/mealServiceDietInfo";

// ✅ 서버 실행 로그
console.log("✅ 서버 시작됨");

const signupRouter = require('./Backend/signup'); // 라우터 가져오기
app.use('/', signupRouter); // '/signup' 경로에 라우터 적용
const Login = require('./Backend/Login'); // 라우터 가져오기
app.use('/', Login); // '/signup' 경로에 라우터 적용


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
