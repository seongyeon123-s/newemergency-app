// controllers/shelterController.js
const { fetchShelters } = require('../services/shelterService');

async function getShelters(req, res) {
  try {
    // ✅ 쿼리 가드
    const pageNo = Number(req.query?.pageNo ?? 1);
    const numOfRows = Number(req.query?.numOfRows ?? 100);

    const items = await fetchShelters({ pageNo, numOfRows }); // ✅ 항상 객체 전달
    res.json({ ok: true, items });
  } catch (e) {
    console.error('GET /shelters error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
}

module.exports = { getShelters };
