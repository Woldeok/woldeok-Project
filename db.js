require("dotenv").config();
const mysql = require("mysql2/promise");

// MySQL 데이터베이스 연결 설정
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,  // 최대 연결 수
    queueLimit: 0
});

// 데이터베이스 연결 테스트
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log("✅ MySQL 데이터베이스 연결 성공");
        connection.release(); // 연결 반환
    } catch (error) {
        console.error("❌ MySQL 연결 실패:", error.message);
    }
})();

module.exports = pool;
