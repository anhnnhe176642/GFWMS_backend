#!/usr/bin/env python3
"""
Import existing YOLO dataset into database
Scans images/labels folders and registers them in the system
"""

import os
import json
import sys
from pathlib import Path
from datetime import datetime

# Get the dataset directory
script_dir = Path(__file__).parent
source_dataset_dir = script_dir / "source_dataset"
images_dir = source_dataset_dir / "images"
labels_dir = source_dataset_dir / "labels"
classes_file = source_dataset_dir / "classes.txt"


def get_image_path(label_filename):
    """Find image file corresponding to label file"""
    stem = Path(label_filename).stem
    
    # Try common image extensions
    for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
        img_path = images_dir / f"{stem}{ext}"
        if img_path.exists():
            return img_path
    
    return None


def read_classes():
    """Read class names from classes.txt"""
    classes = []
    if classes_file.exists():
        with open(classes_file, 'r') as f:
            classes = [line.strip() for line in f if line.strip()]
    return classes


def read_label_file(label_path):
    """Read YOLO format label file and return list of detections"""
    detections = []
    try:
        with open(label_path, 'r') as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 5:
                    detection = {
                        'class_id': int(parts[0]),
                        'center_x': float(parts[1]),
                        'center_y': float(parts[2]),
                        'width': float(parts[3]),
                        'height': float(parts[4])
                    }
                    detections.append(detection)
    except Exception as e:
        print(f"Error reading {label_path}: {e}")
    
    return detections


def get_image_info(image_path):
    """Get image dimensions"""
    try:
        import cv2
        img = cv2.imread(str(image_path))
        if img is not None:
            height, width = img.shape[:2]
            return width, height, os.path.getsize(image_path)
    except Exception as e:
        print(f"Error reading image {image_path}: {e}")
    
    return None, None, None


def generate_import_command(image_file, label_file, classes):
    """Generate API request command for importing"""
    
    image_path = get_image_path(label_file.name)
    if not image_path:
        print(f"⚠️  Image not found for {label_file.name}, skipping...")
        return None
    
    # Read labels
    labels = read_label_file(label_file)
    if not labels:
        print(f"⚠️  No labels found in {label_file.name}, skipping...")
        return None
    
    # Get image info
    width, height, filesize = get_image_info(image_path)
    if not width:
        print(f"⚠️  Cannot read image {image_path}, skipping...")
        return None
    
    # Add class names to labels
    labeled_data = []
    for label in labels:
        if label['class_id'] < len(classes):
            label['class_name'] = classes[label['class_id']]
            labeled_data.append(label)
    
    return {
        'image_path': str(image_path),
        'labels': labeled_data,
        'width': width,
        'height': height,
        'filesize': filesize
    }


def generate_import_script():
    """Generate JavaScript file to import all dataset"""
    
    classes = read_classes()
    print(f"✓ Found {len(classes)} classes: {classes}")
    
    # Collect all label files
    label_files = sorted(labels_dir.glob('*.txt'))
    print(f"✓ Found {len(label_files)} labeled images")
    
    if not label_files:
        print("❌ No label files found!")
        return
    
    # Generate import data
    import_data = []
    for label_file in label_files:
        print(f"\nProcessing {label_file.name}...")
        data = generate_import_command(None, label_file, classes)
        if data:
            import_data.append(data)
            print(f"  ✓ Image: {Path(data['image_path']).name}")
            print(f"  ✓ Labels: {len(data['labels'])}")
    
    print(f"\n✓ Total images ready to import: {len(import_data)}")
    
    # Save to JSON file for import
    output_file = script_dir / "import_data.json"
    with open(output_file, 'w') as f:
        json.dump({
            'dataset_name': 'fabric_v1.0',
            'dataset_description': 'Imported fabric defect dataset',
            'num_classes': len(classes),
            'classes': classes,
            'images': import_data,
            'total': len(import_data),
            'imported_at': datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"\n✓ Import data saved to: {output_file}")
    print("\nNext steps:")
    print("1. Create dataset: POST /api/v1/yolo/datasets")
    print("2. Use import_api.js to upload images")
    print("3. Or use the Python import script directly")


def main():
    print("=" * 60)
    print("YOLO Dataset Import Tool")
    print("=" * 60)
    
    # Check directories
    if not source_dataset_dir.exists():
        print(f"❌ Source dataset directory not found: {source_dataset_dir}")
        sys.exit(1)
    
    if not images_dir.exists():
        print(f"❌ Images directory not found: {images_dir}")
        sys.exit(1)
    
    if not labels_dir.exists():
        print(f"❌ Labels directory not found: {labels_dir}")
        sys.exit(1)
    
    if not classes_file.exists():
        print(f"⚠️  Classes file not found: {classes_file}")
        print("   Using default class names from label indices")
    
    generate_import_script()


if __name__ == "__main__":
    main()

