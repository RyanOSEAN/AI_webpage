#!/usr/bin/env python3
"""
YOLOv11 해양 쓰레기 객체 탐지 분석 스크립트
Node.js 서버에서 호출하여 이미지 분석 결과를 JSON으로 반환
"""
import sys
import json
from ultralytics import YOLO
import os

# 모델 및 설정 파일 경로
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, 'best_plus.pt')
YAML_PATH = os.path.join(SCRIPT_DIR, 'data_litter.yaml')

# 클래스 이름 정의 (YAML 파일과 동일)
CLASS_NAMES = [
    'Bait container', 'Colored plastic bottle', 'Eel corn', 'Eel trap', 
    'Glass', 'Metal', 'Net', 'PET_Bottle', 'Plastic_Buoy', 
    'Plastic_Buoy_China', 'Plastic_Disposable_Food_container', 
    'Plastic_ETC', 'Plastic_Oil_Bottle', 
    'Plastic_aquaculture_chemical_container', 
    'Plastic_aquaculture_laver_pole', 'Plastic_disposable_cup', 
    'Rope', 'Spring trap', 'Styrofoam_Box', 'Styrofoam_Buoy', 
    'Styrofoam_Piece', 'Takeout cup'
]

def analyze_image(image_path):
    """
    이미지를 분석하여 탐지된 객체 정보를 반환
    
    Args:
        image_path: 분석할 이미지 파일 경로
        
    Returns:
        dict: 탐지 결과 (detections 리스트 포함)
    """
    try:
        # 모델 파일 존재 확인
        if not os.path.exists(MODEL_PATH):
            return {
                'success': False,
                'error': f'Model file not found: {MODEL_PATH}',
                'detections': []
            }
        
        # 모델 로드
        model = YOLO(MODEL_PATH)
        
        # 이미지 분석 수행
        results = model(image_path, conf=0.25)  # 신뢰도 임계값 25%
        
        detections = []
        
        # 결과 파싱
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # 바운딩 박스 좌표 (xyxy 형식)
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                
                # 신뢰도 및 클래스
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])
                class_name = CLASS_NAMES[class_id] if class_id < len(CLASS_NAMES) else f"Unknown_{class_id}"
                
                detections.append({
                    'className': class_name,
                    'confidence': f"{confidence:.4f}",
                    'xMin': int(x1),
                    'yMin': int(y1),
                    'xMax': int(x2),
                    'yMax': int(y2)
                })
        
        return {
            'success': True,
            'detections': detections,
            'count': len(detections)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'detections': []
        }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'No image path provided'
        }))
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    if not os.path.exists(image_path):
        print(json.dumps({
            'success': False,
            'error': f'Image file not found: {image_path}'
        }))
        sys.exit(1)
    
    result = analyze_image(image_path)
    print(json.dumps(result, ensure_ascii=False))
