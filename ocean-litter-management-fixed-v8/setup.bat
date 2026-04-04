@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo 🚀 해양 쓰레기 관리 시스템 - 로컬 설정
echo ================================================
echo.

REM 1. Node.js 확인
echo 1️⃣  Node.js 확인...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js가 설치되지 않았습니다.
    echo Node.js 18+ 설치: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION%
echo.

REM 2. Python 확인
echo 2️⃣  Python 확인...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python이 설치되지 않았습니다.
    echo Python 3.8+ 설치: https://www.python.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ✅ %PYTHON_VERSION%
echo.

REM 3. pnpm 또는 npm 확인
echo 3️⃣  패키지 매니저 확인...
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  pnpm이 설치되지 않았습니다. npm을 사용합니다.
    set PACKAGE_MANAGER=npm
) else (
    for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VERSION=%%i
    echo ✅ pnpm %PNPM_VERSION%
    set PACKAGE_MANAGER=pnpm
)
echo.

REM 4. 의존성 설치
echo 4️⃣  의존성 설치...
echo Node.js 패키지 설치 중...
call %PACKAGE_MANAGER% install
echo.
echo Python 패키지 설치 중...
pip install -r requirements.txt
echo.

REM 5. 환경 설정
echo 5️⃣  환경 설정...
if not exist ".env.local" (
    (
        echo DATABASE_URL="file:./dev.db"
        echo VITE_APP_TITLE="AI바다환경지킴이"
        echo VITE_APP_ID="local-dev"
        echo PORT=3000
    ) > .env.local
    echo ✅ .env.local 파일 생성됨
) else (
    echo ✅ .env.local 파일 이미 존재
)
echo.

REM 6. 데이터베이스 초기화
echo 6️⃣  데이터베이스 초기화...
call %PACKAGE_MANAGER% db:push
echo.

echo ================================================
echo ✅ 설정 완료!
echo ================================================
echo.
echo 다음 명령으로 개발 서버를 시작하세요:
echo %PACKAGE_MANAGER% dev
echo.
echo 브라우저에서 접속:
echo http://localhost:3000
echo.
pause
