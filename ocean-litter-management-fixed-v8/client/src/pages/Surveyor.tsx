'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, MapPin, Camera, Upload, X, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useRef } from "react";
import { extractGPSFromDataURL } from "@/lib/exifUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Surveyor() {
  const [, setLocation] = useLocation();
  const [surveyorName, setSurveyorName] = useState("");
  const [beachName, setBeachName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [collectionAmount, setCollectionAmount] = useState("");
  const [beachLength, setBeachLength] = useState("");
  const [mainTrash, setMainTrash] = useState("");
  const [etcTrash, setEtcTrash] = useState("");
  const [cleaningEase, setCleaningEase] = useState("중(도보 접근 가능)");
  const [beforeImages, setBeforeImages] = useState<{ data: string; mimeType: string; preview: string }[]>([]);
  const [afterImage, setAfterImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtractingGPS, setIsExtractingGPS] = useState(false);
  
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  
  const createReportMutation = trpc.reports.create.useMutation({
    onSuccess: () => {
      toast.success("보고서가 성공적으로 전송되었습니다.");
      setSurveyorName(""); setBeachName(""); setLatitude(""); setLongitude(""); setCollectionAmount("");
      setBeachLength(""); setMainTrash(""); setEtcTrash(""); setBeforeImages([]); setAfterImage(null);
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast.error(`전송 실패: ${error.message}`);
      setIsSubmitting(false);
    },
  });
  
  const handleBeforeImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const data = base64.split(',')[1];
        const preview = base64;
        
        setBeforeImages(prev => [...prev, { data, mimeType: file.type, preview }]);
        
        if (!latitude || !longitude) {
          setIsExtractingGPS(true);
          try {
            const gpsData = await extractGPSFromDataURL(base64);
            if (gpsData.latitude && gpsData.longitude) {
              setLatitude(gpsData.latitude.toString());
              setLongitude(gpsData.longitude.toString());
              toast.success("사진에서 위치 정보를 추출했습니다.");
            }
          } catch (error) {} finally { setIsExtractingGPS(false); }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAfterImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAfterImage({ data: base64.split(',')[1], mimeType: file.type, preview: base64 });
    };
    reader.readAsDataURL(file);
  };

  const removeBeforeImage = (index: number) => {
    setBeforeImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyorName || !beachName || !latitude || !longitude || !collectionAmount || beforeImages.length === 0) {
      toast.error("필수 항목을 모두 입력해주세요. (청소 후 사진은 선택사항입니다)");
      return;
    }
    
    setIsSubmitting(true);
    const finalMainTrash = mainTrash === "기타" ? `기타: ${etcTrash}` : mainTrash;
    
    createReportMutation.mutate({
      surveyorName, beachName, latitude, longitude,
      collectionAmount: Number(collectionAmount),
      beachLength: beachLength ? Number(beachLength) : undefined,
      mainTrash: finalMainTrash,
      cleaningEase,
      beforeImages: beforeImages.map(img => ({ data: img.data, mimeType: img.mimeType })),
      afterImage: afterImage ? { data: afterImage.data, mimeType: afterImage.mimeType } : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-8">
      <div className="container max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">조사원(청소원) 보고서 작성</h1>
          <Button variant="default" onClick={() => setLocation("/")}>홈으로</Button>
        </div>
        
        <Card>
          <CardHeader>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">청소 전 사진 (여러 장 가능)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {beforeImages.map((img, index) => (
                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden border">
                          <img src={img.preview} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeBeforeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3"/></button>
                        </div>
                      ))}
                      <div onClick={() => beforeInputRef.current?.click()} className="aspect-video border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50">
                        <Plus className="w-6 h-6 text-blue-500" />
                        <span className="text-xs text-blue-500 mt-1">사진 추가</span>
                      </div>
                    </div>
                    <input ref={beforeInputRef} type="file" accept="image/*" multiple onChange={handleBeforeImagesUpload} className="hidden"/>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">청소 후 사진</Label>
                    <div onClick={() => afterInputRef.current?.click()} className="relative aspect-video border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50">
                      {afterImage ? <img src={afterImage.preview} className="w-full h-full object-cover rounded-lg"/> : <Camera className="w-8 h-8 text-gray-400" />}
                    </div>
                    <input ref={afterInputRef} type="file" accept="image/*" onChange={handleAfterImageUpload} className="hidden"/>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>조사자</Label>
                    <Input value={surveyorName} onChange={(e) => setSurveyorName(e.target.value)} placeholder="예: 홍길동" />
                  </div>
                    <div className="space-y-2">
                    <Label>해안명</Label>
                    <Input value={beachName} onChange={(e) => setBeachName(e.target.value)} placeholder="예: 해운대 해수욕장" />
                  </div>
                  <div className="space-y-2">
                    <Label>위치 정보</Label>
                    <div className="flex gap-2">
                      <Input placeholder="위도" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
                      <Input placeholder="경도" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
                      <Button type="button" variant="default" onClick={() => navigator.geolocation.getCurrentPosition(p => {setLatitude(p.coords.latitude.toFixed(6)); setLongitude(p.coords.longitude.toFixed(6));})}><MapPin className="w-4 h-4"/></Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>수거량 (50L 마대 기준)</Label>
                    <Input type="number" value={collectionAmount} onChange={(e) => setCollectionAmount(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>주요 쓰레기 종류 (1개 선택)</Label>
                    <Select onValueChange={setMainTrash} value={mainTrash}>
                      <SelectTrigger><SelectValue placeholder="쓰레기 종류 선택" /></SelectTrigger>
                      <SelectContent>
                        {["폐어구(그물, 밧줄, 양식 자재 등)", "스티로폼 부표", "생활쓰레기", "대형 투기 쓰레기(가전제품, 타이어 등)", "외국쓰레기", "기타"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {mainTrash === "기타" && <Input className="mt-2" placeholder="기타 내용 입력" value={etcTrash} onChange={(e) => setEtcTrash(e.target.value)} />}
                  </div>
                  <div className="space-y-2">
                    <Label>청소 용이성</Label>
                    <RadioGroup value={cleaningEase} onValueChange={setCleaningEase} className="flex flex-col space-y-1">
                      {["상(차량 접근 가능)", "중(도보 접근 가능)", "하(수거 불가)"].map(v => (
                        <div key={v} className="flex items-center space-x-2">
                          <RadioGroupItem value={v} id={v} />
                          <Label htmlFor={v}>{v}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full py-6 text-lg" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />} 보내기
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
