// backend/api/index.js
const serverless = require("serverless-http");
const { app } = require("../index.js"); // backend/index.js에서 export한 app 가져오기

// Vercel은 default export된 함수(handler)를 실행함
module.exports = serverless(app);
