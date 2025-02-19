const mysql = require('mysql2/promise'); // ✅ mysql2/promise 사용
require('dotenv').config();

// MySQL 연결을 Promise 기반으로 설정
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'woldeok',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool; // ✅ pool을 내보내기
