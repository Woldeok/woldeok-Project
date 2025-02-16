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
    console.log("✅ signup 회원가입시도");
    if (!id || !email || !password) {
        return res.status(400).json({ message: '아이디, 이메일, 비밀번호를 입력하세요.' });
    }

    try {
        // **아이디 중복 확인**
        db.query('SELECT * FROM user WHERE id = ?', [id], async (err, results) => {
            if (err) {
                return res.status(500).json({ message: '데이터베이스 오류', error: err });
            }

            if (results.length > 0) {
                return res.status(400).json({ message: '이미 존재하는 아이디입니다.' });
            }

            // 비밀번호 해싱
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // 기본 역할 설정 (기본값: 'user')
            const userRole = 'user';

            // 사용자 저장
            db.query(
                'INSERT INTO user (id, email, password, role) VALUES (?, ?, ?, ?)',
                [id, email, hashedPassword, userRole],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: '데이터베이스 오류', error: err });
                    }

                    // JWT 토큰 생성
                    const token = jwt.sign({ id, email }, process.env.JWT_SECRET, {
                        expiresIn: '1h'
                    });

                    res.status(201).json({ message: '회원가입 성공!', token });
                }
            );
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류' });
    }
});

module.exports = router;