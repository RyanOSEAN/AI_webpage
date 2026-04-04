# 해양 쓰레기 관리 시스템 (로컬 실행 버전)

**로그인 기능이 제거된 로컬 개발용 버전입니다. 모든 페이지에 로그인 없이 접근할 수 있습니다.**

## 🎯 빠른 시작 (3단계)

### Step 1️⃣: 자동 설정 실행

**Linux/Mac:**
```bash
bash setup.sh
```

**Windows:**
```cmd
setup.bat
```

### Step 2️⃣: 개발 서버 시작

```bash
pnpm dev
# 또는
npm run dev
```

### Step 3️⃣: 브라우저에서 접속

```
http://localhost:3000
```

---

## 📱 사용 가능한 페이지

| 페이지 | URL | 설명 |
|--------|-----|------|
| 홈 | `http://localhost:3000/` | 메인 대시보드 |
| 조사원 | `http://localhost:3000/surveyor` | 보고서 작성 및 AI 분석 |
| 운반자 | `http://localhost:3000/driver` | 수거 관리 |
| 관리자 | `http://localhost:3000/manager` | 통합 대시보드 |

---

## 🔧 수동 설정 (자동 설정 실패 시)

### 1. 의존성 설치

```bash
# Node.js 패키지
pnpm install
# 또는
npm install

# Python 패키지
pip install -r requirements.txt
```

### 2. 환경 설정

`.env.local` 파일 생성:

```env
DATABASE_URL="file:./dev.db"
VITE_APP_TITLE="AI바다환경지킴이"
VITE_APP_ID="local-dev"
PORT=3000
```

### 3. 데이터베이스 초기화

```bash
pnpm db:push
# 또는
npm run db:push
```

### 4. 개발 서버 시작

```bash
pnpm dev
# 또는
npm run dev
```

---

## 🤖 AI 분석 기능

YOLOv11 모델을 사용하여 해양 쓰레기를 자동으로 탐지합니다.

### 모델 파일
- **위치**: `server/best_plus.pt`
- **탐지 클래스**: 22종류의 해양 쓰레기

### 수동 분석 (테스트)

```bash
python3 server/analyze.py /path/to/image.jpg
```

---

## 📊 주요 기능

### 조사원 페이지
✅ 청소 전/후 사진 업로드  
✅ 위치(위도/경도) 입력  
✅ 수거량 입력  
✅ 자동 AI 분석  

### 관리자 페이지
✅ 📊 통계 대시보드 (보고서 수, 수거량, 탐지 객체 수)  
✅ 🗺️ 지도 기반 시각화 (각 지점별 쓰레기 분포)  
✅ 📈 쓰레기 종류별 통계 (상위 10개)  
✅ 🔍 AI 탐지 결과 (바운딩 박스 표시)  

---

## 🐛 문제 해결

### "404 Page Not Found" 에러
```bash
# 브라우저 새로고침 (Ctrl+F5 또는 Cmd+Shift+R)
# 개발 서버 재시작
pnpm dev
```

### "Database connection failed"
```bash
# .env.local 파일 확인
cat .env.local

# SQLite 파일 권한 확인
ls -la dev.db

# 데이터베이스 재초기화
pnpm db:push
```

### "Python module not found"
```bash
# Python 의존성 재설치
pip install -r requirements.txt

# 또는 특정 모듈 설치
pip install ultralytics torch
```

### "Model file not found"
```bash
# 모델 파일 확인
ls -la server/best_plus.pt

# 파일이 없으면 다운로드
# (모델 파일은 별도로 제공되어야 함)
```

### "Port 3000 already in use"
```bash
# 다른 포트 사용
PORT=3001 pnpm dev

# 또는 기존 프로세스 종료
lsof -i :3000
kill -9 <PID>
```

---

## 📁 프로젝트 구조

```
ocean-litter-management-local/
├── client/                          # React 프론트엔드
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx            # 홈페이지
│   │   │   ├── Surveyor.tsx        # 조사원 페이지
│   │   │   ├── Driver.tsx          # 운반자 페이지
│   │   │   └── Manager.tsx         # 관리자 페이지
│   │   ├── components/             # 재사용 가능한 컴포넌트
│   │   └── App.tsx                 # 메인 앱
│   └── public/                     # 정적 자산
├── server/                          # Node.js 백엔드
│   ├── routers.ts                  # tRPC API 라우트
│   ├── db.ts                       # 데이터베이스 쿼리
│   ├── analyze.py                  # AI 분석 스크립트
│   └── best_plus.pt                # YOLOv11 모델
├── drizzle/                         # 데이터베이스 스키마
├── shared/                          # 공유 타입 및 상수
├── .env.local                       # 환경 변수 (생성됨)
├── setup.sh                         # Linux/Mac 설정 스크립트
├── setup.bat                        # Windows 설정 스크립트
└── package.json                     # 프로젝트 설정
```

---

## 🚀 개발 팁

### 핫 리로드 활성화
```bash
pnpm dev
```
파일 변경 시 자동으로 브라우저가 새로고침됩니다.

### 프로덕션 빌드
```bash
pnpm build
pnpm start
```

### 데이터베이스 상태 확인
```bash
# SQLite 데이터베이스 조회
sqlite3 dev.db ".tables"
sqlite3 dev.db "SELECT * FROM reports;"
```

### 로그 확인
```bash
# 터미널에서 개발 서버 로그 확인
pnpm dev

# Python 분석 로그
python3 server/analyze.py /path/to/image.jpg
```

---

## 📝 주의사항

- ⚠️ **로그인 기능이 제거되었습니다** - 모든 페이지에 로그인 없이 접근 가능
- ⚠️ **S3 파일 저장소가 비활성화되었습니다** - 로컬 파일 시스템 사용
- ⚠️ **OAuth 기능이 제거되었습니다** - 로컬 개발용
- ⚠️ **외부 API 호출이 제한되었습니다** - 로컬 환경에서만 작동

---

## 📞 지원

문제가 발생하면:

1. **브라우저 개발자 도구 확인** (F12)
   - Console 탭에서 에러 메시지 확인
   - Network 탭에서 API 요청 확인

2. **서버 로그 확인**
   ```bash
   pnpm dev
   ```

3. **환경 설정 확인**
   ```bash
   cat .env.local
   ```

4. **데이터베이스 초기화**
   ```bash
   rm dev.db
   pnpm db:push
   ```

---

## 🎉 시작하기

```bash
# 1. 자동 설정 실행
bash setup.sh  # 또는 setup.bat (Windows)

# 2. 개발 서버 시작
pnpm dev

# 3. 브라우저에서 접속
# http://localhost:3000
```

**Happy Coding! 🚀**

---

**버전**: 1.0.0  
**마지막 업데이트**: 2025-11-05  
**로컬 개발용 버전 (로그인 제거)**
