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
    print_step(2, "DOWNLOADING DATASET")
    print(f"📥 Downloading from: {url}")
    
    try:
        import urllib.request
        urllib.request.urlretrieve(url, dest_path)
        file_size = os.path.getsize(dest_path) / (1024**2)
        print(f"✅ Download completed! ({file_size:.2f} MB)")
        return True
    except Exception as e:
        print(f"❌ Download failed: {e}")
        return False


def extract_dataset(zip_path="/content/data.zip", extract_path="/content/custom_data"):
    """Extract dataset"""
    print_step(3, "EXTRACTING DATASET")
    print(f"📂 Extracting to {extract_path}...")
    
    try:
        os.makedirs(extract_path, exist_ok=True)
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
        print("✅ Extraction completed!")
        return True
    except Exception as e:
        print(f"❌ Extraction failed: {e}")
        return False


def split_data(data_path="/content/custom_data", train_pct=0.9):
    """Split data into train/validation"""
    print_step(4, "SPLITTING DATA INTO TRAIN/VALIDATION")
    
    try:
        print("📥 Downloading train_val_split.py script...")
        import urllib.request
        script_url = 'https://raw.githubusercontent.com/EdjeElectronics/Train-and-Deploy-YOLO-Models/refs/heads/main/utils/train_val_split.py'
        urllib.request.urlretrieve(script_url, '/content/train_val_split.py')
        
        print(f"🔄 Splitting dataset ({int(train_pct*100)}% train / {int((1-train_pct)*100)}% validation)...")
        result = subprocess.run(
            [sys.executable, '/content/train_val_split.py',
             f'--datapath={data_path}',
             f'--train_pct={train_pct}'],
            timeout=120
        )
        
        if result.returncode == 0:
            print("✅ Data split completed!")
            return True
        else:
            print(f"⚠️  Data split completed with return code: {result.returncode}")
            return True
    except Exception as e:
        print(f"❌ Data split failed: {e}")
        return False


def install_libraries():
    """Install required libraries"""
    print_step(5, "INSTALLING REQUIRED LIBRARIES")
    print("📦 Installing ultralytics...")
    
    try:
        result = subprocess.run(
            [sys.executable, '-m', 'pip', 'install', 'ultralytics', '-q'],
            timeout=300
        )
        if result.returncode == 0:
            print("✅ Installation completed!")
            return True
        else:
            print(f"⚠️  Installation completed with return code: {result.returncode}")
            return True
    except Exception as e:
        print(f"❌ Installation failed: {e}")
        return False


def create_data_yaml(classes_txt_path="/content/custom_data/classes.txt", 
                     yaml_output="/content/data.yaml",
                     base_path="/content/custom_data"):
    """Create data.yaml configuration"""
    print_step(6, "CREATING DATA.YAML CONFIGURATION")
    
    try:
        if not os.path.exists(classes_txt_path):
            print(f"❌ classes.txt not found at {classes_txt_path}")
            return False
        
        with open(classes_txt_path, 'r') as f:
            classes = [line.strip() for line in f.readlines() if line.strip()]
        
        if not classes:
            print("❌ No classes found in classes.txt")
            return False
        
        print(f"✅ Found {len(classes)} classes: {', '.join(classes)}")
        
        data = {
            'path': base_path,
            'train': 'train/images',
            'val': 'validation/images',
            'nc': len(classes),
            'names': classes
        }
        
        with open(yaml_output, 'w') as f:
            yaml.dump(data, f, sort_keys=False)
        
        print(f"\n✅ Created data.yaml:")
        with open(yaml_output, 'r') as f:
            print(f.read())
        
        return True
    except Exception as e:
        print(f"❌ Failed to create data.yaml: {e}")
        return False


def verify_data_paths(yaml_path="/content/data.yaml"):
    """Verify data paths exist and have images"""
    print("\n🔍 Verifying data paths...")
    
    try:
        with open(yaml_path, 'r') as f:
            yaml_data = yaml.safe_load(f)
        
        base_path = yaml_data.get('path', '/content/custom_data')
        train_path = os.path.join(base_path, yaml_data.get('train', 'train/images'))
        val_path = os.path.join(base_path, yaml_data.get('val', 'validation/images'))
        
        print(f"Base path: {base_path} - {'✅' if os.path.exists(base_path) else '❌'}")
        print(f"Train path: {train_path} - {'✅' if os.path.exists(train_path) else '❌'}")
        print(f"Val path: {val_path} - {'✅' if os.path.exists(val_path) else '❌'}")
        
        if os.path.exists(train_path):
            train_count = len(os.listdir(train_path))
            print(f"   Train images: {train_count}")
            if train_count == 0:
                print("   ⚠️  No training images found!")
                return False
        
        if os.path.exists(val_path):
            val_count = len(os.listdir(val_path))
            print(f"   Val images: {val_count}")
        
        return True
    except Exception as e:
        print(f"❌ Path verification failed: {e}")
        return False


def train_model(yaml_path="/content/data.yaml", epochs=60, imgsz=640):
    """Train YOLO model"""
    print_step(7, "TRAINING YOLO MODEL")
    print(f"🚀 Starting YOLO11s training ({epochs} epochs, {imgsz}x{imgsz})...")
    print("⏱️  This may take 30min - several hours depending on GPU and dataset size\n")
    print("📋 Training output:\n")
    
    try:
        from ultralytics import YOLO
        print("✅ Ultralytics YOLO module loaded\n")
        
        # Verify data.yaml
        if not os.path.exists(yaml_path):
            print(f"❌ data.yaml not found at {yaml_path}")
            return False
        
        # Verify data paths
        if not verify_data_paths(yaml_path):
            print("❌ Data path verification failed")
            return False
        
        # Load model
        print("\n🚀 Loading model...")
        try:
            model = YOLO('yolo11s.pt')
            print("✅ YOLO model loaded successfully")
        except Exception as e:
            print(f"❌ Failed to load YOLO model: {e}")
            return False
        
        # Train model
        print("🔄 Starting training process...\n")
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
            print("\n✅ Training completed successfully!\n")
            return True
            
        except Exception as train_error:
            print(f"\n❌ Training error occurred:")
            print(f"Error type: {type(train_error).__name__}")
            print(f"Error message: {str(train_error)}")
            print(f"\nFull traceback:")
            import traceback
            traceback.print_exc()
            return False
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Please install ultralytics: pip install ultralytics")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
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
    print_step(8, "DOWNLOADING TRAINED MODEL")
    
    try:
        model_source = find_model()
        
        if not model_source:
            print("❌ Trained model not found!")
            if os.path.exists('/content/runs'):
                print("📁 Contents of /content/runs:")
                for root, dirs, files in os.walk('/content/runs'):
                    level = root.replace('/content/runs', '').count(os.sep)
                    indent = '   ' * level
                    print(f"{indent}📁 {os.path.basename(root)}/")
                    for file in files:
                        size = os.path.getsize(os.path.join(root, file)) / (1024*1024)
                        print(f"{indent}   📄 {file} ({size:.2f} MB)")
            return False
        
        file_size_mb = os.path.getsize(model_source) / (1024 * 1024)
        print(f"✅ Model found at: {model_source}")
        print(f"   Size: {file_size_mb:.2f} MB")
        
        model_destination = '/content/best_model.pt'
        shutil.copy2(model_source, model_destination)
        print(f"\n✅ Model copied to: {model_destination}")
        print(f"\n📥 Download link: /content/best_model.pt")
        print(f"📁 Results location: {os.path.dirname(model_source)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main(dataset_url, epochs=60, imgsz=640, train_pct=0.9):
    """Main pipeline"""
    print("\n" + "="*70)
    print("🚀 YOLO MODEL TRAINING PIPELINE")
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
    print("✅ COMPLETE PIPELINE FINISHED SUCCESSFULLY!")
    print("="*70)
    return True


def create_ui():
    """Create interactive UI for Jupyter/Colab notebook"""
    print("\n" + "="*70)
    print("🚀 YOLO Model Training - Google Colab")
    print("="*70 + "\n")
    
    try:
        dataset_url = input("📥 Dataset URL (ZIP file): ").strip()
        
        if not dataset_url:
            print("❌ Error: Please enter a dataset URL")
            return False
        
        if not dataset_url.startswith(('http://', 'https://')):
            print("❌ Error: URL must start with http:// or https://")
            return False
        
        try:
            epochs = int(input("⏱️  Epochs (default 60): ") or "60")
            train_pct = float(input("📊 Train % (default 0.9): ") or "0.9")
        except ValueError:
            print("❌ Error: Invalid number format")
            return False
        
        print("\n✅ Configuration:")
        print(f"   Dataset: {dataset_url}")
        print(f"   Epochs: {epochs}")
        print(f"   Train/Val split: {int(train_pct*100)}/{int((1-train_pct)*100)}\n")
        
        confirm = input("🚀 Ready to start training? (yes/no): ").strip().lower()
        if confirm != 'yes':
            print("❌ Training cancelled")
            return False
        
        print("\n" + "="*70)
        print("🔄 STARTING TRAINING PIPELINE")
        print("="*70 + "\n")
        
        success = main(dataset_url, epochs=epochs, train_pct=train_pct)
        return success
        
    except KeyboardInterrupt:
        print("\n❌ Training cancelled by user")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
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
