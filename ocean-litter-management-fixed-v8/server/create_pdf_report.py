import sys
import json
import os
try:
    from fpdf import FPDF
except ImportError:
    import json
    import sys
    print(json.dumps({"success": False, "error": "fpdf2 라이브러리가 설치되지 않았습니다. fix_env.bat를 실행하세요."}))
    sys.exit(1)

class PDF(FPDF):
    def __init__(self):
        super().__init__()
        # 한글 폰트 경로 설정 (Windows 환경 우선)
        font_paths = [
            'C:\\Windows\\Fonts\\malgun.ttf', # Windows (맑은 고딕)
            'C:\\Windows\\Fonts\\gulim.ttc',  # Windows (굴림)
            '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
            '/usr/share/fonts/truetype/nanum/NanumGothic.ttf',
            '/System/Library/Fonts/Supplemental/AppleGothic.ttf' # macOS
        ]
        
        self.font_path = ''
        for path in font_paths:
            if os.path.exists(path):
                self.font_path = path
                break
        
        if self.font_path:
            # fpdf2에서는 fname 파라미터를 명시적으로 사용
            self.add_font('NotoSans', '', fname=self.font_path)
            self.add_font('NotoSans', 'B', fname=self.font_path)
            self.default_font = 'NotoSans'
        else:
            self.default_font = 'Arial'

    def header(self):
        self.set_font(self.default_font, 'B', 16)
        self.cell(0, 10, '바다환경지킴이 수거 현황 보고서', 0, 1, 'C')
        self.ln(10)

    def chapter_title(self, title):
        self.set_font(self.default_font, 'B', 12)
        self.cell(0, 10, title, 0, 1, 'L')
        self.ln(4)

    def chapter_body(self, body):
        self.set_font(self.default_font, '', 10)
        self.multi_cell(0, 8, body)
        self.ln()

    def add_table(self, header, data):
        self.set_font(self.default_font, 'B', 10)
        col_width = (self.w - 20) / len(header)
        for h in header:
            self.cell(col_width, 10, h, 1, 0, 'C')
        self.ln()
        self.set_font(self.default_font, '', 10)
        for row in data:
            for item in row:
                self.cell(col_width, 10, str(item), 1, 0, 'C')
            self.ln()
        self.ln()

def create_pdf_report(report_data_json, output_path):
    try:
        report_data = json.loads(report_data_json)
    except Exception as e:
        print(f"JSON 파싱 오류: {e}")
        return

    pdf = PDF()
    pdf.add_page()

    pdf.chapter_title('1. 요약 정보')
    summary_body = (
        f"조사자: {report_data.get('surveyorName', '-')}\n"
        f"보고서 ID : {report_data['id']}\n"
        f"조사 일시 : {report_data['createdAt']}\n"
        f"수거 상태 : {'수거 완료' if report_data['isCollected'] else '수거 대기'}\n"
        f"해안명 : {report_data['beachName']}\n"
        f"좌표 : {report_data['latitude']}, {report_data['longitude']}\n"
        f"수거량(마대 수) : {report_data['collectionAmount']} 개\n"
        f"쓰레기 종류 : {report_data.get('mainTrash', '-')}\n"
        f"청소 용이성 : {report_data.get('cleaningEase', '-')}"
    )
    pdf.chapter_body(summary_body)

    pdf.chapter_title('2. 쓰레기 객체탐지분석 결과')
    detections = report_data.get('detections', [])
    if detections:
        detection_header = ['쓰레기 종류', '탐지 개수']
        detection_data = [[det['className'], f"{det['count']}개"] for det in detections]
        pdf.add_table(detection_header, detection_data)
    else:
        pdf.chapter_body("식별된 데이터가 없습니다.")

    pdf.chapter_title('3. 현장 청소 전 사진 (AI 식별)')
    # 프로젝트 루트 경로 찾기
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    
    detected_urls = json.loads(report_data.get('detectedImageUrls', '[]'))
    if not detected_urls or (isinstance(detected_urls, list) and len(detected_urls) > 0 and detected_urls[0] == 'PROCESSING'):
        detected_urls = json.loads(report_data.get('beforeImageUrls', '[]'))
        
    # A4 가로 폭에 맞춘 이미지 너비 (여백 제외 약 180mm)
    full_width = pdf.w - 30
    
    for i, url in enumerate(detected_urls):
        # API URL 형태 제거
        if 'path=' in url:
            url = url.split('path=')[1]
        
        img_path = os.path.join(base_dir, url.lstrip('/'))
        if os.path.exists(img_path):
            # 이미지가 페이지 하단에 걸릴 경우 새 페이지 추가
            if pdf.get_y() > 180: pdf.add_page()
            
            try:
                # 이미지를 가로 폭에 맞춰 삽입 (세로 비율 자동 조절)
                pdf.image(img_path, x=15, y=pdf.get_y(), w=full_width)
                pdf.ln(full_width * 0.75 + 10) # 이미지 높이만큼 줄바꿈 (대략적인 비율 4:3 적용)
            except:
                pdf.cell(0, 10, f"이미지 로드 실패: {url}", 0, 1)
        else:
            pdf.cell(0, 10, f"이미지 없음: {url}", 0, 1)

    # 수거 후 사진 섹션 (새 페이지 권장)
    pdf.add_page()
    pdf.chapter_title('4. 수거 후 사진')
    after_url = report_data.get('afterImageUrl')
    if after_url:
        if 'path=' in after_url:
            after_url = after_url.split('path=')[1]
        img_path = os.path.join(base_dir, after_url.lstrip('/'))
        if os.path.exists(img_path):
            try:
                pdf.image(img_path, x=15, y=pdf.get_y(), w=full_width)
            except:
                pdf.cell(0, 10, f"이미지 로드 실패: {after_url}", 0, 1)
        else:
            pdf.cell(0, 10, f"이미지 없음: {after_url}", 0, 1)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    pdf.output(output_path)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)
    create_pdf_report(sys.argv[1], sys.argv[2])
