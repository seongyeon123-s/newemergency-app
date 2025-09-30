const axios = require('axios');

/** 1) 정부 대피소 API */
async function fetchShelters({ pageNo = 1, numOfRows = 100 }) {
  try {
    const r = await axios.get('https://www.safetydata.go.kr/V2/api/DSSP-IF-10941', {
      params: {
        serviceKey: process.env.SHELTER_API_KEY, // .env에 넣은 키
        pageNo,
        numOfRows,
        resultType: 'json', // JSON 응답 강제
      },
      timeout: 15000,
    });

    console.log('행안부 대피소 API 응답:', r.data);

    const items = Array.isArray(r.data?.body) ? r.data.body : [];

    return items.map((it, idx) => ({
      id: `gov-${idx}`,
      name: it.REARE_NM ?? '',
      address: it.RONA_ADDR ?? '',
      type: it.SHLT_SE_NM ?? '대피소',
      lat: Number(it.LAT),
      lng: Number(it.LOT ?? it.LON ?? it.LNG),
      source: 'gov',
    })).filter(v => Number.isFinite(v.lat) && Number.isFinite(v.lng));
  } catch (e) {
    console.error('행안부 대피소 API 호출 실패:', e.message);
    return [];
  }
}

/** 2) 수용_공간_시설 API */
async function fetchSpace({ pageNo = 1, numOfRows = 100 }) {
  try {
    const r = await axios.get('https://www.safetydata.go.kr/V2/api/DSSP-IF-00008', {
      params: {
        serviceKey: process.env.SPACE_API_KEY, // .env에 넣은 키
        pageNo,
        numOfRows,
        resultType: 'json',
      },
      timeout: 15000,
    });

    console.log('행안부 수용시설 API 응답:', r.data);

    const items = Array.isArray(r.data?.body) ? r.data.body : [];

    return items.map((it, idx) => ({
      id: `space-${idx}`,
      name: it.FACLT_NM ?? '',
      address: it.REFINE_LOTNO_ADDR ?? it.REFINE_ROADNM_ADDR ?? '',
      type: '수용시설',
      lat: Number(it.REFINE_WGS84_LAT),
      lng: Number(it.REFINE_WGS84_LOGT),
      source: 'space',
    })).filter(v => Number.isFinite(v.lat) && Number.isFinite(v.lng));
  } catch (e) {
    console.error('행안부 수용시설 API 호출 실패:', e.message);
    return [];
  }
}

/** 3) 합쳐서 쓰고 싶으면 이거 사용 */
async function fetchAllShelters({ pageNo = 1, numOfRows = 100 }) {
  const gov = await fetchShelters({ pageNo, numOfRows });
  const space = await fetchSpace({ pageNo, numOfRows });
  return [...gov, ...space];
}

module.exports = { fetchShelters, fetchSpace, fetchAllShelters };
