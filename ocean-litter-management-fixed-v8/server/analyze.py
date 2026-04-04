#!/usr/bin/env python3
import sys
import json
import os
from ultralytics import YOLO
import cv2
import csv

if len(sys.argv) < 4:
    print(json.dumps({"success": False, "error": "Usage: analyze.py <image_path> <output_root> <report_id> [image_index]"}))
    sys.exit(1)

image_path = sys.argv[1]
output_root = sys.argv[2]  # db 경로
report_id = sys.argv[3]
image_index = sys.argv[4] if len(sys.argv) > 4 else "0"

try:
    # 🗂️ 하위 폴더 정의
    detected_dir = os.path.join(output_root, "detected_images")
    csv_dir = os.path.join(output_root, "detections_csv")

    # 폴더 생성
    for d in [detected_dir, csv_dir]:
        os.makedirs(d, exist_ok=True)

    # 모델 로드
    model_path = os.path.join(os.path.dirname(__file__), "best_plus.pt")
    model = YOLO(model_path)

    # YOLO 분석 수행
    results = model(image_path, conf=0.25, verbose=False)

    # 🎨 클래스별 고정 색상 팔레트
    COLOR_MAP = {
        "Styrofoam_Buoy": (0, 255, 0),
        "Styrofoam_Piece": (0, 128, 255),
        "Plastic_Buoy": (255, 0, 0),
        "Plastic_Buoy_China": (0, 0, 255),
        "Plastic_aquaculture_chemical_container": (255, 128, 0),
        "Plastic_Container": (255, 0, 127),
        "Plastic_Bottle": (128, 0, 255),
        "Plastic_Pipe": (0, 255, 255),
        "Fishing_Net": (0, 200, 100),
        "Rope": (204, 51, 255),
        "Rubber": (255, 51, 51),
        "Glass_Bottle": (51, 153, 255),
        "Can": (255, 153, 51),
        "Wood": (102, 51, 0),
        "Metal": (192, 192, 192),
        "Cloth": (255, 51, 153),
        "Paper": (0, 204, 102),
        "Vinyl": (153, 255, 51),
        "Etc": (153, 51, 255),
        "Plastic_Stick": (255, 102, 0),
        "Plastic_Bag": (0, 102, 204),
        "Buoy_Frag": (255, 204, 0),
    }

    detections = []
    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf = box.conf[0].item()
            cls = int(box.cls[0].item())
            class_name = result.names[cls]

            detections.append({
                'className': class_name,
                'confidence': round(conf * 100, 2),
                'xMin': int(x1),
                'yMin': int(y1),
                'xMax': int(x2),
                'yMax': int(y2)
            })

    # 💾 CSV 저장 (파일명에 인덱스 포함)
    csv_filename = f"detections_{report_id}_{image_index}.csv"
    csv_path = os.path.join(csv_dir, csv_filename)
    with open(csv_path, mode='w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=["className", "confidence", "xMin", "yMin", "xMax", "yMax"])
        writer.writeheader()
        writer.writerows(detections)

    # 🖼️ 탐지 결과 이미지 저장 (파일명에 인덱스 포함)
    detected_filename = f"detected_{report_id}_{image_index}.jpg"
    detected_path = os.path.join(detected_dir, detected_filename)
    img = cv2.imread(image_path)

    if img is not None:
        for detection in detections:
            x1, y1 = detection['xMin'], detection['yMin']
            x2, y2 = detection['xMax'], detection['yMax']
            conf = detection['confidence']
            class_name = detection['className']
            color = COLOR_MAP.get(class_name, (128, 128, 128))

            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
            label = f"{class_name}: {conf:.1f}%"
            (text_width, text_height), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            bg_color = tuple(int(c * 0.7) for c in color)
            cv2.rectangle(img, (x1, max(y1 - text_height - 10, 0)), (x1 + text_width, y1), bg_color, -1)
            cv2.putText(img, label, (x1 + 2, max(y1 - 5, 15)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        cv2.imwrite(detected_path, img)

    # ✅ 결과 출력 (상대 경로 반환)
    output = {
        'success': True,
        'detections': detections,
        'detectedImageFilename': f"detected_images/{detected_filename}",
        'csvFilename': f"detections_csv/{csv_filename}"
    }
    sys.stdout.write(json.dumps(output))
    sys.stdout.flush()

except Exception as e:
    sys.stdout.write(json.dumps({'success': False, 'error': str(e), 'detections': []}))
    sys.stdout.flush()
    sys.exit(1)
