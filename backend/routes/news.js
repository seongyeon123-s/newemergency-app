const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const query   = req.query.query || '재난';
    const display = Number(req.query.display || 20);
    const sort    = req.query.sort || 'sim';

    // .env 값 정리
    const clientId    = (process.env.NAVER_CLIENT_ID || '').trim();
    const clientSecret= (process.env.NAVER_CLIENT_SECRET || '').trim();

    // 최소한의 유효성 검사 (영문/숫자/언더/하이픈만 허용)
    const isValid = (s) => /^[A-Za-z0-9_\-]+$/.test(s);
    if (!clientId || !clientSecret || !isValid(clientId) || !isValid(clientSecret)) {
      return res.status(500).json({
        ok: false,
        error: 'ENV_INVALID',
        detail: 'NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 값이 비었거나 유효하지 않습니다. .env를 확인하세요.',
      });
    }

    const { data } = await axios.get('https://openapi.naver.com/v1/search/news.json', {
      params: { query, display, sort },
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      timeout: 15000,
    });

    return res.json({ ok: true, items: data.items || [] });
  } catch (err) {
    console.error('[/news] error:', err.response?.status, err.response?.data || err.message);
    return res.status(500).json({
      ok: false,
      error: 'NAVER_API_ERROR',
      detail: err.response?.data || err.message,
    });
  }
});

module.exports = router;
