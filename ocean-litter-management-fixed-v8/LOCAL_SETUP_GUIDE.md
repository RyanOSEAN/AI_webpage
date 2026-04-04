# AI바다환경지킴이 - 로컬 실행 가이드

이 문서는 YOLOv11 객체 탐지 기능이 정상 작동하는 로컬 환경 설정 방법을 설명합니다.

## 📋 시스템 요구사항

- **OS**: Windows 10/11, macOS, Linux
- **Node.js**: v18 이상 (권장: v22)
- **Python**: 3.9 이상 (권장: 3.11)
- **RAM**: 8GB 이상 (AI 모델 로드용)
- **디스크**: 5GB 이상 (의존성 및 모델 파일)

## 🚀 1단계: 환경 준비

### 1.1 Node.js 설치 확인

```bash
node --version
npm --version
# 또는 pnpm 사용
pnpm --version
```

### 1.2 Python 설치 확인

```bash
python --version
# 또는
python3 --version
```

## 📦 2단계: 프로젝트 설정

### 2.1 프로젝트 압축 해제

```bash
tar -xzf ocean-litter-management.tar.gz
cd ocean-litter-management
```

### 2.2 Node.js 의존성 설치

```bash
# pnpm 사용 (권장)
pnpm install

# 또는 npm 사용
npm install

# 또는 yarn 사용
yarn install
```

**설치 시간**: 5-10분 (인터넷 속도에 따라 다름)

### 2.3 Python 의존성 설치

```bash
# 가상환경 생성 (권장)
python -m venv venv

# 가상환경 활성화
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 필수 패키지 설치
pip install ultralytics opencv-python-headless pillow numpy

# 또는 requirements.txt 사용 (있는 경우)
pip install -r requirements.txt
```

**설치 시간**: 3-5분

## 🗄️ 3단계: 데이터베이스 설정

### 3.1 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
# 데이터베이스 연결
DATABASE_URL="mysql://user:password@localhost:3306/ocean_litter"

# 또는 SQLite (로컬 테스트용)
DATABASE_URL="file:./local.db"

# JWT 비밀키
JWT_SECRET="your-secret-key-change-this"

# OAuth 설정 (로컬 테스트용 더미값)
VITE_APP_ID="local-dev"
OAUTH_SERVER_URL="http://localhost:3000"
VITE_OAUTH_PORTAL_URL="http://localhost:3000"

# 기타 설정
OWNER_NAME="Local Developer"
OWNER_OPEN_ID="local-dev-id"
VITE_APP_TITLE="AI바다환경지킴이"
```

### 3.2 데이터베이스 초기화

```bash
# 마이그레이션 실행
pnpm db:push

# 또는 수동으로
drizzle-kit generate
drizzle-kit migrate
```

## 🎯 4단계: AI 모델 설정 (매우 중요!)

### 4.1 YOLOv11 모델 파일 확인

프로젝트 구조:

```
ocean-litter-management/
├── server/
│   ├── ai_analyzer.py          ← AI 분석 스크립트
│   ├── best_plus.pt            ← YOLOv11 모델 파일 (필수!)
│   └── data_litter.yaml        ← 클래스 정의 파일 (필수!)
```

**중요**: `best_plus.pt`와 `data_litter.yaml` 파일이 반드시 `server/` 디렉토리에 있어야 합니다.

### 4.2 AI 분석 스크립트 테스트

```bash
# 테스트 이미지로 AI 모델 테스트
python server/ai_analyzer.py /path/to/test/image.jpg

# 예상 출력:
# {
#   "success": true,
#   "detections": [
#     {
#       "className": "plastic_bag",
#       "confidence": 0.95,
#       "xMin": 100,
#       "yMin": 150,
#       "xMax": 250,
#       "yMax": 300
#     }
#   ]
# }
```

**문제 해결**:
- `ModuleNotFoundError: No module named 'ultralytics'` → `pip install ultralytics` 실행
- `FileNotFoundError: best_plus.pt` → 모델 파일 경로 확인
- `yaml.YAMLError` → `data_litter.yaml` 파일 형식 확인

## 🖥️ 5단계: 로컬 서버 실행

### 5.1 개발 서버 시작

```bash
# 프로젝트 루트에서
pnpm dev

# 또는 npm
npm run dev

# 또는 yarn
yarn dev
```

**예상 출력**:
```
[04:18:15] Vite v5.0.0 building for production...
[04:18:17] Server running on http://localhost:3000/
```

### 5.2 브라우저에서 접속

```
http://localhost:3000
```

## 🧪 6단계: 객체 탐지 테스트

### 6.1 조사원 페이지에서 테스트

1. 홈페이지 → "조사원 페이지" 클릭
2. 필수 정보 입력:
   - 해안명: "테스트 해안"
   - 위치: 자동 또는 수동 입력
   - 수거량: 5마대(50L)
   - 해안 길이: 100m
3. 청소 전 사진 업로드 (쓰레기가 있는 사진 권장)
4. 청소 후 사진 업로드
5. "보고서 전송" 클릭

### 6.2 관리자 페이지에서 결과 확인

1. 홈페이지 → "관리자 페이지" 클릭
2. 지도에서 보고서 위치 확인
3. 보고서 클릭 시 AI 탐지 결과 표시 확인

**AI 탐지 결과가 표시되지 않는 경우**:

```bash
# 1. 서버 로그 확인
# 터미널에서 다음 메시지 확인:
# "AI 분석 오류: ..." 또는 "AI 분석 완료: X개 객체 탐지"

# 2. Python 스크립트 직접 테스트
python server/ai_analyzer.py /path/to/uploaded/image.jpg

# 3. 데이터베이스 확인
sqlite3 local.db "SELECT * FROM ai_detections LIMIT 5;"
```

## 🔧 7단계: 트러블슈팅

### 문제: "AI 분석 오류: ReferenceError: __dirname is not defined"

**해결책**:
```bash
# server/routers.ts 파일 확인
# 다음 코드가 있는지 확인:
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

### 문제: "Python 스크립트 실행 오류"

```bash
# 1. Python 경로 확인
which python3
# 또는 Windows:
where python

# 2. 스크립트 직접 실행 테스트
python3 server/ai_analyzer.py /path/to/image.jpg

# 3. 권한 설정
chmod +x server/ai_analyzer.py
```

### 문제: "모델 파일을 찾을 수 없음"

```bash
# 1. 파일 위치 확인
ls -la server/best_plus.pt
ls -la server/data_litter.yaml

# 2. 파일 크기 확인 (모델 파일은 보통 100MB 이상)
du -h server/best_plus.pt

# 3. 파일 복사
cp /source/best_plus.pt server/
cp /source/data_litter.yaml server/
```

### 문제: "데이터베이스 연결 오류"

```bash
# 1. 환경 변수 확인
echo $DATABASE_URL

# 2. 데이터베이스 마이그레이션 다시 실행
pnpm db:push

# 3. SQLite 사용 (가장 간단)
# .env.local 에서:
DATABASE_URL="file:./local.db"
```

## 📊 8단계: 성능 최적화

### 8.1 AI 모델 캐싱

첫 실행 시 모델이 다운로드되고 캐시됩니다:

```bash
# 캐시 위치 확인
~/.cache/ultralytics/  # Linux/macOS
%APPDATA%\Ultralytics  # Windows
```

### 8.2 메모리 사용량 모니터링

```bash
# 실시간 모니터링
top -p $(pgrep -f "node.*server")

# 또는 Windows:
tasklist | findstr node
```

## 🚢 9단계: 프로덕션 배포

### 9.1 빌드

```bash
pnpm build
```

### 9.2 프로덕션 서버 실행

```bash
pnpm start
```

## 📝 추가 정보

### 프로젝트 구조

```
ocean-litter-management/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── pages/         # 조사원, 운반자, 관리자 페이지
│   │   ├── components/    # UI 컴포넌트
│   │   └── lib/trpc.ts    # tRPC 클라이언트
│   └── index.html
├── server/                 # Express 백엔드
│   ├── routers.ts         # API 엔드포인트
│   ├── db.ts              # 데이터베이스 쿼리
│   ├── ai_analyzer.py     # YOLOv11 분석 스크립트
│   ├── best_plus.pt       # 학습된 모델
│   └── data_litter.yaml   # 클래스 정의
├── drizzle/               # 데이터베이스 스키마
│   └── schema.ts
└── package.json
```

### 주요 API 엔드포인트

- `POST /api/trpc/reports.create` - 보고서 생성 및 AI 분석
- `GET /api/trpc/reports.list` - 보고서 목록 조회
- `GET /api/trpc/detections.list` - AI 탐지 결과 조회
- `POST /api/trpc/reports.markCollected` - 수거 완료 처리

### 환경 변수 상세 설명

| 변수 | 설명 | 예시 |
|------|------|------|
| DATABASE_URL | 데이터베이스 연결 문자열 | `mysql://user:pass@localhost/db` |
| JWT_SECRET | 세션 암호화 키 | `your-secret-key` |
| VITE_APP_ID | OAuth 앱 ID | `local-dev` |
| VITE_APP_TITLE | 앱 제목 | `AI바다환경지킴이` |

## 💡 팁

1. **로컬 테스트 시 HTTPS 불필요** - HTTP로 충분합니다
2. **이미지 업로드 테스트** - 쓰레기가 명확히 보이는 사진 사용
3. **AI 분석 시간** - 첫 실행은 모델 로드로 인해 30초 이상 소요될 수 있습니다
4. **메모리 부족** - 8GB 미만 시스템에서는 브라우저 탭 최소화 권장

## 🆘 추가 지원

문제가 발생하면 다음을 확인하세요:

1. 모든 의존성이 설치되었는가?
2. `best_plus.pt`와 `data_litter.yaml` 파일이 있는가?
3. Python 스크립트가 독립적으로 실행되는가?
4. 데이터베이스가 정상 작동하는가?
5. 서버 로그에 오류 메시지가 있는가?

---

**마지막 업데이트**: 2025년 11월 5일
**버전**: 1.0.0
