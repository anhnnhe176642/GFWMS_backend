#!/usr/bin/env python3
"""
YOLO Dataset Manager
Saves images and labels in YOLO format for training
Handles dataset organization: train/val/test splits
"""

import sys
import json
import os
import shutil
from pathlib import Path
import cv2


class YOLODatasetManager:
    """Manage YOLO format datasets"""
    
    def __init__(self, dataset_root="datasets"):
        """
        Initialize dataset manager
        
        Args:
            dataset_root: Root directory for datasets (relative to script)
        """
        script_dir = Path(__file__).parent
        self.dataset_root = script_dir / dataset_root
        self.images_dir = self.dataset_root / "images"
        self.labels_dir = self.dataset_root / "labels"
        
        # Create directory structure
        for split in ['train', 'val', 'test']:
            (self.images_dir / split).mkdir(parents=True, exist_ok=True)
            (self.labels_dir / split).mkdir(parents=True, exist_ok=True)
    
    def save_image_with_labels(self, image_path, labels, split='train', image_id=None):
        """
        Save image and its labels in YOLO format
        
        Args:
            image_path: Path to source image
            labels: List of label dicts with format:
                    [{'class_id': 0, 'center_x': 0.5, 'center_y': 0.5, 
                      'width': 0.3, 'height': 0.4}, ...]
            split: 'train', 'val', or 'test'
            image_id: Custom image ID (if None, auto-generate from filename)
            
        Returns:
            dict: Result with saved paths
        """
        try:
            # Validate split
            if split not in ['train', 'val', 'test']:
                raise ValueError(f"Invalid split: {split}. Must be train/val/test")
            
            # Read image to verify and get dimensions
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Cannot read image: {image_path}")
            
            img_height, img_width = image.shape[:2]
            
            # Generate filename
            if image_id is None:
                original_name = Path(image_path).stem
                image_id = original_name
            
            # Ensure unique filename
            base_name = f"{image_id}"
            counter = 1
            while (self.images_dir / split / f"{base_name}.jpg").exists():
                base_name = f"{image_id}_{counter}"
                counter += 1
            
            # Define paths
            img_filename = f"{base_name}.jpg"
            label_filename = f"{base_name}.txt"
            
            dest_img_path = self.images_dir / split / img_filename
            dest_label_path = self.labels_dir / split / label_filename
            
            # Copy image
            shutil.copy2(image_path, dest_img_path)
            
            # Write labels in YOLO format
            with open(dest_label_path, 'w') as f:
                for label in labels:
                    # YOLO format: class_id center_x center_y width height
                    line = f"{label['class_id']} {label['center_x']:.6f} {label['center_y']:.6f} {label['width']:.6f} {label['height']:.6f}\n"
                    f.write(line)
            
            # Get relative paths
            rel_img_path = str(dest_img_path.relative_to(self.dataset_root.parent))
            rel_label_path = str(dest_label_path.relative_to(self.dataset_root.parent))
            
            return {
                'success': True,
                'image_path': rel_img_path,
                'label_path': rel_label_path,
                'image_filename': img_filename,
                'label_filename': label_filename,
                'split': split,
                'num_labels': len(labels),
                'image_size': {
                    'width': img_width,
                    'height': img_height
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'error_type': type(e).__name__
            }
    
    def convert_bbox_to_yolo(self, bbox, img_width, img_height):
        """
        Convert bounding box from detection format to YOLO format
        
        Args:
            bbox: Dict with keys {x1, y1, x2, y2} (pixel coordinates)
            img_width: Image width
            img_height: Image height
            
        Returns:
            dict: Normalized YOLO format {center_x, center_y, width, height}
        """
        x1, y1, x2, y2 = bbox['x1'], bbox['y1'], bbox['x2'], bbox['y2']
        
        # Calculate center point
        center_x = (x1 + x2) / 2
        center_y = (y1 + y2) / 2
        
        # Calculate width and height
        width = x2 - x1
        height = y2 - y1
        
        # Normalize by image dimensions
        norm_center_x = center_x / img_width
        norm_center_y = center_y / img_height
        norm_width = width / img_width
        norm_height = height / img_height
        
        # Clamp to [0, 1]
        norm_center_x = max(0.0, min(1.0, norm_center_x))
        norm_center_y = max(0.0, min(1.0, norm_center_y))
        norm_width = max(0.0, min(1.0, norm_width))
        norm_height = max(0.0, min(1.0, norm_height))
        
        return {
            'center_x': norm_center_x,
            'center_y': norm_center_y,
            'width': norm_width,
            'height': norm_height
        }
    
    def save_detection_result(self, image_path, detection_result, split='train', image_id=None):
        """
        Save detection result as training data
        
        Args:
            image_path: Path to image
            detection_result: Detection result from yolo_detector.py
            split: train/val/test
            image_id: Custom image ID
            
        Returns:
            dict: Save result
        """
        try:
            if not detection_result.get('success'):
                raise ValueError("Detection result is not successful")
            
            detections = detection_result.get('detections', [])
            if not detections:
                raise ValueError("No detections found in result")
            
            img_width = detection_result['image_info']['width']
            img_height = detection_result['image_info']['height']
            
            # Convert detections to YOLO label format
            labels = []
            for det in detections:
                yolo_bbox = self.convert_bbox_to_yolo(det['bbox'], img_width, img_height)
                labels.append({
                    'class_id': det['class_id'],
                    'center_x': yolo_bbox['center_x'],
                    'center_y': yolo_bbox['center_y'],
                    'width': yolo_bbox['width'],
                    'height': yolo_bbox['height']
                })
            
            # Save image and labels
            return self.save_image_with_labels(image_path, labels, split, image_id)
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'error_type': type(e).__name__
            }
    
    def split_dataset(self, val_ratio=0.2):
        """
        Split training images into train/val if val is empty
        
        Args:
            val_ratio: Fraction of training images to move to validation (default 0.2 = 20%)
            
        Returns:
            dict: Result with split statistics
        """
        try:
            train_img_dir = self.images_dir / 'train'
            val_img_dir = self.images_dir / 'val'
            train_label_dir = self.labels_dir / 'train'
            val_label_dir = self.labels_dir / 'val'
            
            # Get all training images
            train_images = sorted(list(train_img_dir.glob('*.jpg')) + list(train_img_dir.glob('*.png')))
            
            if len(train_images) == 0:
                return {
                    'success': False,
                    'error': 'No training images found to split'
                }
            
            # Check if validation already has images
            val_images = list(val_img_dir.glob('*.jpg')) + list(val_img_dir.glob('*.png'))
            if len(val_images) > 0:
                return {
                    'success': True,
                    'message': 'Validation set already populated, no split needed',
                    'train_images': len(train_images),
                    'val_images': len(val_images)
                }
            
            # Calculate split point
            split_idx = max(1, int(len(train_images) * (1 - val_ratio)))
            
            # Move images and labels to validation
            moved = 0
            for img_path in train_images[split_idx:]:
                # Move image
                val_img_path = val_img_dir / img_path.name
                shutil.move(str(img_path), str(val_img_path))
                
                # Move corresponding label if exists
                label_name = img_path.stem + '.txt'
                label_path = train_label_dir / label_name
                if label_path.exists():
                    val_label_path = val_label_dir / label_name
                    shutil.move(str(label_path), str(val_label_path))
                
                moved += 1
            
            # Get updated stats
            train_count = len(list(train_img_dir.glob('*.jpg'))) + len(list(train_img_dir.glob('*.png')))
            val_count = len(list(val_img_dir.glob('*.jpg'))) + len(list(val_img_dir.glob('*.png')))
            
            return {
                'success': True,
                'message': f'Moved {moved} images to validation set',
                'train_images': train_count,
                'val_images': val_count,
                'split_ratio': val_ratio
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'error_type': type(e).__name__
            }
    
    def get_dataset_stats(self):
        """
        Get statistics about current dataset
        
        Returns:
            dict: Dataset statistics
        """
        stats = {
            'train': {'images': 0, 'labels': 0},
            'val': {'images': 0, 'labels': 0},
            'test': {'images': 0, 'labels': 0}
        }
        
        for split in ['train', 'val', 'test']:
            img_dir = self.images_dir / split
            label_dir = self.labels_dir / split
            
            if img_dir.exists():
                stats[split]['images'] = len(list(img_dir.glob('*.jpg'))) + len(list(img_dir.glob('*.png')))
            
            if label_dir.exists():
                stats[split]['labels'] = len(list(label_dir.glob('*.txt')))
        
        stats['total_images'] = sum(s['images'] for s in stats.values() if isinstance(s, dict))
        stats['total_labels'] = sum(s['labels'] for s in stats.values() if isinstance(s, dict))
        
        return stats
    
    def create_data_yaml(self, class_names, output_path=None):
        """
        Create data.yaml file for YOLO training
        
        Args:
            class_names: List of class names in order ['class0', 'class1', ...]
            output_path: Path to save data.yaml (default: dataset_root/data.yaml)
            
        Returns:
            str: Path to created data.yaml
        """
        if output_path is None:
            output_path = self.dataset_root / "data.yaml"
        
        # Create YAML content
        yaml_content = f"""# YOLO Dataset Configuration
# Auto-generated by YOLODatasetManager

path: {self.dataset_root.absolute()}  # dataset root dir
train: images/train  # train images (relative to path)
val: images/val  # val images (relative to path)
test: images/test  # test images (relative to path)

# Classes
nc: {len(class_names)}  # number of classes
names: {class_names}  # class names
"""
        
        with open(output_path, 'w') as f:
            f.write(yaml_content)
        
        return str(output_path)


def main():
    """Main entry point for CLI usage"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python dataset_manager.py <command> [args...]\n'
                    'Commands:\n'
                    '  save_image <image_path> <labels_json> <split> [image_id]\n'
                    '  save_detection <image_path> <detection_json> <split> [image_id]\n'
                    '  split_dataset [val_ratio]\n'
                    '  stats\n'
                    '  create_yaml <class_names_json> [output_path]'
        }))
        sys.exit(1)
    
    command = sys.argv[1]
    manager = YOLODatasetManager()
    
    try:
        if command == 'save_image':
            image_path = sys.argv[2]
            labels = json.loads(sys.argv[3])
            split = sys.argv[4]
            image_id = sys.argv[5] if len(sys.argv) > 5 else None
            
            result = manager.save_image_with_labels(image_path, labels, split, image_id)
            print(json.dumps(result, indent=2))
            
        elif command == 'save_detection':
            image_path = sys.argv[2]
            detection_result = json.loads(sys.argv[3])
            split = sys.argv[4]
            image_id = sys.argv[5] if len(sys.argv) > 5 else None
            
            result = manager.save_detection_result(image_path, detection_result, split, image_id)
            print(json.dumps(result, indent=2))
            
        elif command == 'split_dataset':
            val_ratio = float(sys.argv[2]) if len(sys.argv) > 2 else 0.2
            result = manager.split_dataset(val_ratio)
            print(json.dumps(result, indent=2))
            
        elif command == 'stats':
            stats = manager.get_dataset_stats()
            print(json.dumps(stats, indent=2))
            
        elif command == 'create_yaml':
            class_names = json.loads(sys.argv[2])
            output_path = sys.argv[3] if len(sys.argv) > 3 else None
            
            yaml_path = manager.create_data_yaml(class_names, output_path)
            print(json.dumps({
                'success': True,
                'yaml_path': yaml_path
            }, indent=2))
            
        else:
            print(json.dumps({
                'success': False,
                'error': f'Unknown command: {command}'
            }))
            sys.exit(1)
            
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()

