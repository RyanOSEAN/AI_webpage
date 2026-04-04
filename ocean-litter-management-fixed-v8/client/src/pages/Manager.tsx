'use client';

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, MapPin, CheckCircle, Package, Filter, RotateCcw, ChevronLeft, ChevronRight, Home, Download, AlertCircle, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// 지도 시점 고정: 대한민국 중심
const KOREA_CENTER: [number, number] = [36.5, 127.5];
const DEFAULT_ZOOM = 7;

// 안전한 JSON 파싱 함수
function safeParseImageUrls(data: any): string[] {
  try {
    if (!data) return [];
    if (typeof data === 'string') {
      if (data.startsWith('[')) {
        return JSON.parse(data);
      }
      // 단일 URL 문자열인 경우
      return [data];
    }
    if (Array.isArray(data)) return data;
    return [];
  } catch (e) {
    console.error('Image URL parse error:', e);
    return [];
  }
}

function MapUpdater({ selectedId, reports }: { selectedId: number | null, reports: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (selectedId) {
      const report = reports.find(r => r.id === selectedId);
      if (report) map.flyTo([parseFloat(report.latitude), parseFloat(report.longitude)], 15);
    }
  }, [selectedId, reports, map]);
  return null;
}

function MiniChart({ reportId }: { reportId: number }) {
  const { data: stats } = trpc.detections.getStats.useQuery({ reportId });
  if (!stats || stats.length === 0) return <div className="text-[10px] text-gray-400">식별 데이터 없음</div>;
  
  const data = {
    labels: stats.map(s => s.name),
    datasets: [{ data: stats.map(s => s.value), backgroundColor: 'rgba(59, 130, 246, 0.5)' }]
  };
  
  return (
    <div className="w-32 h-20 mt-2">
      <Bar data={data} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }} />
    </div>
  );
}

export default function Manager() {
  const [, setLocation] = useLocation();
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const { data: kpi } = trpc.reports.getKpiSummary.useQuery();
  const { data: reports, isLoading, refetch } = trpc.reports.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  const { data: totalStats } = trpc.detections.getStats.useQuery({});
  const { data: selectedStats } = trpc.detections.getStats.useQuery({ reportId: selectedReportId || undefined }, { enabled: !!selectedReportId });

  const selectedReport = useMemo(() => reports?.find(r => r.id === selectedReportId), [reports, selectedReportId]);
  
  // 안전한 이미지 URL 파싱
  const beforeImages = useMemo(() => safeParseImageUrls(selectedReport?.beforeImageUrls), [selectedReport]);
  const detectedImages = useMemo(() => safeParseImageUrls(selectedReport?.detectedImageUrls), [selectedReport]);
  const afterImageUrl = useMemo(() => {
    if (!selectedReport) return null;
    return selectedReport.afterImageUrl;
  }, [selectedReport]);

  useEffect(() => {
    setImageError(false);
  }, [selectedReportId, currentImageIndex]);

  const downloadMutation = trpc.reports.downloadReport.useMutation({
    onSuccess: (data) => { 
      if (data.success && data.url) {
        const link = document.createElement('a');
        link.href = data.url;
        link.setAttribute('download', '');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(data.error || "PDF 다운로드에 실패했습니다.");
      }
    },
  });

  const downloadAllMutation = trpc.reports.downloadAllReports.useMutation({
    onSuccess: (data) => { 
      if (data.success && data.url) {
        const link = document.createElement('a');
        link.href = data.url;
        link.setAttribute('download', 'reports.zip');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(data.error || "일괄 다운로드에 실패했습니다.");
      }
    },
  });

  const deleteMutation = trpc.reports.delete.useMutation({
    onSuccess: () => {
      alert('보고서가 삭제되었습니다.');
      setSelectedReportId(null);
      refetch();
    },
    onError: (error) => {
      alert('삭제 실패: ' + (error.message || '알 수 없는 오류'));
    },
  });

  const chartData = useMemo(() => {
    if (!totalStats) return { labels: [], datasets: [] };
    return {
      labels: totalStats.map(s => s.name),
      datasets: [{ 
        label: '전체 식별 쓰레기 누적 개수', 
        data: totalStats.map(s => s.value), 
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }]
    };
  }, [totalStats]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4 sticky top-0 z-10 shadow-sm">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold">관리자 대시보드</h1>
          <Button variant="outline" onClick={() => setLocation("/")}><Home className="mr-2 w-4 h-4" /> 홈으로 돌아가기</Button>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6"><div className="text-sm text-gray-500">총 보고서</div><div className="text-3xl font-bold">{kpi?.totalReports || 0}건</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-sm text-green-500">수거 완료</div><div className="text-3xl font-bold text-green-600">{kpi?.collectedReports || 0}건</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-sm text-blue-500">총 수거량 (수거완료)</div><div className="text-3xl font-bold text-blue-600">{kpi?.collectedCollectionAmount || 0}마대</div></CardContent></Card>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader className="p-4"><CardTitle className="text-base flex items-center"><Filter className="mr-2 w-4 h-4" /> 필터</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">수거 상태</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="pending">수거대기</SelectItem>
                      <SelectItem value="collected">수거완료</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">기간 설정</label>
                  <div className="grid grid-cols-1 gap-2">
                    <input type="date" className="w-full p-1.5 border rounded text-xs" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <input type="date" className="w-full p-1.5 border rounded text-xs" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </div>
                <Button variant="ghost" className="w-full h-8 text-[10px]" onClick={() => { setStatusFilter("all"); setStartDate(""); setEndDate(""); }}><RotateCcw className="mr-2 w-3 h-3" /> 필터 초기화</Button>
              </CardContent>
            </Card>

            <Card className="h-[600px] flex flex-col">
              <CardHeader className="p-4 flex flex-row items-center justify-between"><CardTitle className="text-base">보고서 목록</CardTitle><Button size="sm" className="h-8 text-xs" onClick={() => downloadAllMutation.mutate()} disabled={downloadAllMutation.isPending}><Download className="mr-1 w-3 h-3" /> 일괄 다운로드</Button></CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                {isLoading ? <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div> : 
                  reports?.map(r => (
                    <div key={r.id} onClick={() => { setSelectedReportId(r.id); setCurrentImageIndex(0); }} className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedReportId === r.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                      <div className="font-bold text-xs truncate">{r.beachName}</div>
                      <div className="text-[10px] text-gray-500 mt-1">{new Date(r.createdAt).toLocaleDateString()} · {r.isCollected ? '수거완료' : '수거대기'}</div>
                    </div>
                  ))
                }
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-9 space-y-6">
            <Card className="h-[500px]">
              <CardContent className="h-full p-0 overflow-hidden rounded-lg">
                <MapContainer center={KOREA_CENTER} zoom={DEFAULT_ZOOM} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapUpdater selectedId={selectedReportId} reports={reports || []} />
                  {reports?.map(r => (
                    <Marker key={r.id} position={[parseFloat(r.latitude), parseFloat(r.longitude)]} eventHandlers={{ click: () => setSelectedReportId(r.id) }}>
                      <Popup>
                        <div className="p-1">
                          <div className="text-sm font-bold">{r.beachName}</div>
                          <div className="text-[10px] text-gray-500 mb-1">{r.isCollected ? '수거완료' : '수거대기'}</div>
                          <MiniChart reportId={r.id} />
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="h-[350px]">
                <CardHeader className="p-4 pb-2"><CardTitle className="text-base">AI 쓰레기 식별 통계 (전체 누적)</CardTitle></CardHeader>
                <CardContent className="h-[270px] p-4 pt-0">
                  {reports && reports.length > 0 && totalStats && totalStats.length > 0 ? (
                    <Bar data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">식별 데이터가 없습니다.</div>
                  )}
                </CardContent>
              </Card>

              {selectedReport ? (
                <Card className="h-[350px] border-blue-200 flex flex-col">
                  <CardHeader className="p-4 flex flex-row items-center justify-between sticky top-0 bg-white z-20 border-b">
                    <CardTitle className="text-base">{selectedReport.beachName} 상세 정보</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-8" onClick={() => downloadMutation.mutate({ reportId: selectedReport.id })} disabled={downloadMutation.isPending}><Download className="mr-1 w-3 h-3" /> PDF</Button>
                      <Button size="sm" variant="destructive" className="h-8" onClick={() => { if (confirm('정말 삭제하시겠습니까?')) deleteMutation.mutate({ reportId: selectedReport.id }); }} disabled={deleteMutation.isPending}><Trash2 className="mr-1 w-3 h-3" /> 삭제</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-y-3">
                      <div><div className="text-[10px] font-bold text-gray-400 uppercase">조사자</div><div className="font-medium">{selectedReport.surveyorName || '-'}</div></div>
                      <div><div className="text-[10px] font-bold text-gray-400 uppercase">등록 일시</div><div>{new Date(selectedReport.createdAt).toLocaleString()}</div></div>
                      <div><div className="text-[10px] font-bold text-gray-400 uppercase">위치</div><div>{selectedReport.latitude}, {selectedReport.longitude}</div></div>
                      <div><div className="text-[10px] font-bold text-gray-400 uppercase">수거량</div><div className="font-bold text-blue-600">{selectedReport.collectionAmount}마대</div></div>
                      <div><div className="text-[10px] font-bold text-gray-400 uppercase">주요 쓰레기</div><div>{selectedReport.mainTrash}</div></div>
                      <div><div className="text-[10px] font-bold text-gray-400 uppercase">청소 용이성</div><div>{selectedReport.cleaningEase}</div></div>
                    </div>
                    <div className="border-t pt-3">
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">AI 식별 상세 항목</div>
                      <div className="space-y-1">
                        {selectedStats && selectedStats.length > 0 ? (
                          selectedStats.map(s => (
                            <div key={s.name} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                              <span className="text-xs font-medium">{s.name}</span>
                              <span className="text-xs font-bold text-blue-600">{s.value}개</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-400">식별된 데이터가 없습니다.</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-[350px] flex items-center justify-center border-dashed">
                  <div className="text-center text-gray-400">
                    <AlertCircle className="mx-auto w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">보고서를 선택하면<br/>상세 정보가 표시됩니다.</p>
                  </div>
                </Card>
              )}
            </div>

            {selectedReport && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base flex justify-between items-center">
                      AI 식별 결과 ({detectedImages.length}장)
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))} disabled={currentImageIndex === 0}><ChevronLeft className="w-3 h-3" /></Button>
                        <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => setCurrentImageIndex(Math.min(detectedImages.length - 1, currentImageIndex + 1))} disabled={currentImageIndex === detectedImages.length - 1}><ChevronRight className="w-3 h-3" /></Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {detectedImages.length > 0 ? (
                      <div className="space-y-2">
                        <img src={detectedImages[currentImageIndex]} alt={`Detected ${currentImageIndex}`} className="w-full h-auto rounded border" onError={() => setImageError(true)} />
                        {imageError && <div className="text-xs text-red-500">이미지를 불러올 수 없습니다.</div>}
                        <div className="text-xs text-gray-500 text-center">{currentImageIndex + 1} / {detectedImages.length}</div>
                      </div>
                    ) : (
                      <div className="h-32 flex items-center justify-center text-gray-400 text-sm">식별 이미지가 없습니다.</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">청소 후 사진</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {afterImageUrl ? (
                      <div className="space-y-2">
                        <img src={afterImageUrl} alt="After" className="w-full h-auto rounded border" onError={() => setImageError(true)} />
                        {imageError && <div className="text-xs text-red-500">이미지를 불러올 수 없습니다.</div>}
                      </div>
                    ) : (
                      <div className="h-32 flex items-center justify-center text-gray-400 text-sm">청소 후 사진이 없습니다.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
