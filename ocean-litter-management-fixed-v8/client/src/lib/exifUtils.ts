import piexif from 'piexifjs';

/// <reference path="./piexifjs.d.ts" />

/**
 * EXIF 데이터에서 GPS 정보 추출
 */
export interface GPSData {
  latitude: number | null;
  longitude: number | null;
}

/**
 * EXIF GPS 좌표를 10진수로 변환
 */
function convertGPSCoordinate(coord: any[]): number {
  if (!Array.isArray(coord) || coord.length < 3) {
    return 0;
  }
  
  // [degrees, minutes, seconds] 형식
  const degrees = (coord[0] as any)[0] / (coord[0] as any)[1];
  const minutes = (coord[1] as any)[0] / (coord[1] as any)[1];
  const seconds = (coord[2] as any)[0] / (coord[2] as any)[1];
  
  return degrees + minutes / 60 + seconds / 3600;
}

/**
 * 이미지 파일에서 EXIF GPS 데이터 추출
 */
export async function extractGPSFromImage(file: File): Promise<GPSData> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const exif = piexif.load(data);
        
        // GPS IFD 확인
        const gps = exif.get('GPS');
        if (!gps) {
          resolve({ latitude: null, longitude: null });
          return;
        }
        
        // GPS 태그 확인
        const gpsIfd = (exif as any)['GPS'];
        if (!gpsIfd) {
          resolve({ latitude: null, longitude: null });
          return;
        }
        
        // 위도 (GPSLatitude = 2)
        const latitudeData = (gpsIfd as any)[piexif.GPSIFD.GPSLatitude];
        // 경도 (GPSLongitude = 4)
        const longitudeData = (gpsIfd as any)[piexif.GPSIFD.GPSLongitude];
        // 위도 방향 (GPSLatitudeRef = 1, 'N' 또는 'S')
        const latitudeRef = (gpsIfd as any)[piexif.GPSIFD.GPSLatitudeRef];
        // 경도 방향 (GPSLongitudeRef = 3, 'E' 또는 'W')
        const longitudeRef = (gpsIfd as any)[piexif.GPSIFD.GPSLongitudeRef];
        
        if (!latitudeData || !longitudeData) {
          resolve({ latitude: null, longitude: null });
          return;
        }
        
        // 좌표 변환
        let latitude = convertGPSCoordinate(latitudeData);
        let longitude = convertGPSCoordinate(longitudeData);
        
        // 방향에 따라 음수 처리
        if (latitudeRef && latitudeRef[0] === 'S') {
          latitude = -latitude;
        }
        if (longitudeRef && longitudeRef[0] === 'W') {
          longitude = -longitude;
        }
        
        resolve({
          latitude: parseFloat(latitude.toFixed(6)),
          longitude: parseFloat(longitude.toFixed(6))
        });
      } catch (error) {
        console.error('EXIF 추출 오류:', error);
        resolve({ latitude: null, longitude: null });
      }
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 이미지 파일에서 EXIF 데이터 추출 (DataURL 형식)
 */
export async function extractGPSFromDataURL(dataUrl: string): Promise<GPSData> {
  return new Promise((resolve) => {
    try {
      const exif = piexif.load(dataUrl);
      
      // GPS IFD 확인
      const gpsIfd = (exif as any)['GPS'];
      if (!gpsIfd) {
        resolve({ latitude: null, longitude: null });
        return;
      }
      
      // 위도 (GPSLatitude = 2)
      const latitudeData = (gpsIfd as any)[piexif.GPSIFD.GPSLatitude];
      // 경도 (GPSLongitude = 4)
      const longitudeData = (gpsIfd as any)[piexif.GPSIFD.GPSLongitude];
      // 위도 방향 (GPSLatitudeRef = 1)
      const latitudeRef = (gpsIfd as any)[piexif.GPSIFD.GPSLatitudeRef];
      // 경도 방향 (GPSLongitudeRef = 3)
      const longitudeRef = (gpsIfd as any)[piexif.GPSIFD.GPSLongitudeRef];
      
      if (!latitudeData || !longitudeData) {
        resolve({ latitude: null, longitude: null });
        return;
      }
      
      // 좌표 변환
      let latitude = convertGPSCoordinate(latitudeData);
      let longitude = convertGPSCoordinate(longitudeData);
      
      // 방향에 따라 음수 처리
      if (latitudeRef && latitudeRef[0] === 'S') {
        latitude = -latitude;
      }
      if (longitudeRef && longitudeRef[0] === 'W') {
        longitude = -longitude;
      }
      
      resolve({
        latitude: parseFloat(latitude.toFixed(6)),
        longitude: parseFloat(longitude.toFixed(6))
      });
    } catch (error) {
      console.error('EXIF 추출 오류:', error);
      resolve({ latitude: null, longitude: null });
    }
  });
}
