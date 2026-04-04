# 🚀 AI바다환경지킴이 - 로컬 빠른 시작 가이드

**목표**: 로컬 환경에서 YOLOv11 객체 탐지가 정상 작동하도록 설정하기

---

## ⚡ 5분 안에 시작하기

### 1단계: 파일 준비

```bash
# 프로젝트 압축 해제
tar -xzf ocean-litter-management.tar.gz
cd ocean-litter-management

# 필수 파일 확인
ls -la server/best_plus.pt      # 모델 파일 (100MB+)
ls -la server/data_litter.yaml  # 클래스 정의 파일
```

### 2단계: 의존성 설치

```bash
# Node.js 의존성
pnpm install

# Python 의존성 (새 터미널에서)
python -m venv venv
source venv/bin/activate  # macOS/Linux
# 또는
venv\Scripts\activate     # Windows

pip install ultralytics opencv-python-headless pillow numpy
```

### 3단계: 환경 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
DATABASE_URL="file:./local.db"
JWT_SECRET="dev-secret-key"
VITE_APP_ID="local-dev"
OAUTH_SERVER_URL="http://localhost:3000"
VITE_OAUTH_PORTAL_URL="http://localhost:3000"
OWNER_NAME="Local Dev"
OWNER_OPEN_ID="local-dev"
VITE_APP_TITLE="AI바다환경지킴이"
```

### 4단계: 서버 시작

```bash
# 터미널 1: Node.js 서버
pnpm dev

# 터미널 2: Python 가상환경 활성화 (선택사항)
source venv/bin/activate
```

### 5단계: 브라우저에서 접속

```
http://localhost:3000
```

---

## 🔍 AI 탐지 테스트

### 방법 1: 웹 UI에서 테스트 (권장)

1. 홈페이지 → **조사원 페이지**
2. 필수 정보 입력:
   - 해안명: "테스트"
   - 위치: 자동 또는 수동 입력
   - 수거량: 5
   - 해안 길이: 100
3. **쓰레기가 있는 사진** 2장 업로드
4. "보고서 전송" 클릭
5. 관리자 페이지에서 탐지 결과 확인

### 방법 2: 터미널에서 직접 테스트

```bash
# Python 스크립트 직접 실행
cd server
python ai_analyzer.py /path/to/image.jpg

# 예상 출력:
# {
#   "success": true,
#   "detections": [
#     {
#       "className": "Plastic_Buoy",
#       "confidence": "0.9234",
#       "xMin": 100,
#       "yMin": 150,
#       "xMax": 250,
#       "yMax": 300
#     }
#   ],
#   "count": 1
# }
```

---

## ❌ 문제 해결

### 문제 1: "Model file not found"

```bash
# 해결책:
ls -la server/best_plus.pt

# 파일이 없으면 복사:
cp /source/best_plus.pt server/
cp /source/data_litter.yaml server/
```

### 문제 2: "AssertionError: SRE module mismatch"

**원인**: Python 버전 불일치

```bash
# 해결책: 가상환경 재생성
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install ultralytics opencv-python-headless pillow numpy
```

### 문제 3: "ModuleNotFoundError: No module named 'ultralytics'"

```bash
# 해결책:
pip install ultralytics

# 또는 requirements.txt 생성:
cat > requirements.txt << EOF
ultralytics>=8.0.0
opencv-python-headless>=4.8.0
pillow>=10.0.0
numpy>=1.24.0
pyyaml>=6.0
EOF

pip install -r requirements.txt
```

### 문제 4: "Port 3000 already in use"

```bash
# 다른 포트에서 실행:
PORT=3001 pnpm dev

# 또는 기존 프로세스 종료:
# macOS/Linux:
lsof -i :3000
kill -9 <PID>

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 문제 5: "Database connection failed"

```bash
# 해결책: SQLite 사용
# .env.local 에서:
DATABASE_URL="file:./local.db"

# 마이그레이션 실행:
pnpm db:push
```

---

## 📊 성능 최적화

### 첫 실행 시간이 오래 걸리는 경우

```bash
# 모델 캐시 확인
# macOS/Linux:
ls -lah ~/.cache/ultralytics/

# Windows:
dir %APPDATA%\Ultralytics

# 캐시 삭제 후 재시작:
rm -rf ~/.cache/ultralytics/*
# 또는 Windows:
rmdir /s %APPDATA%\Ultralytics
```

### 메모리 부족 오류

```bash
# 신뢰도 임계값 조정 (server/ai_analyzer.py)
# 라인 51: conf=0.25 → conf=0.5 (더 엄격한 필터링)

# 또는 이미지 크기 조정:
# 라인 51에 추가:
# results = model(image_path, conf=0.25, imgsz=416)  # 기본값: 640
```

---

## 🎯 주요 파일 위치

```
ocean-litter-management/
├── server/
│   ├── ai_analyzer.py          ← AI 분석 스크립트 (수정 가능)
│   ├── best_plus.pt            ← YOLOv11 모델 (필수!)
│   ├── data_litter.yaml        ← 클래스 정의 (필수!)
│   ├── routers.ts              ← API 엔드포인트
│   └── db.ts                   ← 데이터베이스 쿼리
├── client/
│   ├── src/pages/
│   │   ├── Surveyor.tsx        ← 조사원 페이지
│   │   ├── Driver.tsx          ← 운반자 페이지
│   │   └── Manager.tsx         ← 관리자 페이지
│   └── src/App.tsx
├── drizzle/
│   └── schema.ts               ← 데이터베이스 스키마
├── .env.local                  ← 환경 변수 (생성 필요)
└── package.json
```

---

## 🧪 테스트 이미지 준비

### 좋은 테스트 이미지의 특징

✅ 쓰레기가 명확히 보임
✅ 조명이 충분함
✅ 해상도 최소 640x480
✅ JPG 또는 PNG 형식

### 테스트 이미지 생성

```bash
# 샘플 이미지 다운로드 (선택사항)
# 해양 쓰레기 사진을 구글 이미지에서 검색하여 저장

# 또는 기존 사진 사용:
# 스마트폰으로 촬영한 쓰레기 사진 사용
```

---

## 📱 모바일 테스트

### 로컬 네트워크에서 접속

```bash
# 1. 로컬 IP 확인
# macOS/Linux:
ifconfig | grep "inet "

# Windows:
ipconfig | findstr "IPv4"

# 2. 모바일 브라우저에서 접속
# http://<YOUR_IP>:3000
# 예: http://192.168.1.100:3000
```

---

## 🔧 고급 설정

### 커스텀 신뢰도 임계값

```python
# server/ai_analyzer.py 라인 51
results = model(image_path, conf=0.25)  # 0.25 = 25% 신뢰도

# 값 조정:
# 0.1 = 매우 민감 (오탐지 많음)
# 0.25 = 기본값 (권장)
# 0.5 = 엄격함 (놓치는 객체 있을 수 있음)
# 0.9 = 매우 엄격함 (확실한 것만 탐지)
```

### 이미지 크기 조정

```python
# server/ai_analyzer.py 라인 51
results = model(image_path, conf=0.25, imgsz=640)

# 값 조정:
# 320 = 빠름, 정확도 낮음
# 416 = 중간
# 640 = 기본값 (권장)
# 1280 = 느림, 정확도 높음
```

### 데이터베이스 백업

```bash
# SQLite 백업
cp local.db local.db.backup

# 또는 MySQL 백업:
mysqldump -u user -p database > backup.sql
```

---

## 📝 로그 확인

### 서버 로그 확인

```bash
# 터미널에서 실시간 로그 확인
# 다음 메시지를 찾으세요:

# ✅ 성공:
# "AI 분석 완료: 5개 객체 탐지"

# ❌ 오류:
# "AI 분석 오류: ..."
```

### 데이터베이스 확인

```bash
# SQLite 데이터 확인
sqlite3 local.db

# 쿼리 예시:
sqlite> SELECT * FROM reports LIMIT 5;
sqlite> SELECT * FROM ai_detections LIMIT 5;
sqlite> .quit
```

---

## 🚀 배포 준비

### 프로덕션 빌드

```bash
# 최적화된 빌드 생성
pnpm build

# 빌드 결과 확인
ls -la dist/
```

### 환경 변수 설정 (프로덕션)

```env
# .env.production
DATABASE_URL="mysql://user:password@host:3306/database"
JWT_SECRET="strong-secret-key-change-this"
VITE_APP_ID="production-app-id"
# 기타 프로덕션 설정...
```

---

## 💡 팁 & 트릭

1. **개발 중 자동 새로고침**: 파일 저장 시 브라우저 자동 새로고침
2. **핫 리로드**: Python 스크립트 수정 시 서버 재시작 필요
3. **디버깅**: 브라우저 DevTools (F12)에서 네트워크 탭 확인
4. **성능**: 대용량 이미지는 압축 후 업로드 권장

---

## 📞 추가 도움

### 자주 묻는 질문

**Q: AI 탐지가 작동하지 않습니다**
A: 
1. `best_plus.pt` 파일이 `server/` 디렉토리에 있는지 확인
2. Python 스크립트를 직접 실행해보기: `python server/ai_analyzer.py /path/to/image.jpg`
3. 서버 로그에서 오류 메시지 확인

**Q: 모델 파일이 너무 큽니다**
A: 모델 파일은 100MB 이상이 정상입니다. 다운로드 완료까지 기다려주세요.

**Q: 로컬에서 HTTPS를 사용할 수 있나요?**
A: 로컬 개발에는 HTTP로 충분합니다. 필요시 mkcert로 자체 서명 인증서 생성 가능.

**Q: 여러 사용자가 동시에 접속할 수 있나요?**
A: 로컬 개발 서버는 단일 사용자용입니다. 프로덕션 배포 시 적절한 호스팅 필요.

---

**마지막 업데이트**: 2025년 11월 5일
**버전**: 1.0.0 (로컬 실행 가이드)
