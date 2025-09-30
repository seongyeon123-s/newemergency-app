// backend/index.js
require('dotenv').config(); // ✅ 최상단에서 .env 로드

const express = require('express');
const cors = require('cors');

const sheltersRoute = require('./routes/shelters');
let newsRoute = null;
try {
  // news 라우트가 아직 없다면 이 require는 실패할 수 있음 → try/catch
  newsRoute = require('./routes/news');
} catch (e) {
  console.warn('ℹ️  /routes/news 가 없어 /news 라우트를 건너뜁니다. (무시 가능)', e.message);
}

const app = express();

/* -------------------- 미들웨어 -------------------- */
const ALLOW_ORIGIN = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: (origin, cb) => {
      // 개발 편의를 위해 origin 없을 때(같은 오리진/포스트맨 등) 허용
      if (!origin || ALLOW_ORIGIN === '*') return cb(null, true);
      // 여러 오리진 허용 (쉼표 구분)
      const white = ALLOW_ORIGIN.split(',').map((s) => s.trim());
      return cb(null, white.includes(origin));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' })); // JSON body 파싱

/* -------------------- 라우트 -------------------- */
// 헬스체크
app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Backend server is healthy 🚀' });
});

// 대피소
app.use('/shelters', sheltersRoute);

// 네이버 뉴스 (있을 때만)
if (newsRoute) {
  app.use('/news', newsRoute);
}

/* -------------------- 404 처리 -------------------- */
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not Found', path: req.originalUrl });
});

/* -------------------- 에러 핸들러 -------------------- */
app.use((err, req, res, next) => {
  console.error('🔥 Server error:', err.stack || err.message || err);
  // 이미 헤더가 전송되었다면 Express 기본 처리로 위임
  if (res.headersSent) return next(err);
  res.status(500).json({ ok: false, error: 'Internal Server Error' });
});

/* -------------------- 서버 시작 -------------------- */
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`✅ API running at http://localhost:${PORT}`);
});

/* -------------------- 전역 예외 로깅 -------------------- */
process.on('unhandledRejection', (reason) => {
  console.error('⚠️  Unhandled Promise Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('⚠️  Uncaught Exception:', err);
  // 필요 시 서버를 안전하게 종료하도록 신중히 결정하세요.
  // process.exit(1);
});

// (테스트용) export 가능하도록
module.exports = { app, server };

