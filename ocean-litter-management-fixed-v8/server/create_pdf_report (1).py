import sys
import json
import os
from fpdf import FPDF

class PDF(FPDF):
    def __init__(self):
        super().__init__()
        # 한글 폰트 경로 설정
        font_paths = [
            '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
            '/usr/share/fonts/truetype/nanum/NanumGothic.ttf',
            'C:\\Windows\\Fonts\\malgun.ttf', # Windows
            '/System/Library/Fonts/Supplemental/AppleGothic.ttf' # macOS
        ]
        
        self.font_path = ''
        for path in font_paths:
            if os.path.exists(path):
                self.font_path = path
                break
        
        if self.font_path:
            self.add_font('NotoSans', '', self.font_path, uni=True)
            self.add_font('NotoSans', 'B', self.font_path, uni=True)
            self.default_font = 'NotoSans'
        else:
            self.default_font = 'Arial'

    def header(self):
        self.set_font(self.default_font, 'B', 16)
        self.cell(0, 10, '해양 쓰레기 수거 현황 보고서', 0, 1, 'C')
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
        f"보고서 ID: {report_data['id']}\n"
        f"조사자: {report_data.get('surveyorName', '-')}\n"
        f"조사 일시: {report_data['createdAt']}\n"
        f"수거 상태: {'수거 완료' if report_data['isCollected'] else '수거 대기'}\n"
        f"해안명: {report_data['beachName']}\n"
        f"좌표: 위도 {report_data['latitude']}, 경도 {report_data['longitude']}\n"
        f"수거량: {report_data['collectionAmount']} 마대\n"
        f"쓰레기 종류: {report_data.get('mainTrash', '-')}\n"
        f"청소 용이성: {report_data.get('cleaningEase', '-')}"
    )
    pdf.chapter_body(summary_body)

    pdf.chapter_title('2. AI 탐지 결과 요약')
    detections = report_data.get('detections', [])
    if detections:
        detection_header = ['쓰레기 종류', '탐지 개수']
        detection_data = [[det['className'], f"{det['count']}개"] for det in detections]
        pdf.add_table(detection_header, detection_data)
    else:
        pdf.chapter_body("식별된 데이터가 없습니다.")

    pdf.chapter_title('3. 현장 사진 (AI 식별)')
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    
    detected_urls = json.loads(report_data.get('detectedImageUrls', '[]'))
    if not detected_urls:
        detected_urls = json.loads(report_data.get('beforeImageUrls', '[]'))
        
    col_width = (pdf.w - 30) / 2
    
    for i, url in enumerate(detected_urls):
        if 'path=' in url:
            url = url.split('path=')[1]
        
        img_path = os.path.join(base_dir, url.lstrip('/'))
        if os.path.exists(img_path):
            if pdf.get_y() > 230: pdf.add_page()
            x_pos = 15 if i % 2 == 0 else 15 + col_width + 5
            y_pos = pdf.get_y()
            try:
                pdf.image(img_path, x=x_pos, y=y_pos, w=col_width)
                if i % 2 == 1 or i == len(detected_urls) - 1:
                    pdf.set_y(y_pos + col_width * 0.75 + 10)
            except:
                pdf.cell(0, 10, f"이미지 로드 실패: {url}", 0, 1)
        else:
            pdf.cell(0, 10, f"이미지 없음: {url}", 0, 1)

    if pdf.get_y() > 150: pdf.add_page()
    pdf.chapter_title('4. 수거 후 사진')
    after_url = report_data.get('afterImageUrl')
    if after_url:
        if 'path=' in after_url:
            after_url = after_url.split('path=')[1]
        img_path = os.path.join(base_dir, after_url.lstrip('/'))
        if os.path.exists(img_path):
            pdf.image(img_path, x=15, y=pdf.get_y(), w=pdf.w - 30)
        else:
            pdf.cell(0, 10, f"이미지 없음: {after_url}", 0, 1)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    pdf.output(output_path)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)
    create_pdf_report(sys.argv[1], sys.argv[2])
