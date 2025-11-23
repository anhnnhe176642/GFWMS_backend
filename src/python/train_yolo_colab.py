#!/usr/bin/env python3
"""
YOLO Model Training Script for Google Colab
This script downloads dataset, prepares it, trains a YOLO model, and uploads it to the backend server.
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
import json
import requests
from pathlib import Path


def print_header(text):
    """Print beautiful header"""
    print("\n" + "="*70)
    print(text.center(70))
    print("="*70)


def print_step(step_num, title):
    """Print step header"""
    print("\n" + "─"*70)
    print(f"  STEP {step_num}: {title}")
    print("─"*70)


def print_success(text):
    """Print success message"""
    print(f"  ✓ {text}")


def print_error(text):
    """Print error message"""
    print(f"  ✗ {text}")


def print_warning(text):
    """Print warning message"""
    print(f"  ⚠ {text}")


def print_info(text):
    """Print info message"""
    print(f"  ℹ {text}")


def check_gpu():
    """Check if GPU is available"""
    try:
        import torch
        if torch.cuda.is_available():
            device_count = torch.cuda.device_count()
            device_name = torch.cuda.get_device_name(0)
            print_success(f"GPU detected: {device_name} (Count: {device_count})")
            return True
        else:
            print_error("No GPU detected!")
            print("\n" + "!"*70)
            print("  GPU REQUIRED - Please enable GPU in Colab:")
            print("  1. Click 'Runtime' menu")
            print("  2. Select 'Change runtime type'")
            print("  3. Choose 'T4' or higher GPU")
            print("  4. Click 'Save'")
            print("  5. Re-run this cell")
            print("!"*70 + "\n")
            return False
    except Exception as e:
        print_error(f"Error checking GPU: {e}")
        return False


def download_dataset(url, dest_path="/content/data.zip"):
    """Download dataset from URL"""
    print_step(2, "TAI DATASET")
    print_info(f"Downloading from: {url}")
    
    try:
        import urllib.request
        urllib.request.urlretrieve(url, dest_path)
        file_size = os.path.getsize(dest_path) / (1024**2)
        print_success(f"Downloaded! ({file_size:.2f} MB)")
        return True, None
    except Exception as e:
        print_error(f"Download failed: {e}")
        return False, None


def extract_token_from_url(download_url):
    """Extract token from download URL"""
    try:
        # URL format: https://domain.com/api/v1/yolo/download/TOKEN
        # Extract token from the last segment after /download/
        if '/download/' in download_url:
            token = download_url.split('/download/')[-1]
            if token:
                return token
        return None
    except Exception:
        return None


def extract_api_url_from_download_url(download_url):
    """Extract API base URL from download URL"""
    try:
        # URL format: https://domain.com/api/v1/yolo/download/TOKEN
        # Extract: https://domain.com/api
        from urllib.parse import urlparse
        parsed = urlparse(download_url)
        
        # Reconstruct base URL: https://domain.com
        base_url = f"{parsed.scheme}://{parsed.netloc}"
        
        # API URL is base_url + /api
        api_url = f"{base_url}/api"
        return api_url
    except Exception:
        return None


def extract_dataset(zip_path="/content/data.zip", extract_path="/content/custom_data"):
    """Extract dataset"""
    print_step(3, "GIAI NEN DATASET")
    print_info(f"Extracting to {extract_path}...")
    
    try:
        os.makedirs(extract_path, exist_ok=True)
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
        print_success("Extracted successfully!")
        return True
    except Exception as e:
        print_error(f"Extraction failed: {e}")
        return False


def extract_dataset_name_from_notes(extract_path="/content/custom_data"):
    """Extract dataset name from notes.json"""
    try:
        notes_path = os.path.join(extract_path, 'notes.json')
        
        if not os.path.exists(notes_path):
            print_warning("notes.json not found")
            return None
        
        with open(notes_path, 'r', encoding='utf-8') as f:
            notes_data = json.load(f)
        
        dataset_name = notes_data.get('dataset', {}).get('name')
        if dataset_name:
            return dataset_name
        
        return None
    except Exception as e:
        print_warning(f"Error reading notes.json: {e}")
        return None


def split_data(data_path="/content/custom_data", train_pct=0.9):
    """Split data into train/validation"""
    print_step(4, "CHIA DU LIEU TRAIN/VALIDATION")
    
    try:
        # Remove old train/validation folders if they exist
        old_train = os.path.join(data_path, 'train')
        old_val = os.path.join(data_path, 'validation')
        if os.path.exists(old_train):
            shutil.rmtree(old_train)
            print_info("Removed old train folder")
        if os.path.exists(old_val):
            shutil.rmtree(old_val)
            print_info("Removed old validation folder")
        
        # Find images directory (could be 'images' or nested in subdirectories)
        images_path = None
        labels_path = None
        
        print_info("Finding images and labels directories...")
        
        # First, find the root images/labels (not in train/validation subdirs)
        if os.path.exists(os.path.join(data_path, 'images')):
            images_path = os.path.join(data_path, 'images')
        if os.path.exists(os.path.join(data_path, 'labels')):
            labels_path = os.path.join(data_path, 'labels')
        
        # If not found in root, search subdirectories
        if not images_path or not labels_path:
            for root, dirs, files in os.walk(data_path):
                # Skip train/validation directories
                if 'train' in root or 'validation' in root:
                    continue
                if 'images' in dirs and not images_path:
                    images_path = os.path.join(root, 'images')
                if 'labels' in dirs and not labels_path:
                    labels_path = os.path.join(root, 'labels')
        
        if not images_path or not labels_path:
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
            print_success(f"Found {len(image_files)} images")
            
            # Split files
            import random
            random.seed(42)
            random.shuffle(image_files)
            split_idx = int(len(image_files) * train_pct)
            train_files = image_files[:split_idx]
            val_files = image_files[split_idx:]
            
            print_info(f"Splitting: {len(train_files)} train, {len(val_files)} validation")
            
            # Copy training images and labels
            for img_file in train_files:
                src_img = os.path.join(images_path, img_file)
                dst_img = os.path.join(data_path, 'train', 'images', img_file)
                shutil.copy2(src_img, dst_img)
                
                # Copy corresponding label if exists
                label_file = os.path.splitext(img_file)[0] + '.txt'
                src_label = os.path.join(labels_path, label_file)
                if os.path.exists(src_label):
                    dst_label = os.path.join(data_path, 'train', 'labels', label_file)
                    shutil.copy2(src_label, dst_label)
            
            # Copy validation images and labels
            for img_file in val_files:
                src_img = os.path.join(images_path, img_file)
                dst_img = os.path.join(data_path, 'validation', 'images', img_file)
                shutil.copy2(src_img, dst_img)
                
                # Copy corresponding label if exists
                label_file = os.path.splitext(img_file)[0] + '.txt'
                src_label = os.path.join(labels_path, label_file)
                if os.path.exists(src_label):
                    dst_label = os.path.join(data_path, 'validation', 'labels', label_file)
                    shutil.copy2(src_label, dst_label)
            
            print_success("Data split completed!")
            return True
        else:
            print_error(f"Images not found at {images_path}")
            return False
            
    except Exception as e:
        print_error(f"Data split failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def install_libraries():
    """Install required libraries"""
    print_step(5, "CAI DAT THU VIEN")
    print_info("Installing ultralytics...")
    
    try:
        result = subprocess.run(
            [sys.executable, '-m', 'pip', 'install', 'ultralytics', '-q'],
            timeout=300
        )
        if result.returncode == 0:
            print_success("Libraries installed!")
            return True
        else:
            print_warning(f"Installation completed with return code: {result.returncode}")
            return True
    except Exception as e:
        print_error(f"Installation failed: {e}")
        return False


def create_data_yaml(classes_txt_path="/content/custom_data/classes.txt", 
                     yaml_output="/content/data.yaml",
                     base_path="/content/custom_data"):
    """Create data.yaml configuration"""
    print_step(6, "TAO FILE DATA.YAML")
    
    try:
        if not os.path.exists(classes_txt_path):
            print_error(f"classes.txt not found at {classes_txt_path}")
            return False
        
        with open(classes_txt_path, 'r') as f:
            classes = [line.strip() for line in f.readlines() if line.strip()]
        
        if not classes:
            print_error("No classes found in classes.txt")
            return False
        
        print_success(f"Found {len(classes)} classes: {', '.join(classes)}")
        
        data = {
            'path': base_path,
            'train': 'train/images',
            'val': 'validation/images',
            'nc': len(classes),
            'names': classes
        }
        
        with open(yaml_output, 'w') as f:
            yaml.dump(data, f, sort_keys=False)
        
        print("\n  data.yaml content:")
        with open(yaml_output, 'r') as f:
            for line in f.read().split('\n'):
                if line:
                    print(f"    {line}")
        
        return True
    except Exception as e:
        print_error(f"Failed to create data.yaml: {e}")
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
    print_info(f"Starting YOLO11s training ({epochs} epochs, {imgsz}x{imgsz})...")
    print_warning("Note: Training may take 30min - several hours depending on GPU and dataset size\n")
    
    try:
        from ultralytics import YOLO
        print_success("YOLO module loaded\n")
        
        # Verify data.yaml
        if not os.path.exists(yaml_path):
            print_error(f"data.yaml not found at {yaml_path}")
            return False
        
        # Load model
        print_info("Loading model...")
        try:
            model = YOLO('yolo11s.pt')
            print_success("Model loaded successfully")
        except Exception as e:
            print_error(f"Failed to load model: {e}")
            return False
        
        # Train model
        print_info("Starting training process...\n")
        print("─"*70)
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
            print("─"*70)
            print_success("Training completed!\n")
            return True
            
        except ValueError as e:
            if "Invalid CUDA" in str(e) or "device" in str(e).lower():
                print_error("GPU not available!")
                print("\n" + "!"*70)
                print("  GPU REQUIRED - Please enable GPU in Colab:")
                print("  1. Click 'Runtime' menu")
                print("  2. Select 'Change runtime type'")
                print("  3. Choose 'T4' GPU or higher (A100 preferred)")
                print("  4. Click 'Save'")
                print("  5. Re-run this cell")
                print("!"*70 + "\n")
                return False
            else:
                print_error(f"Training error: {e}")
                import traceback
                traceback.print_exc()
                return False
        
        except Exception as train_error:
            print_error(f"Training failed:")
            print(f"  Error type: {type(train_error).__name__}")
            print(f"  Details: {str(train_error)}")
            import traceback
            traceback.print_exc()
            return False
        
    except ImportError as e:
        print_error(f"Import error: {e}")
        print_info("Please install ultralytics: pip install ultralytics")
        return False
    except Exception as e:
        print_error(f"Unexpected error: {e}")
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
            print_error("No trained model found!")
            if os.path.exists('/content/runs'):
                print("\n  Contents of /content/runs:")
                for root, dirs, files in os.walk('/content/runs'):
                    level = root.replace('/content/runs', '').count(os.sep)
                    indent = '    ' * level
                    print(f"{indent}{os.path.basename(root)}/")
                    for file in files:
                        size = os.path.getsize(os.path.join(root, file)) / (1024*1024)
                        print(f"{indent}  {file} ({size:.2f} MB)")
            return False
        
        file_size_mb = os.path.getsize(model_source) / (1024 * 1024)
        print_success(f"Model found: {model_source}")
        print_info(f"Size: {file_size_mb:.2f} MB")
        
        model_destination = '/content/best_model.pt'
        shutil.copy2(model_source, model_destination)
        print_success(f"Model copied to: {model_destination}")
        
        return True
        
    except Exception as e:
        print_error(f"Failed to download model: {e}")
        return False


def upload_model_to_server(api_url, token, model_path="/content/best_model.pt", 
                          model_name=None, description=None, version="1.0", accuracy=None):
    """Upload trained model to server using public token API"""
    print_step(9, "TAI MODEL LEN SERVER")
    
    try:
        if not os.path.exists(model_path):
            print_error(f"Model file not found: {model_path}")
            return False
        
        file_size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print_info(f"Model file: {model_path}")
        print_info(f"Size: {file_size_mb:.2f} MB")
        print_info(f"API URL: {api_url}")
        print_info(f"Token: {token[:20]}...")
        
        # Construct upload endpoint
        upload_url = f"{api_url}/yolo/models/upload-with-token/{token}"
        print_info(f"\nUploading to {upload_url}...")
        
        # Prepare files and data
        with open(model_path, 'rb') as f:
            files = {
                'model': (os.path.basename(model_path), f, 'application/octet-stream')
            }
            
            data = {}
            if model_name:
                data['name'] = model_name
            if description:
                data['description'] = description
            if version:
                data['version'] = version
            if accuracy:
                data['accuracy'] = accuracy
            
            # Upload
            response = requests.post(
                upload_url,
                files=files,
                data=data,
                timeout=600  # 10 minutes timeout for large files
            )
        
        # Check response
        if response.status_code == 201:
            print_success(f"Upload successful! (Status: {response.status_code})")
            try:
                json_response = response.json()
                if 'data' in json_response:
                    model_info = json_response['data']
                    print("\n  Model information:")
                    for key, value in model_info.items():
                        print(f"    {key}: {value}")
                else:
                    print(f"\n  Response: {json.dumps(json_response, indent=2, ensure_ascii=False)}")
            except:
                print(f"  Response: {response.text}")
            return True
        else:
            print_error(f"Upload failed! (Status: {response.status_code})")
            print(f"  Response: {response.text}")
            return False
        
    except requests.exceptions.Timeout:
        print_error("Timeout - Upload took too long")
        return False
    except requests.exceptions.ConnectionError:
        print_error("Failed to connect to server")
        print_info("Please check URL and internet connection")
        return False
    except Exception as e:
        print_error(f"Upload failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main(dataset_url, epochs=60, imgsz=640, train_pct=0.9, api_url=None, 
         model_name=None, description=None, accuracy=None):
    """Main pipeline"""
    print_header("YOLO MODEL TRAINING PIPELINE")
    
    # Setup
    os.makedirs('/content', exist_ok=True)
    os.makedirs('/content/custom_data', exist_ok=True)
    
    # Check GPU availability
    print_step(1, "CHECK GPU")
    if not check_gpu():
        return False
    
    # Extract token and API URL from dataset URL
    token = extract_token_from_url(dataset_url)
    if token:
        print_success("Token extracted from URL")
        print_info(f"Token: {token[:30]}...")
    else:
        print_warning("Could not extract token from URL")
        print_info("Model upload will be skipped")
    
    # Auto-extract API URL if not provided
    if not api_url:
        api_url = extract_api_url_from_download_url(dataset_url)
        if api_url:
            print_success("API URL extracted from download URL")
            print_info(f"API URL: {api_url}")
    
    # Step 2: Download
    if not download_dataset(dataset_url):
        return False
    
    # Step 3: Extract
    if not extract_dataset():
        return False
    
    # Step 4: Extract dataset name from notes.json if model_name not provided
    if not model_name:
        dataset_name = extract_dataset_name_from_notes()
        if dataset_name:
            model_name = f"{dataset_name}_trained_{get_timestamp()}"
            print_success("Model name extracted from notes.json")
            print_info(f"Model name: {model_name}")
    
    # Step 5: Split
    if not split_data(train_pct=train_pct):
        return False
    
    # Step 6: Install
    if not install_libraries():
        return False
    
    # Step 7: Create config
    if not create_data_yaml():
        return False
    
    # Step 8: Train
    if not train_model(epochs=epochs, imgsz=imgsz):
        return False
    
    # Step 9: Download
    if not download_model():
        return False
    
    # Step 10: Upload to server (optional)
    if api_url and token:
        if not upload_model_to_server(
            api_url=api_url,
            token=token,
            model_name=model_name,
            description=description,
            version="1.0",
            accuracy=accuracy
        ):
            print_warning("Model upload failed, but training was successful")
            print_info("You can upload the model manually later")
    else:
        if not token:
            print_info("Could not extract token from dataset URL")
            print_info("Required format: https://domain.com/api/v1/yolo/download/TOKEN")
        if not api_url:
            print_info("Could not extract API URL from dataset URL")
            print_info("To upload model, please provide --api-url argument")
    
    print_header("TRAINING PIPELINE COMPLETED!")
    return True


def get_timestamp():
    """Get current timestamp in format YYYYMMDD_HHMMSS"""
    from datetime import datetime
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def create_ui(epochs=60, imgsz=640, train_pct=0.9, model_name=None, description=None, accuracy=None):
    """Create interactive UI for Jupyter/Colab notebook"""
    print_header("YOLO Model Training - Google Colab")
    
    try:
        dataset_url = input("\n  Enter dataset download URL: ").strip()
        
        if not dataset_url:
            print_error("Dataset URL is required")
            return False
        
        if not dataset_url.startswith(('http://', 'https://')):
            print_error("URL must start with http:// or https://")
            return False
        
        print_header("Starting training process...")
        
        success = main(
            dataset_url=dataset_url, 
            epochs=epochs, 
            imgsz=imgsz,
            train_pct=train_pct,
            model_name=model_name,
            description=description,
            accuracy=accuracy
        )
        return success
        
    except KeyboardInterrupt:
        print_warning("Training cancelled")
        return False
    except Exception as e:
        print_error(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='YOLO Training Pipeline for Google Colab')
    parser.add_argument('--url', default=None, help='Dataset download URL (from /yolo/download/TOKEN)')
    parser.add_argument('--epochs', type=int, default=60, help='Number of training epochs (default: 60)')
    parser.add_argument('--imgsz', type=int, default=640, help='Image size (default: 640)')
    parser.add_argument('--train-pct', type=float, default=0.9, help='Training percentage (default: 0.9)')
    parser.add_argument('--api-url', default=None, help='API base URL for uploading model (e.g., http://localhost:3000/api)')
    parser.add_argument('--model-name', default=None, help='Model name for upload (optional, auto-generated if not provided)')
    parser.add_argument('--description', default=None, help='Model description (optional)')
    parser.add_argument('--accuracy', type=float, default=None, help='Model accuracy (0-100, optional)')
    parser.add_argument('--ui', action='store_true', help='Launch interactive UI mode')
    
    args = parser.parse_args()
    
    # UI mode - run interactive UI with optional arguments as defaults
    if args.ui:
        create_ui(
            epochs=args.epochs,
            imgsz=args.imgsz,
            train_pct=args.train_pct,
            model_name=args.model_name,
            description=args.description,
            accuracy=args.accuracy
        )
    # CLI mode - use provided --url and run with arguments
    elif args.url:
        success = main(
            dataset_url=args.url,
            epochs=args.epochs,
            imgsz=args.imgsz,
            train_pct=args.train_pct,
            api_url=args.api_url,
            model_name=args.model_name,
            description=args.description,
            accuracy=args.accuracy
        )
        sys.exit(0 if success else 1)
    else:
        # No arguments provided - show help
        parser.print_help()
        sys.exit(1)
