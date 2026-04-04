# 바다환경지킴이 AI 웹사이트 - SQLite 버전 설정 가이드

## 개요

이 프로젝트는 조사원이 청소 전/후 사진을 업로드하면 YOLO AI 모델로 객체를 탐지하고, 결과를 데이터베이스에 저장하여 관리자 페이지에서 확인할 수 있는 시스템입니다.

## 주요 변경 사항

### 1. MySQL → SQLite 전환
- 로컬 환경에서 간편하게 실행 가능
- 데이터베이스 파일: `db/ocean-litter.db`
- 별도의 DB 서버 설치 불필요

### 2. YOLO 객체 탐지 기능 강화
- 청소 전 사진을 YOLO 모델(`server/best_plus.pt`)로 분석
- 탐지된 객체 정보(클래스, 신뢰도, 좌표)를 DB에 저장
- **탐지 결과 이미지**를 `db/images/` 폴더에 저장
- 원본 이미지 + 탐지 결과 이미지 모두 관리자 페이지에 표시

### 3. 로컬 이미지 저장
- 모든 이미지를 `db/images/` 폴더에 저장
- S3 대신 로컬 파일 시스템 사용
- Express 정적 파일 제공으로 이미지 접근

## 설치 및 실행 방법

### 1. 필수 요구사항

- **Node.js** 22.x 이상
- **Python** 3.8 이상
- **pnpm** (또는 npm)

### 2. 의존성 설치

#### Node.js 패키지 설치
```bash
cd /home/ubuntu/ocean-litter-management-local
pnpm install
```

#### Python 패키지 설치
```bash
pip3 install -r requirements.txt
```

주요 Python 패키지:
- `ultralytics` - YOLO 모델
- `opencv-python-headless` - 이미지 처리
- `torch`, `torchvision` - 딥러닝 프레임워크

### 3. 데이터베이스 초기화

SQLite 데이터베이스는 이미 초기화되어 있습니다. 재초기화가 필요한 경우:

```bash
sqlite3 db/ocean-litter.db < drizzle/0003_sqlite_migration.sql
```

### 4. 서버 실행

#### 개발 모드
```bash
pnpm dev
```

서버가 `http://localhost:3000`에서 실행됩니다.

#### 프로덕션 모드
```bash
pnpm build
pnpm start
```

## 프로젝트 구조

```
ocean-litter-management-local/
├── server/
│   ├── best_plus.pt          # YOLO 가중치 파일
│   ├── analyze.py             # YOLO 분석 스크립트
│   ├── db.ts                  # SQLite 데이터베이스 연결
│   ├── routers.ts             # API 라우터
│   └── _core/
│       └── index.ts           # Express 서버
├── client/
│   └── src/
│       └── pages/
│           └── Manager.tsx    # 관리자 페이지
├── db/
│   ├── ocean-litter.db        # SQLite 데이터베이스
│   └── images/                # 업로드된 이미지 및 탐지 결과
├── drizzle/
│   ├── schema.ts              # 데이터베이스 스키마
│   └── 0003_sqlite_migration.sql  # SQLite 마이그레이션
└── requirements.txt           # Python 의존성
```

## 데이터베이스 스키마

### users 테이블
- 사용자 정보 저장

### reports 테이블
- 조사원이 작성한 보고서
- `beforeImageUrl`: 청소 전 원본 이미지 URL
- `afterImageUrl`: 청소 후 이미지 URL
- `detectedImageUrl`: **YOLO 탐지 결과 이미지 URL** (새로 추가)

### aiDetections 테이블
- AI 객체 탐지 결과
- `reportId`: 연결된 보고서 ID
- `className`: 탐지된 객체 클래스명
- `confidence`: 신뢰도 (0-100)
- `xMin`, `yMin`, `xMax`, `yMax`: 바운딩 박스 좌표

## 워크플로우

### 1. 조사원이 사진 업로드
- 청소 전/후 사진을 웹에서 업로드
- API: `POST /api/trpc/reports.create`

### 2. 서버 처리
1. 이미지를 `db/images/` 폴더에 저장
2. 보고서를 데이터베이스에 생성
3. **백그라운드에서 YOLO 분석 시작**

### 3. YOLO 분석 (analyze.py)
1. 청소 전 이미지를 `best_plus.pt` 모델로 분석
2. 탐지된 객체 정보 추출
3. **바운딩 박스가 그려진 이미지 생성** (`detected_{reportId}.jpg`)
4. 탐지 결과를 `aiDetections` 테이블에 저장
5. **탐지 결과 이미지 URL을 `reports` 테이블에 업데이트**

### 4. 관리자 페이지에서 확인
- URL: `http://localhost:3000/manager`
- 모든 보고서 목록 조회
- 특정 보고서 선택 시:
  - **청소 전 원본 이미지**
  - **YOLO 탐지 결과 이미지** (바운딩 박스 포함)
  - **SVG 오버레이 이미지** (동적 바운딩 박스)
  - 탐지된 객체 목록 (클래스, 신뢰도)

## API 엔드포인트

### 보고서 관련
- `reports.create` - 보고서 생성 및 AI 분석 시작
- `reports.list` - 모든 보고서 조회
- `reports.getById` - 특정 보고서 조회
- `reports.uncollected` - 미수거 보고서 조회
- `reports.markCollected` - 수거 완료 처리

### AI 탐지 결과 관련
- `detections.getByReportId` - 특정 보고서의 탐지 결과 조회
- `detections.list` - 모든 탐지 결과 조회

## 관리자 페이지 기능

### 대시보드
- 총 보고서 수
- 총 수거량
- 수거 완료 건수
- 탐지된 쓰레기 종류별 통계

### 지도 시각화
- 보고서 위치를 지도에 표시
- 각 위치별 탐지된 쓰레기 통계 막대그래프

### AI 탐지 결과 시각화
- **원본 이미지**: 청소 전 사진 원본
- **YOLO 탐지 결과 이미지**: Python으로 생성된 바운딩 박스 이미지
- **SVG 오버레이 이미지**: 웹에서 동적으로 그려지는 바운딩 박스
- **탐지된 객체 목록**: 클래스명, 신뢰도 표시

## 문제 해결

### YOLO 모델 로드 실패
- `server/best_plus.pt` 파일이 존재하는지 확인
- Python 패키지가 올바르게 설치되었는지 확인

### 이미지가 표시되지 않음
- `db/images/` 폴더가 존재하는지 확인
- Express 서버가 `/db` 경로로 정적 파일을 제공하는지 확인

### 데이터베이스 오류
- `db/ocean-litter.db` 파일이 존재하는지 확인
- 마이그레이션이 실행되었는지 확인

## 개발 팁

### 데이터베이스 확인
```bash
sqlite3 db/ocean-litter.db
sqlite> .tables
sqlite> SELECT * FROM reports;
sqlite> SELECT * FROM aiDetections;
sqlite> .quit
```

### 로그 확인
- 서버 콘솔에서 `[AI]` 태그로 YOLO 분석 로그 확인
- `[Database]` 태그로 데이터베이스 연결 로그 확인

### 이미지 저장 경로 확인
```bash
ls -lh db/images/
```

## 라이선스

MIT License
