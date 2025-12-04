#!/usr/bin/env python3
"""
Test script để test YOLO detector độc lập (không qua Node.js)
Sử dụng: python test_detector.py <image_path> <model_path> [confidence]
"""

import sys
import os

# Add parent directory to path để import yolo_detector
sys.path.insert(0, os.path.dirname(__file__))

try:
    from yolo_detector import detect_objects
    import json
except ImportError as e:
    print(f"Error importing modules: {e}")
    print("Make sure ultralytics and other dependencies are installed:")
    print("pip install ultralytics opencv-python pillow numpy")
    sys.exit(1)


def main():
    """Main test function"""
    print("=" * 60)
    print("YOLO Detector Test Script")
    print("=" * 60)
    print()
    
    # Check arguments
    if len(sys.argv) < 3:
        print("Usage: python test_detector.py <image_path> <model_path> [confidence]")
        print()
        print("Example:")
        print("  python test_detector.py test_image.jpg models/best.pt 0.5")
        sys.exit(1)
    
    image_path = sys.argv[1]
    model_path = sys.argv[2]
    confidence = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5
    
    # Verify files exist
    if not os.path.exists(image_path):
        print(f"❌ Error: Image file not found: {image_path}")
        sys.exit(1)
    
    if not os.path.exists(model_path):
        print(f"❌ Error: Model file not found: {model_path}")
        sys.exit(1)
    
    print(f"📷 Image: {image_path}")
    print(f"🤖 Model: {model_path}")
    print(f"📊 Confidence: {confidence}")
    print()
    
    # Run detection
    print("⏳ Running detection...")
    print()
    
    result = detect_objects(image_path, model_path, confidence)
    
    # Print results
    if result['success']:
        print("✅ Detection successful!")
        print()
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print()
        print("-" * 60)
        print("SUMMARY")
        print("-" * 60)
        print(f"Total objects detected: {result['total_objects']}")
        print()
        
        if result['counts_by_class']:
            print("Objects by class:")
            for class_name, count in result['counts_by_class'].items():
                print(f"  - {class_name}: {count}")
        else:
            print("No objects detected.")
        
        print()
        print(f"Available classes in model: {list(result['model_info']['classes'].values())}")
        
    else:
        print(f"❌ Detection failed: {result['error']}")
        sys.exit(1)


if __name__ == "__main__":
    main()
