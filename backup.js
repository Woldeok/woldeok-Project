require("dotenv").config();
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// ✅ Windows 환경에서 mysqldump.exe의 절대 경로 설정
const MYSQLDUMP_PATH = `"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe"`; // MySQL 버전에 맞게 수정

// ✅ 백업 디렉토리 설정
const BACKUP_DIR = path.join(__dirname, "backups");

// ✅ 백업 디렉토리가 없으면 생성
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// ✅ 데이터베이스 백업 실행 함수
const backupDatabase = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);

    // 백업 명령어 실행
    const command = `${MYSQLDUMP_PATH} -h ${process.env.DB_HOST} -u ${process.env.DB_USER} --password=${process.env.DB_PASSWORD} ${process.env.DB_NAME} > "${backupFile}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ 백업 실패: ${error.message}`);
            return;
        }
        console.log(`✅ 백업 완료: ${backupFile}`);
    });
};

// ✅ 1주일이 지난 백업 파일 자동 삭제
const deleteOldBackups = () => {
    const files = fs.readdirSync(BACKUP_DIR);
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7일 전 시간 계산

    files.forEach(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const fileStat = fs.statSync(filePath);

        if (fileStat.mtimeMs < oneWeekAgo) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ 오래된 백업 삭제: ${file}`);
        }
    });
};

// ✅ 서버 실행 후 즉시 첫 번째 백업 실행
console.log("🚀 서버 실행됨. 첫 번째 백업 시작...");
backupDatabase();
deleteOldBackups();

// ✅ 10분마다 실행 (600,000ms)
setInterval(() => {
    console.log("🔄 10분마다 백업 실행 중...");
    backupDatabase();
    deleteOldBackups();
}, 600000);

console.log("✅ 자동 백업 스크립트 시작됨 (10분마다 실행)");
