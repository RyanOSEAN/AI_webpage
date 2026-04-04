import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Truck, BarChart3, Waves } from "lucide-react";
import { APP_TITLE } from "@/const";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      {/* 헤더 */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Waves className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{APP_TITLE}</h1>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-6xl font-bold text-gray-900 mb-4">
            바다환경지킴이
          </h2>
          {/* <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AI 기반 객체 인식 기술을 활용하여 해양 환경 보호 및 쓰레기 관리를 효율적으로 수행합니다.
            조사원, 운반자, 관리자 역할에 따라 최적화된 인터페이스를 제공합니다.
          </p> */}
        </div>

        {/* 역할별 페이지 카드 */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* 조사원 카드 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-24 h-24 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-20 h-20 text-blue-600" />
              </div>
              <CardTitle className="text-3xl font-bold">조사원(청소원)</CardTitle>
              <CardDescription>
                {/* 현장에서 수거 데이터를 입력하고 AI 분석을 수행합니다 */}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2 mb-4">
                <li>• 청소 전/후 사진 업로드</li>
                <li>• 위치 및 수거량 입력</li>
                <li>• 주요 쓰레기, 청소 용이성 입력</li>
              </ul>
              <Button asChild className="w-full">
                <Link href="/surveyor">로그인</Link>
              </Button>
            </CardContent>
          </Card>

          {/* 운반자 카드 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-24 h-24 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Truck className="w-20 h-20 text-green-600" />
              </div>
              <CardTitle  className="text-3xl font-bold">운반자</CardTitle>
              <CardDescription>
                {/* 수거 지점을 확인하고 수거 작업을 관리합니다 */}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2 mb-4">
                <li>• 지도에서 수거 위치 확인</li>
                <li>• 수거 대상 목록 조회</li>
                <li>• 수거 완료 처리</li>
              </ul>
              <Button asChild className="w-full">
                <Link href="/driver">로그인</Link>
              </Button>
            </CardContent>
          </Card>

          {/* 관리자 카드 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-24 h-24 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-20 h-20 text-purple-600" />
              </div>
              <CardTitle  className="text-3xl font-bold">관리자</CardTitle>
              <CardDescription>
                {/* 통합 대시보드에서 모든 데이터를 관리합니다 */}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2 mb-4">
                <li>• 실시간 데이터 시각화</li>
                <li>• 해안쓰레기 객체탐지분석 결과 확인</li>
                <li>• 통계 및 보고서 관리</li>
              </ul>
              <Button asChild className="w-full">
                <Link href="/manager">로그인</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

	        {/* 주요 기능 (사용자 요청으로 제거) */}
      </main>

      {/* 푸터 */}
      <footer className="border-t bg-white mt-20">
        <div className="container py-8 text-center text-sm text-gray-600">
          <p>© 2026 OSEAN. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
