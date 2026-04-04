# AI 바다환경지킴이 웹사이트

AI 기반 객체 인식 기술을 활용하여 해양 쓰레기 수거 및 관리를 효율적으로 지원하는 웹 애플리케이션입니다. 조사원, 운반자, 관리자 세 가지 역할을 위한 기능을 제공합니다.

## 🚀 주요 기능

*   **AI 기반 쓰레기 탐지**: YOLOv11 모델을 활용하여 청소 전 사진에서 해양 쓰레기를 자동으로 탐지하고 분류합니다.
*   **수거 보고서 작성**: 조사원이 현장에서 수거량, 위치, 청소 전/후 사진을 업로드하여 보고서를 생성합니다.
*   **운반자 모드**: 현재 위치 기반으로 수거 지점까지의 거리를 표시하고, 수거 완료 처리를 할 수 있습니다. (집하장 기능 제거됨)
*   **관리자 대시보드**: 전체 수거 현황, 쓰레기 종류별 통계, 위치 기반 시각화 및 보고서 다운로드 기능을 제공합니다.

## 🛠️ 기술 스택

*   **Frontend**: React, TypeScript, Tailwind CSS, Wouter, Leaflet (지도)
*   **Backend**: Node.js (Express/tRPC), TypeScript
*   **Database**: SQLite (Drizzle ORM)
*   **AI/ML**: Python (Ultralytics YOLOv8/v11)
*   **Package Manager**: pnpm

## 📦 프로젝트 설정 및 실행

### 1. 저장소 클론

```bash
git clone [YOUR_REPOSITORY_URL]
cd ocean-litter-management
```

### 2. 의존성 설치 (pnpm 사용)

이 프로젝트는 **pnpm**을 패키지 관리자로 사용합니다. pnpm은 빠르고 효율적인 디스크 공간 관리를 제공합니다.

**pnpm 설치:**
```bash
npm install -g pnpm
```

**프로젝트 의존성 설치:**
```bash
pnpm install
```

### 3. 데이터베이스 및 환경 설정

이 프로젝트는 SQLite를 사용하며, 초기 설정이 필요합니다.

```bash
# 데이터베이스 초기화 및 마이그레이션 실행
pnpm run db:migrate
```

### 4. 로컬 실행

프론트엔드와 백엔드를 동시에 실행합니다.

```bash
pnpm run dev
```

성공적으로 실행되면, 브라우저에서 `http://localhost:3000` (또는 콘솔에 표시된 주소)로 접속할 수 있습니다.

## 🤝 공동 작업 방법

### Git 워크플로우

1.  **새로운 기능/버그 수정**: 작업을 시작하기 전에 항상 `main` 브랜치에서 최신 코드를 받아옵니다.
    ```bash
    git checkout main
    git pull origin main
    ```
2.  **브랜치 생성**: 작업 단위로 새로운 브랜치를 생성합니다. (예: `feature/add-report-download`, `fix/image-path-error`)
    ```bash
    git checkout -b feature/your-feature-name
    ```
3.  **작업 및 커밋**: 코드를 수정하고 커밋합니다. 커밋 메시지는 명확하고 간결하게 작성합니다.
    ```bash
    git add .
    git commit -m "feat: 관리자 페이지에 보고서 다운로드 기능 추가"
    ```
4.  **푸시 및 Pull Request (PR) 생성**: 작업이 완료되면 원격 저장소에 푸시하고, `main` 브랜치로 병합하기 위한 PR을 생성합니다.
    ```bash
    git push origin feature/your-feature-name
    ```
    GitHub에서 PR을 생성하고, 팀원들에게 코드 리뷰를 요청합니다.

### pnpm 사용 팁

*   **패키지 설치**:
    ```bash
    pnpm add [package-name]
    ```
*   **개발 의존성 설치**:
    ```bash
    pnpm add -D [package-name]
    ```
*   **패키지 제거**:
    ```bash
    pnpm remove [package-name]
    ```
*   **모든 의존성 업데이트**:
    ```bash
    pnpm update
    ```
*   **스크립트 실행**: `package.json`에 정의된 스크립트를 실행합니다.
    ```bash
    pnpm run [script-name]
    # 예: pnpm run dev
    ```

## 📂 프로젝트 구조 (핵심)

```
ocean-litter-management/
├── client/              # 프론트엔드 (React, TypeScript)
│   ├── src/
│   │   ├── pages/       # 페이지 컴포넌트 (Home, Surveyor, Driver, Manager)
│   │   └── lib/         # 유틸리티 함수 (calculateDistance 등)
├── server/              # 백엔드 (Node.js, tRPC, Python AI 로직)
│   ├── analyze.py       # Python AI 분석 스크립트
│   ├── routers.ts       # tRPC 라우터 정의 (API 엔드포인트)
│   └── db.ts            # 데이터베이스 접근 로직
├── db/                  # 데이터베이스 파일 및 이미지 저장소
│   ├── ocean-litter.db  # SQLite 데이터베이스 파일 (Git 제외)
│   ├── images/          # 이미지 저장소 (Git 제외)
│   └── reports/         # 생성된 보고서 CSV 파일 (Git 제외)
├── drizzle/             # Drizzle ORM 관련 파일
├── package.json         # 프로젝트 메타데이터 및 스크립트
├── pnpm-lock.yaml       # pnpm 잠금 파일
└── README.md            # 현재 파일
```
