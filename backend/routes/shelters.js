const express = require('express');
const axios = require('axios');
const router = express.Router();

/* ---------- 유틸 ---------- */
const toNum = v => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};
const pickLng = it =>
  it?.REFINE_WGS84_LOGT ?? it?.REFINE_WGS84_LON ??
  it?.REFINE_WGS84_LONG ?? it?.REFINE_WGS84_LOT ??
  it?.LON ?? it?.LNG ?? it?.LOT ?? null;
const pickLat = it => it?.REFINE_WGS84_LAT ?? it?.LAT ?? null;

/* ---------- 1) 정부 대피소 ---------- */
async function fetchGov({ pageNo = 1, numOfRows = 500 }) {
  const key = process.env.SHELTER_API_KEY;
  if (!key) throw new Error('Missing SHELTER_API_KEY');
  const url = 'https://www.safetydata.go.kr/V2/api/DSSP-IF-10941';

  const r = await axios.get(url, {
    params: { serviceKey: key, pageNo, numOfRows, resultType: 'json' },
    timeout: 15000
  });

  const arr = Array.isArray(r.data?.body) ? r.data.body : [];
  return arr.map((it, i) => ({
    id: String(it?.id ?? `gov-${i}`),
    name: String(it?.REARE_NM ?? ''),
    address: String(it?.RONA_ADDR ?? ''),
    type: String(it?.SHLT_SE_NM ?? ''),
    lat: toNum(it?.LAT),
    lng: toNum(it?.LOT ?? it?.LON ?? it?.LNG),
    source: 'gov'
  })).filter(v => Number.isFinite(v.lat) && Number.isFinite(v.lng));
}

/* ---------- 2) 수용시설 ---------- */
async function fetchSpace({ pageNo = 1, numOfRows = 500 }) {
  const key = process.env.SPACE_API_KEY;
  if (!key) throw new Error('Missing SPACE_API_KEY');
  const url = 'https://www.safetydata.go.kr/V2/api/DSSP-IF-00008';

  const r = await axios.get(url, {
    params: { serviceKey: key, pageNo, numOfRows, resultType: 'json' },
    timeout: 15000
  });

  const arr = Array.isArray(r.data?.body) ? r.data.body : [];
  return arr.map((it, i) => ({
    id: String(it?.id ?? `space-${i}`),
    name: String(it?.FACLT_NM ?? ''),
    address: String(it?.REFINE_LOTNO_ADDR ?? it?.REFINE_ROADNM_ADDR ?? ''),
    type: '수용시설',
    lat: toNum(pickLat(it)),
    lng: toNum(pickLng(it)),
    source: 'space'
  })).filter(v => Number.isFinite(v.lat) && Number.isFinite(v.lng));
}

/* ---------- 병합 라우트 ---------- */
router.get('/', async (req, res) => {
  const pageNo = Number(req.query?.pageNo ?? 1);
  const numOfRows = Number(req.query?.numOfRows ?? 300);
  const source = String(req.query?.source ?? 'all'); // gov | space | all
  try {
    let gov = [], space = [];
    if (source === 'gov' || source === 'all')  gov = await fetchGov({ pageNo, numOfRows });
    if (source === 'space' || source === 'all') space = await fetchSpace({ pageNo, numOfRows });
    const items = source === 'gov' ? gov : source === 'space' ? space : [...gov, ...space];
    res.json({ ok: true, total: items.length, gov: gov.length, space: space.length, items });
  } catch (e) {
    console.error('[/shelters]', e.response?.status, e.response?.data || e.message);
    res.status(500).json({ ok: false, error: e.message, raw: e.response?.data });
  }
});

/* ---------- 원본 확인용 디버그 ---------- */
router.get('/debug', async (req, res) => {
  const type = req.query.source || 'space'; // gov | space
  const key = type === 'space' ? process.env.SPACE_API_KEY : process.env.SHELTER_API_KEY;
  const url = type === 'space'
    ? 'https://www.safetydata.go.kr/V2/api/DSSP-IF-00008'
    : 'https://www.safetydata.go.kr/V2/api/DSSP-IF-10941';
  try {
    const r = await axios.get(url, { params: { serviceKey: key, pageNo: 1, numOfRows: 1, resultType: 'json' }});
    res.json({ ok: true, url, params: { pageNo: 1, numOfRows: 1, resultType: 'json' }, sample: r.data?.body?.[0] ?? r.data });
  } catch (e) {
    res.json({ ok: false, url, status: e.response?.status, body: e.response?.data || e.message });
  }
});

module.exports = router;
