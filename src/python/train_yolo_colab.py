#!/usr/bin/env python3
"""
YOLO Model Training Script for Google Colab
This script downloads dataset, prepares it, and trains a YOLO model.
Run this in Google Colab after installing ultralytics:
  !pip install ultralytics
  !python -c "import urllib.request; urllib.request.urlretrieve('https://raw.githubusercontent.com/anhnnhe176642/GFWMS_backend/AnhNN/src/python/train_yolo_colab.py', 'train_yolo.py')"
  !python train_yolo.py
"""

import os
import sys
import subprocess
import zipfile
import shutil
import yaml
from pathlib import Path


def print_step(step_num, title):
    """Print step header"""
    print("\n" + "="*70)
    print(f"STEP {step_num}: {title}")
    print("="*70)


def download_dataset(url, dest_path="/content/data.zip"):
    """Download dataset from URL"""
    print_step(2, "TAI DATASET")
    print(f"Dang tai tu: {url}")
    
    try:
        import urllib.request
        urllib.request.urlretrieve(url, dest_path)
        file_size = os.path.getsize(dest_path) / (1024**2)
        print(f"Tai xong! ({file_size:.2f} MB)")
        return True
    except Exception as e:
        print(f"Loi tai: {e}")
        return False


def extract_dataset(zip_path="/content/data.zip", extract_path="/content/custom_data"):
    """Extract dataset"""
    print_step(3, "GIAI NEN DATASET")
    print(f"Dang giai nen toi {extract_path}...")
    
    try:
        os.makedirs(extract_path, exist_ok=True)
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
        print("Giai nen xong!")
        return True
    except Exception as e:
        print(f"Loi giai nen: {e}")
        return False


def split_data(data_path="/content/custom_data", train_pct=0.9):
    """Split data into train/validation"""
    print_step(4, "CHIA DU LIEU TRAIN/VALIDATION")
    
    try:
        # Find images directory (could be 'images' or nested in subdirectories)
        images_path = None
        labels_path = None
        
        print("Dang tim thu muc images va labels...")
        for root, dirs, files in os.walk(data_path):
            if 'images' in dirs:
                images_path = os.path.join(root, 'images')
                print(f"   Tim thay images: {images_path}")
            if 'labels' in dirs:
                labels_path = os.path.join(root, 'labels')
                print(f"   Tim thay labels: {labels_path}")
        
        if not images_path or not labels_path:
            print(f"Su dung thu muc goc (images/labels khong tim thay trong subdirs)")
            images_path = os.path.join(data_path, 'images')
            labels_path = os.path.join(data_path, 'labels')
        
        # Create train/validation directories
        os.makedirs(os.path.join(data_path, 'train', 'images'), exist_ok=True)
        os.makedirs(os.path.join(data_path, 'train', 'labels'), exist_ok=True)
        os.makedirs(os.path.join(data_path, 'validation', 'images'), exist_ok=True)
        os.makedirs(os.path.join(data_path, 'validation', 'labels'), exist_ok=True)
        
        # Get all images
        if os.path.exists(images_path):
            image_files = [f for f in os.listdir(images_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            print(f"Tim thay {len(image_files)} anh")
            
            # Split files
            import random
            random.seed(42)
            random.shuffle(image_files)
            split_idx = int(len(image_files) * train_pct)
            train_files = image_files[:split_idx]
            val_files = image_files[split_idx:]
            
            print(f"Chia tach: {len(train_files)} train, {len(val_files)} validation")
            
            # Copy training images and labels
            for img_file in train_files:
                src_img = os.path.join(images_path, img_file)
                dst_img = os.path.join(data_path, 'train', 'images', img_file)
                shutil.copy2(src_img, dst_img)
                
                # Copy corresponding label if exists
                label_file = os.path.splitext(img_file)[0] + '.txt'
                if os.path.exists(os.path.join(labels_path, label_file)):
                    src_label = os.path.join(labels_path, label_file)
                    dst_label = os.path.join(data_path, 'train', 'labels', label_file)
                    shutil.copy2(src_label, dst_label)
            
            # Copy validation images and labels
            for img_file in val_files:
                src_img = os.path.join(images_path, img_file)
                dst_img = os.path.join(data_path, 'validation', 'images', img_file)
                shutil.copy2(src_img, dst_img)
                
                # Copy corresponding label if exists
                label_file = os.path.splitext(img_file)[0] + '.txt'
                if os.path.exists(os.path.join(labels_path, label_file)):
                    src_label = os.path.join(labels_path, label_file)
                    dst_label = os.path.join(data_path, 'validation', 'labels', label_file)
                    shutil.copy2(src_label, dst_label)
            
            print("Chia tach du lieu xong!")
            return True
        else:
            print(f"Loi: Anh khong tim thay tai {images_path}")
            return False
            
    except Exception as e:
        print(f"Loi chia tach du lieu: {e}")
        import traceback
        traceback.print_exc()
        return False


def install_libraries():
    """Install required libraries"""
    print_step(5, "CAI DAT THU VIEN")
    print("Dang cai dat ultralytics...")
    
    try:
        result = subprocess.run(
            [sys.executable, '-m', 'pip', 'install', 'ultralytics', '-q'],
            timeout=300
        )
        if result.returncode == 0:
            print("Cai dat xong!")
            return True
        else:
            print(f"Canh bao: Cai dat xong voi return code: {result.returncode}")
            return True
    except Exception as e:
        print(f"Loi cai dat: {e}")
        return False


def create_data_yaml(classes_txt_path="/content/custom_data/classes.txt", 
                     yaml_output="/content/data.yaml",
                     base_path="/content/custom_data"):
    """Create data.yaml configuration"""
    print_step(6, "TAO FILE DATA.YAML")
    
    try:
        if not os.path.exists(classes_txt_path):
            print(f"Loi: Khong tim thay classes.txt tai {classes_txt_path}")
            return False
        
        with open(classes_txt_path, 'r') as f:
            classes = [line.strip() for line in f.readlines() if line.strip()]
        
        if not classes:
            print("Loi: Khong co class nao trong classes.txt")
            return False
        
        print(f"Tim thay {len(classes)} classes: {', '.join(classes)}")
        
        data = {
            'path': base_path,
            'train': 'train/images',
            'val': 'validation/images',
            'nc': len(classes),
            'names': classes
        }
        
        with open(yaml_output, 'w') as f:
            yaml.dump(data, f, sort_keys=False)
        
        print(f"\nTao file data.yaml:")
        with open(yaml_output, 'r') as f:
            print(f.read())
        
        return True
    except Exception as e:
        print(f"Loi: Khong the tao data.yaml: {e}")
        return False


def verify_data_paths(yaml_path="/content/data.yaml"):
    """Verify data paths exist and have images"""
    print("\nKiem tra duong dan du lieu...")
    
    try:
        with open(yaml_path, 'r') as f:
            yaml_data = yaml.safe_load(f)
        
        base_path = yaml_data.get('path', '/content/custom_data')
        train_path = os.path.join(base_path, yaml_data.get('train', 'train/images'))
        val_path = os.path.join(base_path, yaml_data.get('val', 'validation/images'))
        
        print(f"\nCau truc thu muc:")
        print(f"   Base: {base_path}")
        print(f"   Train: {train_path}")
        print(f"   Val: {val_path}")
        
        # Check base path
        if not os.path.exists(base_path):
            print(f"\nLoi: Duong dan base khong ton tai: {base_path}")
            return False
        
        # List all files in base path
        print(f"\nNoi dung cua {base_path}:")
        for item in os.listdir(base_path):
            item_path = os.path.join(base_path, item)
            if os.path.isdir(item_path):
                file_count = len(os.listdir(item_path)) if os.path.isdir(item_path) else 0
                print(f"   {item}/ ({file_count} items)")
                # List subdirectories
                for subitem in os.listdir(item_path):
                    subitem_path = os.path.join(item_path, subitem)
                    if os.path.isdir(subitem_path):
                        sub_file_count = len(os.listdir(subitem_path))
                        print(f"      {subitem}/ ({sub_file_count} files)")
            else:
                print(f"   {item}")
        
        # Verify paths exist
        train_exists = os.path.exists(train_path)
        val_exists = os.path.exists(val_path)
        
        print(f"\nTrang thai:")
        print(f"   Duong dan train ton tai: {'Co' if train_exists else 'Khong'}")
        print(f"   Duong dan val ton tai: {'Co' if val_exists else 'Khong'}")
        
        if train_exists:
            train_count = len(os.listdir(train_path))
            print(f"   So anh train: {train_count}")
            if train_count == 0:
                print("   Canh bao: Khong co anh training!")
                return False
        
        if val_exists:
            val_count = len(os.listdir(val_path))
            print(f"   So anh val: {val_count}")
        
        if not (train_exists and val_exists):
            return False
        
        return True
    except Exception as e:
        print(f"Loi: Kiem tra duong dan that bai: {e}")
        import traceback
        traceback.print_exc()
        return False


def train_model(yaml_path="/content/data.yaml", epochs=60, imgsz=640):
    """Train YOLO model"""
    print_step(7, "TRAINING YOLO MODEL")
    print(f"Bat dau training YOLO11s ({epochs} epochs, {imgsz}x{imgsz})...")
    print("Dieu le: Dieu nay co the mat 30min - nhieu gio tuy vao GPU va kich thuoc dataset\n")
    print("Output training:\n")
    
    try:
        from ultralytics import YOLO
        print("Module YOLO loaded\n")
        
        # Verify data.yaml
        if not os.path.exists(yaml_path):
            print(f"Loi: Khong tim thay data.yaml tai {yaml_path}")
            return False
        
        # Verify data paths
        if not verify_data_paths(yaml_path):
            print("Loi: Kiem tra duong dan du lieu that bai")
            return False
        
        # Load model
        print("\nDang load model...")
        try:
            model = YOLO('yolo11s.pt')
            print("Model YOLO loaded")
        except Exception as e:
            print(f"Loi: Khong the load model: {e}")
            return False
        
        # Train model
        print("Bat dau qua trinh training...\n")
        try:
            results = model.train(
                data=yaml_path,
                epochs=epochs,
                imgsz=imgsz,
                patience=20,
                device=0,
                verbose=True,
                exist_ok=True
            )
            print("\nTraining xong!\n")
            return True
            
        except Exception as train_error:
            print(f"\nLoi training:")
            print(f"Kieu loi: {type(train_error).__name__}")
            print(f"Chi tiet: {str(train_error)}")
            print(f"\nFull traceback:")
            import traceback
            traceback.print_exc()
            return False
        
    except ImportError as e:
        print(f"Loi import: {e}")
        print("Vui long cai dat ultralytics: pip install ultralytics")
        return False
    except Exception as e:
        print(f"Loi: {e}")
        import traceback
        traceback.print_exc()
        return False


def find_model():
    """Find best.pt model"""
    possible_paths = [
        '/content/runs/detect/train/weights/best.pt',
        '/content/runs/detect/train1/weights/best.pt',
        '/content/runs/detect/train2/weights/best.pt',
        '/content/runs/train/weights/best.pt',
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    # Search recursively
    if os.path.exists('/content/runs'):
        for root, dirs, files in os.walk('/content/runs'):
            if 'best.pt' in files:
                return os.path.join(root, 'best.pt')
    
    return None


def download_model():
    """Prepare model for download"""
    print_step(8, "TAI MODEL DA TRAINING")
    
    try:
        model_source = find_model()
        
        if not model_source:
            print("Loi: Khong tim thay model da training!")
            if os.path.exists('/content/runs'):
                print("Noi dung /content/runs:")
                for root, dirs, files in os.walk('/content/runs'):
                    level = root.replace('/content/runs', '').count(os.sep)
                    indent = '   ' * level
                    print(f"{indent}{os.path.basename(root)}/")
                    for file in files:
                        size = os.path.getsize(os.path.join(root, file)) / (1024*1024)
                        print(f"{indent}   {file} ({size:.2f} MB)")
            return False
        
        file_size_mb = os.path.getsize(model_source) / (1024 * 1024)
        print(f"Tim thay model: {model_source}")
        print(f"   Dung luong: {file_size_mb:.2f} MB")
        
        model_destination = '/content/best_model.pt'
        shutil.copy2(model_source, model_destination)
        print(f"\nModel da sao chep toi: {model_destination}")
        print(f"\nDuong dan sao tai: /content/best_model.pt")
        print(f"Duong dan ket qua: {os.path.dirname(model_source)}")
        
        return True
        
    except Exception as e:
        print(f"Loi: {e}")
        return False


def main(dataset_url, epochs=60, imgsz=640, train_pct=0.9):
    """Main pipeline"""
    print("\n" + "="*70)
    print("QUA TRINH TRAINING YOLO MODEL")
    print("="*70)
    
    # Setup
    os.makedirs('/content', exist_ok=True)
    os.makedirs('/content/custom_data', exist_ok=True)
    
    # Step 2: Download
    if not download_dataset(dataset_url):
        return False
    
    # Step 3: Extract
    if not extract_dataset():
        return False
    
    # Step 4: Split
    if not split_data(train_pct=train_pct):
        return False
    
    # Step 5: Install
    if not install_libraries():
        return False
    
    # Step 6: Create config
    if not create_data_yaml():
        return False
    
    # Step 7: Train
    if not train_model(epochs=epochs, imgsz=imgsz):
        return False
    
    # Step 8: Download
    if not download_model():
        return False
    
    print("\n" + "="*70)
    print("QUA TRINH TRAINING HOAN TAT!")
    print("="*70)
    return True


def create_ui():
    """Create interactive UI for Jupyter/Colab notebook"""
    print("\n" + "="*70)
    print("YOLO Model Training - Google Colab")
    print("="*70 + "\n")
    
    try:
        dataset_url = input("Nhap URL dataset (ZIP file): ").strip()
        
        if not dataset_url:
            print("Loi: Vui long nhap URL dataset")
            return False
        
        if not dataset_url.startswith(('http://', 'https://')):
            print("Loi: URL phai bat dau bang http:// hoac https://")
            return False
        
        print("\n" + "="*70)
        print("Bat dau qua trinh training...")
        print("="*70 + "\n")
        
        success = main(dataset_url, epochs=60, train_pct=0.9)
        return success
        
    except KeyboardInterrupt:
        print("\nTraining da huy")
        return False
    except Exception as e:
        print(f"Loi: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='YOLO Training Pipeline for Google Colab')
    parser.add_argument('--url', default=None, help='Dataset download URL')
    parser.add_argument('--epochs', type=int, default=60, help='Number of training epochs (default: 60)')
    parser.add_argument('--imgsz', type=int, default=640, help='Image size (default: 640)')
    parser.add_argument('--train-pct', type=float, default=0.9, help='Training percentage (default: 0.9)')
    parser.add_argument('--ui', action='store_true', help='Launch interactive UI mode')
    
    args = parser.parse_args()
    
    # UI mode
    if args.ui or (not args.url and '--url' not in sys.argv):
        create_ui()
    else:
        # CLI mode
        if not args.url:
            parser.print_help()
            sys.exit(1)
        
        success = main(
            dataset_url=args.url,
            epochs=args.epochs,
            imgsz=args.imgsz,
            train_pct=args.train_pct
        )
        
        sys.exit(0 if success else 1)
