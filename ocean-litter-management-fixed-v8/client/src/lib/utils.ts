import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 두 지점(위도, 경도) 사이의 거리를 킬로미터(km) 단위로 계산합니다.
 * Haversine 공식을 사용합니다.
 * @param lat1 현재 위치 위도
 * @param lon1 현재 위치 경도
 * @param lat2 수거 지점 위도
 * @param lon2 수거 지점 경도
 * @returns 두 지점 사이의 거리 (km)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // 지구의 반지름 (킬로미터)
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // 거리 (km)
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
