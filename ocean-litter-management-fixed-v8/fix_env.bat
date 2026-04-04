@echo off
title Ocean Litter System - Environment Fixer
echo =====================================================
echo   Ocean Litter Management System Environment Fixer
echo =====================================================
echo.

:: [1/4] Python 경로 확인
echo [1/4] Checking Python environment...

:: 현재 활성화된 가상환경의 python 확인
where python > temp_path.txt 2>&1
set /p PYTHON_PATH=<temp_path.txt
del temp_path.txt

:: 만약 Microsoft Store 버전이거나 없으면 다시 확인
echo %PYTHON_PATH% | findstr /i "WindowsApps" > nul
if %errorlevel% equ 0 (
    set PYTHON_CHECK=FAIL
) else if "%PYTHON_PATH%"=="" (
    set PYTHON_CHECK=FAIL
) else (
    set PYTHON_CHECK=SUCCESS
)

if "%PYTHON_CHECK%"=="FAIL" (
    echo.
    echo [!] ERROR: Python was not found in your current environment.
    echo.
    echo [HOW TO FIX]
    echo 1. Open 'Anaconda Prompt' (not CMD or PowerShell).
    echo 2. Type: conda activate ocean-litter
    echo 3. Navigate to this folder and run fix_env.bat again.
    echo.
    pause
    exit /b
)

echo Using Python at: %PYTHON_PATH%
python --version

echo.
:: [2/4] 라이브러리 재설치 및 추가 설치
echo [2/4] Installing required libraries (numpy, opencv, ultralytics, fpdf2)...
echo This may take a few minutes. Please wait...
python -m pip uninstall -y numpy opencv-python opencv-contrib-python ultralytics fpdf2 fpdf
python -m pip install numpy==1.24.3 opencv-python ultralytics fpdf2 --force-reinstall

echo.
:: [3/4] Visual C++ 확인
echo [3/4] Checking for Visual C++ Redistributable...
echo If you still see DLL errors, please install: https://aka.ms/vs/17/release/vc_redist.x64.exe

echo.
:: [4/4] DB 초기화
echo [4/4] Resetting database to fix duplicate counts...
echo This will clear all existing reports and detections.
set /p confirm="Do you want to reset the database? (y/n): "
if /i "%confirm%"=="y" (
    if exist "db\ocean-litter.db" (
        echo Cleaning database...
        python -c "import sqlite3; conn = sqlite3.connect('db/ocean-litter.db'); cursor = conn.cursor(); cursor.execute('DELETE FROM reports'); cursor.execute('DELETE FROM aiDetections'); cursor.execute('DELETE FROM users'); conn.commit(); conn.close(); print('Database has been reset.')"
    ) else (
        echo Database file not found, skipping reset.
    )
)

echo.
echo =====================================================
echo   Fix completed! Please restart the server.
echo =====================================================
pause
