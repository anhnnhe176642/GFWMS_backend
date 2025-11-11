#!/usr/bin/env python3
"""
YOLO Object Detection Script
Detects objects in an image and returns JSON with coordinates and counts
"""

import sys
import json
import os
from ultralytics import YOLO
import cv2


def detect_objects(image_path, model_path, conf_threshold=0.5):
    """
    Detect objects in image using YOLO model
    
    Args:
        image_path: Path to input image
        model_path: Path to YOLO model (.pt file)
        conf_threshold: Confidence threshold for detections
        
    Returns:
        dict: Detection results with coordinates and counts
    """
    try:
        # Load YOLO model
        model = YOLO(model_path)
        
        # Read image to get dimensions
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Cannot read image: {image_path}")
        
        img_height, img_width = image.shape[:2]
        
        # Run inference
        results = model(image_path, conf=conf_threshold, verbose=False)
        
        # Process results
        detections = []
        class_counts = {}
        
        for result in results:
            boxes = result.boxes
            
            for box in boxes:
                class_id = int(box.cls[0])
                class_name = result.names[class_id]
                confidence = float(box.conf[0])
                
                # Get bounding box coordinates (xyxy format)
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                
                # Calculate center point
                center_x = (x1 + x2) / 2
                center_y = (y1 + y2) / 2
                
                # Calculate width and height
                width = x2 - x1
                height = y2 - y1
                
                detection = {
                    'class_id': class_id,
                    'class_name': class_name,
                    'confidence': round(confidence, 4),
                    'bbox': {
                        'x1': round(x1, 2),
                        'y1': round(y1, 2),
                        'x2': round(x2, 2),
                        'y2': round(y2, 2)
                    },
                    'center': {
                        'x': round(center_x, 2),
                        'y': round(center_y, 2)
                    },
                    'dimensions': {
                        'width': round(width, 2),
                        'height': round(height, 2)
                    }
                }
                
                detections.append(detection)
                
                # Count objects by class
                class_counts[class_name] = class_counts.get(class_name, 0) + 1
        
        # Prepare response
        response = {
            'success': True,
            'image_info': {
                'width': img_width,
                'height': img_height,
                'path': image_path
            },
            'total_objects': len(detections),
            'counts_by_class': class_counts,
            'detections': detections,
            'model_info': {
                'model_path': model_path,
                'confidence_threshold': conf_threshold,
                'classes': result.names if results else {}
            }
        }
        
        return response
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }


def main():
    """Main entry point for the script"""
    if len(sys.argv) < 3:
        error_response = {
            'success': False,
            'error': 'Usage: python yolo_detector.py <image_path> <model_path> [confidence_threshold]'
        }
        print(json.dumps(error_response))
        sys.exit(1)
    
    image_path = sys.argv[1]
    model_path = sys.argv[2]
    conf_threshold = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5
    
    # Validate inputs
    if not os.path.exists(image_path):
        error_response = {
            'success': False,
            'error': f'Image file not found: {image_path}'
        }
        print(json.dumps(error_response))
        sys.exit(1)
    
    if not os.path.exists(model_path):
        error_response = {
            'success': False,
            'error': f'Model file not found: {model_path}'
        }
        print(json.dumps(error_response))
        sys.exit(1)
    
    # Run detection
    result = detect_objects(image_path, model_path, conf_threshold)
    
    # Output JSON result
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    # Exit with appropriate code
    sys.exit(0 if result['success'] else 1)


if __name__ == "__main__":
    main()
