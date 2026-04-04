# 해양 쓰레기 관리 시스템 - 로컬 실행 가이드

## 📋 시스템 요구사항

- Node.js 18+ 
- Python 3.8+
- MySQL 8.0+ (또는 로컬 SQLite 사용)
- pnpm (또는 npm)

## 🚀 빠른 시작

### 1. 프로젝트 설치

```bash
# 프로젝트 디렉토리로 이동
cd ocean-litter-management-local

# 의존성 설치
pnpm install

# Python 의존성 설치
pip install -r requirements.txt
```

### 2. 환경 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 데이터베이스 (SQLite 사용 권장)
DATABASE_URL="file:./dev.db"

# 앱 설정
VITE_APP_TITLE="AI바다환경지킴이"
VITE_APP_ID="local-dev"

# 포트 설정
PORT=3000
```

### 3. 데이터베이스 초기화

```bash
# 데이터베이스 마이그레이션
pnpm db:push

# 초기 데이터 생성 (선택사항)
# node scripts/seed-db.mjs
```

### 4. 개발 서버 시작

```bash
# 개발 서버 시작 (핫 리로드 포함)
pnpm dev

# 또는 프로덕션 빌드
pnpm build
pnpm start
```

### 5. 브라우저에서 접속

```
http://localhost:3000
```

## 📱 사용 가능한 페이지

- **홈**: `http://localhost:3000/` - 메인 대시보드
- **조사원**: `http://localhost:3000/surveyor` - 보고서 작성
- **운반자**: `http://localhost:3000/driver` - 수거 관리
- **관리자**: `http://localhost:3000/manager` - 통합 대시보드

## 🔧 주요 기능

### 조사원 페이지
- 청소 전/후 사진 업로드
- 위치(위도/경도) 입력
- 수거량 입력
- 자동 AI 분석

### 관리자 페이지
- 📊 통계 대시보드
- 🗺️ 지도 기반 시각화
- 📈 쓰레기 종류별 통계
- 🔍 AI 탐지 결과 확인

## 🤖 AI 분석 기능

YOLOv11 모델을 사용하여 해양 쓰레기를 자동으로 탐지합니다.

### 모델 파일
- 위치: `server/best_plus.pt`
- 탐지 클래스: 22종류의 해양 쓰레기

### 분석 실행
```bash
# 수동으로 이미지 분석
python3 server/analyze.py /path/to/image.jpg
```

## 📦 프로젝트 구조

```
ocean-litter-management-local/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── components/    # 재사용 가능한 컴포넌트
│   │   └── App.tsx        # 메인 앱
│   └── public/            # 정적 자산
├── server/                # Node.js 백엔드
│   ├── routers.ts         # API 라우트
│   ├── db.ts              # 데이터베이스 쿼리
│   ├── analyze.py         # AI 분석 스크립트
│   └── best_plus.pt       # YOLOv11 모델
├── drizzle/               # 데이터베이스 스키마
├── shared/                # 공유 타입 및 상수
└── package.json           # 프로젝트 설정
```

## 🐛 문제 해결

### "404 Page Not Found" 에러
- 브라우저 새로고침 (Ctrl+F5)
- 개발 서버 재시작 (`pnpm dev`)

### "Database connection failed"
- `.env.local` 파일 확인
- SQLite 파일 권한 확인
- MySQL 사용 시 서버 실행 확인

### "Python module not found"
```bash
# Python 의존성 재설치
pip install -r requirements.txt
```

### "Model file not found"
- `server/best_plus.pt` 파일 확인
- 파일 경로 확인: `server/analyze.py`

## 📝 로그 확인

### 개발 서버 로그
```bash
# 터미널에서 직접 확인
pnpm dev
```

### Python 분석 로그
```bash
# 수동 실행 시 로그 확인
python3 server/analyze.py /path/to/image.jpg
```

## 🎯 다음 단계

1. 조사원 페이지에서 사진 업로드
2. 관리자 페이지에서 AI 분석 결과 확인
3. 지도에서 수거 위치 확인

## 📞 지원

문제가 발생하면:
1. 브라우저 개발자 도구 (F12) 확인
2. 서버 로그 확인
3. `.env.local` 설정 확인

---

**Happy Coding! 🚀**
