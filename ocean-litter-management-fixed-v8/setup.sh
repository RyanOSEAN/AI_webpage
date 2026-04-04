#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 해양 쓰레기 관리 시스템 - 로컬 설정${NC}"
echo "================================================"

# 1. Node.js 확인
echo -e "\n${YELLOW}1️⃣  Node.js 확인...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js가 설치되지 않았습니다.${NC}"
    echo "Node.js 18+ 설치: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# 2. Python 확인
echo -e "\n${YELLOW}2️⃣  Python 확인...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3이 설치되지 않았습니다.${NC}"
    echo "Python 3.8+ 설치: https://www.python.org/"
    exit 1
fi
echo -e "${GREEN}✅ Python $(python3 --version)${NC}"

# 3. pnpm 확인
echo -e "\n${YELLOW}3️⃣  pnpm 확인...${NC}"
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm이 설치되지 않았습니다. npm을 사용합니다.${NC}"
    PACKAGE_MANAGER="npm"
else
    PACKAGE_MANAGER="pnpm"
    echo -e "${GREEN}✅ pnpm $(pnpm --version)${NC}"
fi

# 4. 의존성 설치
echo -e "\n${YELLOW}4️⃣  의존성 설치...${NC}"
echo "Node.js 패키지 설치 중..."
$PACKAGE_MANAGER install

echo "Python 패키지 설치 중..."
pip install -r requirements.txt

# 5. 환경 설정
echo -e "\n${YELLOW}5️⃣  환경 설정...${NC}"
if [ ! -f ".env.local" ]; then
    echo "DATABASE_URL=\"file:./dev.db\"" > .env.local
    echo "VITE_APP_TITLE=\"AI바다환경지킴이\"" >> .env.local
    echo "VITE_APP_ID=\"local-dev\"" >> .env.local
    echo "PORT=3000" >> .env.local
    echo -e "${GREEN}✅ .env.local 파일 생성됨${NC}"
else
    echo -e "${GREEN}✅ .env.local 파일 이미 존재${NC}"
fi

# 6. 데이터베이스 초기화
echo -e "\n${YELLOW}6️⃣  데이터베이스 초기화...${NC}"
$PACKAGE_MANAGER db:push

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}✅ 설정 완료!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}다음 명령으로 개발 서버를 시작하세요:${NC}"
echo -e "${GREEN}$PACKAGE_MANAGER dev${NC}"
echo ""
echo -e "${YELLOW}브라우저에서 접속:${NC}"
echo -e "${GREEN}http://localhost:3000${NC}"
echo ""
