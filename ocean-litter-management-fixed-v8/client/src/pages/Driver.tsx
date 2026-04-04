'use client';

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, MapPin, CheckCircle, Navigation, AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const KOREA_CENTER: [number, number] = [36.5, 127.5];
const DEFAULT_ZOOM = 7;

function MapViewHandler({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function LocationTracker({ setCarrierLocation }: { setCarrierLocation: (lat: number, lng: number) => void }) {
  const map = useMap();
  const [position, setPosition] = useState<L.LatLng | null>(null);

  useEffect(() => {
    map.locate({ setView: false, watch: true }).on("locationfound", function (e) {
      setPosition(e.latlng);
      setCarrierLocation(e.latlng.lat, e.latlng.lng);
    });
  }, [map, setCarrierLocation]);

  return position === null ? null : (
    <Marker position={position} icon={L.icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    })}>
      <Popup>현재 운반자 위치</Popup>
    </Marker>
  );
}

export default function Driver() {
  const [, setLocation] = useLocation();
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [carrierLocation, setCarrierLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [roadDistance, setRoadDistance] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: reports, isLoading, refetch } = trpc.reports.getUncollected.useQuery();
  
  const markCollectedMutation = trpc.reports.markAsCollected.useMutation({
    onSuccess: () => {
      toast.success("수거 완료 처리되었습니다.");
      refetch();
      setSelectedReportId(null);
      setRoadDistance(null);
    },
  });

  const currentReport = useMemo(() => {
    if (!selectedReportId || !reports) return null;
    return reports.find(r => r.id === selectedReportId);
  }, [selectedReportId, reports]);

  // OSRM API를 이용한 도로 주행 거리 계산
  useEffect(() => {
    if (carrierLocation && currentReport) {
      setIsCalculating(true);
      setError(null);
      
      const start = `${carrierLocation.lng},${carrierLocation.lat}`;
      const end = `${currentReport.longitude},${currentReport.latitude}`;
      const url = `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=false`;
      
      const fetchDistance = async () => {
        try {
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const distanceKm = (data.routes[0].distance / 1000).toFixed(2);
            setRoadDistance(distanceKm);
          } else {
            setRoadDistance(null);
            setError("경로를 찾을 수 없습니다.");
          }
        } catch (err) {
          console.error("OSRM Fetch Error:", err);
          setError("네트워크 오류");
        } finally {
          setIsCalculating(false);
        }
      };

      fetchDistance();
    } else {
      setRoadDistance(null);
      setIsCalculating(false);
    }
  }, [carrierLocation, currentReport]);

  const handleMarkCollected = () => {
    if (!selectedReportId) return;
    if (confirm("수거를 완료하시겠습니까?")) {
      markCollectedMutation.mutate({ reportId: selectedReportId });
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50">
      <header className="bg-white border-b p-4 shadow-sm sticky top-0 z-10">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold">운반자 모드</h1>
          <Button variant="default" onClick={() => setLocation("/")}>
            {/* <Home className="w-4 h-4 mr-2" /> */}
            홈으로
          </Button>
        </div>
      </header>

      <div className="container py-6 grid lg:grid-cols-12 gap-6">
        {/* 왼쪽: 지도 (8컬럼) */}
        <Card className="lg:col-span-8 h-[600px]">
          <CardContent className="h-full p-0 overflow-hidden rounded-lg">
            <MapContainer center={KOREA_CENTER} zoom={DEFAULT_ZOOM} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapViewHandler 
                center={currentReport ? [parseFloat(currentReport.latitude), parseFloat(currentReport.longitude)] : KOREA_CENTER} 
                zoom={currentReport ? 15 : DEFAULT_ZOOM} 
              />
              <LocationTracker setCarrierLocation={(lat, lng) => setCarrierLocation({ lat, lng })} />
              {reports?.map(r => (
                <Marker key={r.id} position={[parseFloat(r.latitude), parseFloat(r.longitude)]} eventHandlers={{ click: () => setSelectedReportId(r.id) }}>
                  <Popup><div className="font-bold">{r.beachName}</div><div className="text-xs">{r.collectionAmount}마대</div></Popup>
                </Marker>
              ))}
            </MapContainer>
          </CardContent>
        </Card>

        {/* 오른쪽: 상세 정보 및 목록 (4컬럼) */}
        <div className="lg:col-span-4 space-y-6">
          {currentReport ? (
            <Card className="border-emerald-200 bg-white shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-emerald-700">{currentReport.beachName}</CardTitle>
                <CardDescription>수거 대상 상세 정보</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-[10px] font-bold text-gray-400 uppercase">수거량(마대 수)</div>
                    <div className="text-lg font-bold text-blue-600">{currentReport.collectionAmount}개</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-[10px] font-bold text-gray-400 uppercase">주행 거리</div>
                    <div className="text-lg font-bold text-emerald-600 flex items-center">
                      {isCalculating ? <Loader2 className="animate-spin w-4 h-4" /> : 
                       error ? <span className="text-xs text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> {error}</span> :
                       roadDistance ? `${roadDistance} km` : "위치 확인 중"}
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 flex items-center">
                  <MapPin className="w-3 h-3 mr-1" /> {currentReport.latitude}, {currentReport.longitude}
                </div>

                <Button className="w-full py-6 text-lg bg-emerald-600 hover:bg-emerald-700" onClick={handleMarkCollected} disabled={markCollectedMutation.isPending}>
                  {markCollectedMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />} 수거 완료하기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-emerald-100/50 border-dashed border-emerald-300">
              <CardContent className="py-10 text-center text-emerald-600">
                <Navigation className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>지도의 마커나 아래 목록에서<br/>수거 지점을 선택해 주세요.</p>
              </CardContent>
            </Card>
          )}

          <Card className="h-[300px] flex flex-col">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-base">수거 대기 목록 ({reports?.length || 0}건)</CardTitle></CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {isLoading ? <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div> : 
                reports?.map(r => (
                  <div key={r.id} onClick={() => setSelectedReportId(r.id)} className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedReportId === r.id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''}`}>
                    <div className="font-bold text-sm">{r.beachName}</div>
                    <div className="text-xs text-gray-500 mt-1">{r.collectionAmount}마대 · {new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                ))
              }
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
