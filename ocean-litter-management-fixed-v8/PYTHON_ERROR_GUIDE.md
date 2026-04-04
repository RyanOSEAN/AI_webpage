# Python 환경 오류 (DLL load failed) 해결 가이드

현재 발생하고 있는 `ImportError: DLL load failed while importing _multiarray_umath` 오류는 주로 Windows 환경의 Anaconda에서 `numpy`나 `opencv` 라이브러리가 시스템의 C++ 런타임 라이브러리와 충돌하거나, 설치가 불완전할 때 발생합니다.

## 해결 방법

### 방법 1: 자동 복구 스크립트 실행 (가장 간편)
1. **'Anaconda Prompt'**를 실행합니다.
2. `conda activate ocean-litter` 명령어로 가상환경을 활성화합니다.
3. 프로젝트 폴더로 이동한 뒤 **`fix_env.bat`**를 입력하여 실행하세요.
   (또는 가상환경이 활성화된 상태에서 이 파일을 마우스 오른쪽 버튼으로 클릭하여 실행해도 됩니다.)

### 방법 2: 수동 라이브러리 재설치
터미널(Anaconda Prompt)을 열고 현재 가상환경(`ocean-litter`)이 활성화된 상태에서 다음 명령어를 입력하세요.

```bash
pip uninstall -y numpy opencv-python opencv-contrib-python ultralytics
pip install numpy==1.24.3 opencv-python ultralytics --force-reinstall
```

### 방법 2: Visual C++ 재배포 가능 패키지 설치
`cv2`와 `numpy`는 Microsoft Visual C++ Redistributable 패키지가 필요합니다. 아래 링크에서 최신 버전을 다운로드하여 설치하세요.
- [최신 지원 Visual C++ 다운로드](https://aka.ms/vs/17/release/vc_redist.x64.exe)

### 방법 3: 환경 변수 충돌 확인
만약 여러 버전의 Python이나 Anaconda가 설치되어 있다면, 시스템 환경 변수의 `Path`에서 다른 Python 경로가 우선순위에 있는지 확인해 보세요.

---
**참고**: `server/analyze.py` 코드 내에 Windows 환경에서의 라이브러리 충돌을 방지하기 위한 `KMP_DUPLICATE_LIB_OK` 설정과 예외 처리 로직을 추가해 두었습니다. 위 조치 후에도 문제가 지속되면 `pip install --upgrade ultralytics`를 시도해 보시기 바랍니다.
