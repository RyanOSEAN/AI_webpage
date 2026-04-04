declare module 'piexifjs' {
  export interface GPSIFD {
    GPSLatitude: number;
    GPSLongitude: number;
    GPSLatitudeRef: number;
    GPSLongitudeRef: number;
  }

  export const GPSIFD: {
    GPSLatitude: number;
    GPSLongitude: number;
    GPSLatitudeRef: number;
    GPSLongitudeRef: number;
  };

  export function load(data: string | ArrayBuffer): any;
  export function dump(exif: any): string;
  export function insert(exif: string, jpeg: ArrayBuffer): ArrayBuffer;
  export function remove(jpeg: ArrayBuffer): ArrayBuffer;
}
