// /backend/types.ts (선택)
export type Shelter = {
  id: string;
  name: string;
  address: string;
  type: string;
  lat: number;
  lng: number;
  source: 'gov' | 'other';   // 어디서 온 데이터인지 표시
};
