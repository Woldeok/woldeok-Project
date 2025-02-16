const express = require("express");
const db = require("../db");
const path = require('path'); // ✅ path 모듈 추가
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();


const router = express.Router();
router.get("/%ED%9A%8C%EC%9B%90%EA%B0%80%EC%9E%85", (req, res) => {
    console.log("✅ signup.html 제공");
    res.sendFile(path.join(__dirname, "../public/html", "signup.html"));
});
router.post('/signup', async (req, res) => {
    const { id, email, password } = req.body;
    console.log("✅ 회원가입 시도: ", { id, email, password: "[PROTECTED]" });
    
    if (!id || !email || !password) {
        console.log("❌ 입력값 누락");
        return res.status(400).json({ message: '아이디, 이메일, 비밀번호를 입력하세요.' });
    }

    try {
        console.log("🔍 아이디 중복 확인");
        db.query('SELECT * FROM user WHERE id = ?', [id], async (err, results) => {
            if (err) {
                console.error("❌ 데이터베이스 오류: ", err);
                return res.status(500).json({ message: '데이터베이스 오류', error: err });
            }

            if (results.length > 0) {
                console.log("❌ 이미 존재하는 아이디: ", id);
                return res.status(400).json({ message: '이미 존재하는 아이디입니다.' });
            }

            console.log("🔐 비밀번호 해싱 중...");
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const userRole = 'user';
            console.log("✅ 새로운 사용자 저장: ", { id, email, role: userRole });
            
            db.query(
                'INSERT INTO user (id, email, password, role) VALUES (?, ?, ?, ?)',
                [id, email, hashedPassword, userRole],
                (err, result) => {
                    if (err) {
                        console.error("❌ 사용자 저장 실패: ", err);
                        return res.status(500).json({ message: '데이터베이스 오류', error: err });
                    }

                    console.log("🔑 JWT 토큰 생성 중...");
                    const token = jwt.sign({ id, email }, process.env.JWT_SECRET, {
                        expiresIn: '1h'
                    });

                    console.log("✅ 회원가입 성공, 토큰 발급 완료");
                    res.status(201).json({ message: '회원가입 성공!', token });
                }
            );
        });
    } catch (error) {
        console.error("❌ 서버 오류: ", error);
        res.status(500).json({ message: '서버 오류' });
    }
});


module.exports = router;