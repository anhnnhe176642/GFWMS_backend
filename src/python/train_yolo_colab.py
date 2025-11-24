#!/usr/bin/env python3
"""
YOLO Model Training - Complete Solution
- CLI mode: python train_yolo.py --url "DOWNLOAD_URL" --epochs 100
- Interactive GUI (Colab): python train_yolo.py --ui
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


# ============================================================================
# UI HELPER FUNCTIONS
# ============================================================================

# ANSI color codes
RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

# Global verbose flag
VERBOSE = False

def set_verbose(verbose):
    """Bật/tắt chế độ hiển thị chi tiết"""
    global VERBOSE
    VERBOSE = verbose

def print_header(text):
    print("\n" + "="*70)
    print(text.center(70))
    print("="*70)

def print_step(step_num, title):
    print("\n" + "─"*70)
    print(f"  STEP {step_num}: {title}")
    print("─"*70)

def print_success(text):
    print(f"  {GREEN}✓ {text}{RESET}")

def print_error(text):
    print(f"  {RED}✗ {text}{RESET}")

def print_warning(text):
    print(f"  {YELLOW}⚠ {text}{RESET}")

def print_info(text):
    if VERBOSE:
        print(f"  {BLUE}ℹ {text}{RESET}")

def print_verbose(text):
    """Chỉ hiển thị nếu VERBOSE bật"""
    if VERBOSE:
        print(f"  {text}")


# ============================================================================
# TRAINING CORE FUNCTIONS
# ============================================================================

def check_gpu():
    try:
        import torch
        if torch.cuda.is_available():
            device_count = torch.cuda.device_count()
            device_name = torch.cuda.get_device_name(0)
            print_success(f"GPU được phát hiện: {device_name} (Số lượng: {device_count})")
            return True
        else:
            print_error("Không phát hiện GPU!")
            print("\n" + "!"*70)
            print("  YÊU CẦU GPU - Vui lòng kích hoạt GPU trong Colab:")
            print("  1. Nhấp vào menu 'Runtime'")
            print("  2. Chọn 'Change runtime type'")
            print("  3. Chọn 'T4' hoặc GPU cao hơn")
            print("  4. Nhấp vào 'Save'")
            print("  5. Chạy lại ô này")
            print("!"*70 + "\n")
            return False
    except Exception as e:
        print_error(f"Lỗi kiểm tra GPU: {e}")
        return False


def extract_token_from_url(download_url):
    try:
        if '/download/' in download_url:
            token = download_url.split('/download/')[-1]
            if token:
                return token
        return None
    except Exception:
        return None


def extract_api_url_from_download_url(download_url):
    try:
        from urllib.parse import urlparse
        parsed = urlparse(download_url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
        api_url = f"{base_url}/api"
        return api_url
    except Exception:
        return None


def download_dataset(url, dest_path="/content/data.zip"):
    print_step(2, "TẢI XUỐNG DATASET")
    print_info(f"Đang tải từ: {url}")
    
    try:
        import urllib.request
        urllib.request.urlretrieve(url, dest_path)
        file_size = os.path.getsize(dest_path) / (1024**2)
        print_success(f"Tải xuống thành công! ({file_size:.2f} MB)")
        return True
    except Exception as e:
        print_error(f"Tải xuống thất bại: {e}")
        return False


def extract_dataset(zip_path="/content/data.zip", extract_path="/content/custom_data"):
    print_step(3, "GIẢI NÉN DATASET")
    print_info(f"Đang giải nén tới {extract_path}...")
    
    try:
        os.makedirs(extract_path, exist_ok=True)
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
        print_success("Giải nén thành công!")
        return True
    except Exception as e:
        print_error(f"Giải nén thất bại: {e}")
        return False


def extract_dataset_name_from_notes(extract_path="/content/custom_data"):
    try:
        notes_path = os.path.join(extract_path, 'notes.json')
        if not os.path.exists(notes_path):
            print_warning("Không tìm thấy notes.json")
            return None
        with open(notes_path, 'r', encoding='utf-8') as f:
            notes_data = json.load(f)
        dataset_name = notes_data.get('dataset', {}).get('name')
        if dataset_name:
            return dataset_name
        return None
    except Exception as e:
        print_warning(f"Lỗi đọc notes.json: {e}")
        return None


def split_data(data_path="/content/custom_data", train_pct=0.9):
    print_step(4, "CHIA DỮ LIỆU TRAIN/VALIDATION")
    
    try:
        old_train = os.path.join(data_path, 'train')
        old_val = os.path.join(data_path, 'validation')
        if os.path.exists(old_train):
            shutil.rmtree(old_train)
            print_info("Đã xóa thư mục train cũ")
        if os.path.exists(old_val):
            shutil.rmtree(old_val)
            print_info("Đã xóa thư mục validation cũ")
        
        images_path = None
        labels_path = None
        
        print_info("Đang tìm thư mục images và labels...")
        
        if os.path.exists(os.path.join(data_path, 'images')):
            images_path = os.path.join(data_path, 'images')
        if os.path.exists(os.path.join(data_path, 'labels')):
            labels_path = os.path.join(data_path, 'labels')
        
        if not images_path or not labels_path:
            for root, dirs, files in os.walk(data_path):
                if 'train' in root or 'validation' in root:
                    continue
                if 'images' in dirs and not images_path:
                    images_path = os.path.join(root, 'images')
                if 'labels' in dirs and not labels_path:
                    labels_path = os.path.join(root, 'labels')
        
        if not images_path or not labels_path:
            images_path = os.path.join(data_path, 'images')
            labels_path = os.path.join(data_path, 'labels')
        
        os.makedirs(os.path.join(data_path, 'train', 'images'), exist_ok=True)
        os.makedirs(os.path.join(data_path, 'train', 'labels'), exist_ok=True)
        os.makedirs(os.path.join(data_path, 'validation', 'images'), exist_ok=True)
        os.makedirs(os.path.join(data_path, 'validation', 'labels'), exist_ok=True)
        
        if os.path.exists(images_path):
            image_files = [f for f in os.listdir(images_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            print_success(f"Tìm thấy {len(image_files)} hình ảnh")
            
            import random
            random.seed(42)
            random.shuffle(image_files)
            split_idx = int(len(image_files) * train_pct)
            train_files = image_files[:split_idx]
            val_files = image_files[split_idx:]
            
            print_info(f"Chia dữ liệu: {len(train_files)} train, {len(val_files)} validation")
            
            for img_file in train_files:
                src_img = os.path.join(images_path, img_file)
                dst_img = os.path.join(data_path, 'train', 'images', img_file)
                shutil.copy2(src_img, dst_img)
                
                label_file = os.path.splitext(img_file)[0] + '.txt'
                src_label = os.path.join(labels_path, label_file)
                if os.path.exists(src_label):
                    dst_label = os.path.join(data_path, 'train', 'labels', label_file)
                    shutil.copy2(src_label, dst_label)
            
            for img_file in val_files:
                src_img = os.path.join(images_path, img_file)
                dst_img = os.path.join(data_path, 'validation', 'images', img_file)
                shutil.copy2(src_img, dst_img)
                
                label_file = os.path.splitext(img_file)[0] + '.txt'
                src_label = os.path.join(labels_path, label_file)
                if os.path.exists(src_label):
                    dst_label = os.path.join(data_path, 'validation', 'labels', label_file)
                    shutil.copy2(src_label, dst_label)
            
            print_success("Chia dữ liệu hoàn tất!")
            return True
        else:
            print_error(f"Không tìm thấy hình ảnh tại {images_path}")
            return False
            
    except Exception as e:
        print_error(f"Chia dữ liệu thất bại: {e}")
        import traceback
        traceback.print_exc()
        return False


def install_libraries():
    print_step(5, "CÀI ĐẶT THƯ VIỆN")
    print_info("Đang cài đặt ultralytics...")
    
    try:
        result = subprocess.run(
            [sys.executable, '-m', 'pip', 'install', 'ultralytics', '-q'],
            timeout=300
        )
        if result.returncode == 0:
            print_success("Thư viện đã được cài đặt!")
            return True
        else:
            print_warning(f"Cài đặt hoàn tất với mã lỗi: {result.returncode}")
            return True
    except Exception as e:
        print_error(f"Cài đặt thất bại: {e}")
        return False


def create_data_yaml(classes_txt_path="/content/custom_data/classes.txt", 
                     yaml_output="/content/data.yaml",
                     base_path="/content/custom_data"):
    print_step(6, "TẠO FILE DATA.YAML")
    
    try:
        if not os.path.exists(classes_txt_path):
            print_error(f"Không tìm thấy classes.txt tại {classes_txt_path}")
            return False
        
        with open(classes_txt_path, 'r') as f:
            classes = [line.strip() for line in f.readlines() if line.strip()]
        
        if not classes:
            print_error("Không tìm thấy lớp nào trong classes.txt")
            return False
        
        print_success(f"Tìm thấy {len(classes)} lớp: {', '.join(classes)}")
        
        data = {
            'path': base_path,
            'train': 'train/images',
            'val': 'validation/images',
            'nc': len(classes),
            'names': classes
        }
        
        with open(yaml_output, 'w') as f:
            yaml.dump(data, f, sort_keys=False)
        
        print("\n  Nội dung data.yaml:")
        with open(yaml_output, 'r') as f:
            for line in f.read().split('\n'):
                if line:
                    print(f"    {line}")
        
        return True
    except Exception as e:
        print_error(f"Không thể tạo data.yaml: {e}")
        return False


def train_model(yaml_path="/content/data.yaml", epochs=60, imgsz=640):
    print_step(7, "HUẤN LUYỆN MÔ HÌNH YOLO")
    print_info(f"Bắt đầu huấn luyện YOLO11s ({epochs} epochs, {imgsz}x{imgsz})...")
    print_warning("Lưu ý: Huấn luyện có thể mất 30 phút - vài giờ tùy thuộc vào GPU và kích thước dataset\n")
    
    try:
        from ultralytics import YOLO
        print_success("Module YOLO đã được tải\n")
        
        if not os.path.exists(yaml_path):
            print_error(f"Không tìm thấy data.yaml tại {yaml_path}")
            return False
        
        print_info("Đang tải mô hình...")
        try:
            model = YOLO('yolo11s.pt')
            print_success("Mô hình đã tải thành công")
        except Exception as e:
            print_error(f"Không thể tải mô hình: {e}")
            return False
        
        print_info("Bắt đầu quá trình huấn luyện...\n")
        print("─"*70)
        try:
            results = model.train(
                data=yaml_path,
                epochs=epochs,
                imgsz=imgsz,
                patience=20,
                device=0,
                verbose=VERBOSE,
                exist_ok=True
            )
            print("─"*70)
            print_success("Huấn luyện hoàn tất!\n")
            return True
            
        except ValueError as e:
            if "Invalid CUDA" in str(e) or "device" in str(e).lower():
                print_error("GPU không khả dụng!")
                print("\n" + "!"*70)
                print("  YÊU CẦU GPU - Vui lòng kích hoạt GPU trong Colab:")
                print("  1. Nhấp vào menu 'Runtime'")
                print("  2. Chọn 'Change runtime type'")
                print("  3. Chọn 'T4' GPU hoặc cao hơn (A100 được ưu tiên)")
                print("  4. Nhấp vào 'Save'")
                print("  5. Chạy lại ô này")
                print("!"*70 + "\n")
                return False
            else:
                print_error(f"Lỗi huấn luyện: {e}")
                import traceback
                traceback.print_exc()
                return False
        
        except Exception as train_error:
            print_error(f"Huấn luyện thất bại:")
            print(f"  Loại lỗi: {type(train_error).__name__}")
            print(f"  Chi tiết: {str(train_error)}")
            import traceback
            traceback.print_exc()
            return False
        
    except ImportError as e:
        print_error(f"Lỗi nhập: {e}")
        print_info("Vui lòng cài đặt ultralytics: pip install ultralytics")
        return False
    except Exception as e:
        print_error(f"Lỗi không mong muốn: {e}")
        import traceback
        traceback.print_exc()
        return False


def find_model():
    possible_paths = [
        '/content/runs/detect/train/weights/best.pt',
        '/content/runs/detect/train1/weights/best.pt',
        '/content/runs/detect/train2/weights/best.pt',
        '/content/runs/train/weights/best.pt',
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    if os.path.exists('/content/runs'):
        for root, dirs, files in os.walk('/content/runs'):
            if 'best.pt' in files:
                return os.path.join(root, 'best.pt')
    
    return None


def download_model():
    print_step(8, "TẢI XUỐNG MÔ HÌNH ĐÃ HUẤN LUYỆN")
    
    try:
        model_source = find_model()
        
        if not model_source:
            print_error("Không tìm thấy mô hình đã huấn luyện!")
            if os.path.exists('/content/runs'):
                print("\n  Nội dung của /content/runs:")
                for root, dirs, files in os.walk('/content/runs'):
                    level = root.replace('/content/runs', '').count(os.sep)
                    indent = '    ' * level
                    print(f"{indent}{os.path.basename(root)}/")
                    for file in files:
                        size = os.path.getsize(os.path.join(root, file)) / (1024*1024)
                        print(f"{indent}  {file} ({size:.2f} MB)")
            return False
        
        file_size_mb = os.path.getsize(model_source) / (1024 * 1024)
        print_success(f"Tìm thấy mô hình: {model_source}")
        print_info(f"Kích thước: {file_size_mb:.2f} MB")
        
        model_destination = '/content/best_model.pt'
        shutil.copy2(model_source, model_destination)
        print_success(f"Mô hình đã sao chép tới: {model_destination}")
        
        return True
        
    except Exception as e:
        print_error(f"Không thể tải xuống mô hình: {e}")
        return False


def upload_model_to_server(api_url, token, model_path="/content/best_model.pt", 
                          model_name=None, description=None, version="1.0"):
    print_step(9, "TẢI MÔ HÌNH LÊN SERVER")
    
    try:
        if not os.path.exists(model_path):
            print_error(f"Tệp mô hình không được tìm thấy: {model_path}")
            return False
        
        file_size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print_info(f"Tệp mô hình: {model_path}")
        print_info(f"Kích thước: {file_size_mb:.2f} MB")
        print_info(f"TOKEN URL API: {api_url}")
        print_info(f"Token: {token[:20]}...")
        
        upload_url = f"{api_url}/v1/yolo/models/upload-with-token/{token}"
        print_info(f"\nĐang tải lên tới {upload_url}...")
        
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
            
            response = requests.post(
                upload_url,
                files=files,
                data=data,
                timeout=600
            )
        
        if response.status_code == 201:
            print_success(f"Tải lên thành công! (Trạng thái: {response.status_code})")
            try:
                json_response = response.json()
                if 'data' in json_response:
                    model_info = json_response['data']
                    print("\n  Thông tin mô hình:")
                    for key, value in model_info.items():
                        print(f"    {key}: {value}")
                else:
                    print(f"\n  Phản hồi: {json.dumps(json_response, indent=2, ensure_ascii=False)}")
            except:
                print(f"  Phản hồi: {response.text}")
            return True
        else:
            print_error(f"Tải lên thất bại! (Trạng thái: {response.status_code})")
            print(f"  Phản hồi: {response.text}")
            return False
        
    except requests.exceptions.Timeout:
        print_error("Quá hạn - Tải lên mất quá lâu")
        return False
    except requests.exceptions.ConnectionError:
        print_error("Không thể kết nối tới server")
        print_info("Vui lòng kiểm tra TOKEN URL và kết nối internet")
        return False
    except Exception as e:
        print_error(f"Tải lên thất bại: {e}")
        import traceback
        traceback.print_exc()
        return False


def get_timestamp():
    from datetime import datetime
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def main(dataset_url, epochs=60, imgsz=640, train_pct=0.9, api_url=None, 
         model_name=None, description=None, version="1.0"):
    print_header("QUY TRÌNH HUẤN LUYỆN MÔ HÌNH YOLO")
    
    os.makedirs('/content', exist_ok=True)
    os.makedirs('/content/custom_data', exist_ok=True)
    
    print_step(1, "KIỂM TRA GPU")
    if not check_gpu():
        return False
    
    token = extract_token_from_url(dataset_url)
    if token:
        print_success("Token đã được trích xuất từ TOKEN URL")
        print_info(f"Token: {token[:30]}...")
    else:
        print_warning("Không thể trích xuất token từ TOKEN URL")
        print_info("Tải mô hình sẽ bị bỏ qua")
    
    if not api_url:
        api_url = extract_api_url_from_download_url(dataset_url)
        if api_url:
            print_success("TOKEN URL API đã được trích xuất từ TOKEN URL tải xuống")
            print_info(f"TOKEN URL API: {api_url}")
    
    if not download_dataset(dataset_url):
        return False
    
    if not extract_dataset():
        return False
    
    if not model_name:
        dataset_name = extract_dataset_name_from_notes()
        if dataset_name:
            model_name = f"{dataset_name}_trained_{get_timestamp()}"
            print_success("Tên mô hình đã được trích xuất từ notes.json")
            print_info(f"Tên mô hình: {model_name}")
    
    if not split_data(train_pct=train_pct):
        return False
    
    if not install_libraries():
        return False
    
    if not create_data_yaml():
        return False
    
    if not train_model(epochs=epochs, imgsz=imgsz):
        return False
    
    if not download_model():
        return False
    
    if api_url and token:
        if not upload_model_to_server(
            api_url=api_url,
            token=token,
            model_name=model_name,
            description=description,
            version=version
        ):
            print_warning("Tải mô hình thất bại, nhưng huấn luyện thành công")
            print_info("Bạn có thể tải mô hình theo cách thủ công sau này")
    else:
        if not token:
            print_info("Không thể trích xuất token từ TOKEN URL dataset")
            print_info("Định dạng yêu cầu: https://domain.com/api/v1/yolo/download/TOKEN")
        if not api_url:
            print_info("Không thể trích xuất TOKEN URL API từ TOKEN URL dataset")
            print_info("Để tải mô hình, vui lòng cung cấp tham số --api-url")
    
    print_header("QUY TRÌNH HUẤN LUYỆN HO ÀN TẤT!")
    return True


# ============================================================================
# SIMPLE GUI FOR COLAB - IPYWIDGETS
# ============================================================================

def create_gui():
    """Tạo GUI đơn giản cho Colab bằng ipywidgets"""
    try:
        import ipywidgets as widgets
        from IPython.display import display
        
        # Trường nhập liệu
        url_label = widgets.HTML("<b>TOKEN URL:</b>")
        url_input = widgets.Text(
            value='',
            placeholder='https://your-domain.com/api/v1/yolo/download/TOKEN',
            layout=widgets.Layout(width='100%')
        )
        
        model_name_label = widgets.HTML("<b>Tên mô hình:</b>")
        model_name_input = widgets.Text(
            value='',
            placeholder='Tự động nếu để trống',
            layout=widgets.Layout(width='100%')
        )
        
        description_label = widgets.HTML("<b>Mô tả:</b>")
        description_input = widgets.Textarea(
            value='',
            placeholder='Mô tả tùy chọn',
            rows=3,
            layout=widgets.Layout(width='100%')
        )
        
        version_label = widgets.HTML("<b>Phiên bản:</b>")
        version_input = widgets.Text(
            value='1.0',
            placeholder='1.0',
            layout=widgets.Layout(width='100%')
        )
        
        epochs_input = widgets.IntSlider(
            value=60,
            min=10,
            max=200,
            step=10,
            description='Epochs:'
        )
        
        imgsz_dropdown = widgets.Dropdown(
            options=['640', '800', '960'],
            value='640',
            description='Kích thước:'
        )
        
        train_pct_input = widgets.FloatSlider(
            value=0.9,
            min=0.5,
            max=0.95,
            step=0.05,
            description='Train %:'
        )
        
        verbose_toggle = widgets.ToggleButton(
            value=False,
            description='Chi tiết: TẮT',
            button_style='danger',
            tooltip='Bật/tắt hiển thị chi tiết'
        )
        
        submit_button = widgets.Button(
            description='Bắt đầu huấn luyện',
            button_style='success',
            tooltip='Nhấp để bắt đầu huấn luyện'
        )
        
        output = widgets.Output()
        
        def on_verbose_toggle(change):
            set_verbose(change['new'])
            if change['new']:
                verbose_toggle.description = 'Chi tiết: BẬT'
                verbose_toggle.button_style = 'info'
            else:
                verbose_toggle.description = 'Chi tiết: TẮT'
                verbose_toggle.button_style = 'danger'
        
        verbose_toggle.observe(on_verbose_toggle, names='value')
        
        def on_submit_clicked(b):
            with output:
                output.clear_output()
                
                if not url_input.value:
                    print_error("TOKEN URL là bắt buộc!")
                    return
                
                if not url_input.value.startswith(('http://', 'https://')):
                    print_error("TOKEN URL phải bắt đầu bằng http:// hoặc https://")
                    return
                
                try:
                    success = main(
                        dataset_url=url_input.value,
                        epochs=epochs_input.value,
                        imgsz=int(imgsz_dropdown.value),
                        train_pct=train_pct_input.value,
                        model_name=model_name_input.value or None,
                        description=description_input.value or None,
                        version=version_input.value or "1.0"
                    )
                    
                    if success:
                        print_success("Huấn luyện hoàn tất thành công!")
                    else:
                        print_error("Huấn luyện thất bại!")
                        
                except Exception as e:
                    print_error(f"Lỗi: {e}")
                    import traceback
                    traceback.print_exc()
        
        submit_button.on_click(on_submit_clicked)
        
        # Display UI với container có độ dài cố định
        form_container = widgets.VBox([
            url_label,
            url_input,
            model_name_label,
            model_name_input,
            description_label,
            description_input,
            version_label,
            version_input,
            widgets.HBox([epochs_input, imgsz_dropdown]),
            widgets.HBox([train_pct_input]),
            widgets.HBox([submit_button, verbose_toggle]),
        ], layout=widgets.Layout(width='500px', border='1px solid #ccc', padding='20px'))
        
        display(widgets.VBox([
            form_container,
            output
        ]))
        
    except ImportError:
        print_warning("ipywidgets không có sẵn")
    except Exception as e:
        print_error(f"Lỗi tạo GUI: {e}")


def create_console_ui(epochs=60, imgsz=640, train_pct=0.9, model_name=None, description=None, version="1.0"):
    """Tạo giao diện dựa trên bảng điều khiển (dự phòng)"""
    print_header("Huấn luyện Mô hình YOLO")
    
    try:
        dataset_url = input("\n  Nhập TOKEN URL tải xuống dataset: ").strip()
        
        if not dataset_url:
            print_error("TOKEN URL Dataset là bắt buộc")
            return False
        
        if not dataset_url.startswith(('http://', 'https://')):
            print_error("TOKEN URL phải bắt đầu bằng http:// hoặc https://")
            return False
        
        print_header("Bắt đầu quá trình huấn luyện...")
        
        success = main(
            dataset_url=dataset_url, 
            epochs=epochs, 
            imgsz=imgsz,
            train_pct=train_pct,
            model_name=model_name,
            description=description,
            version=version
        )
        return success
        
    except KeyboardInterrupt:
        print_warning("Huấn luyện đã bị hủy")
        return False
    except Exception as e:
        print_error(f"Lỗi: {e}")
        import traceback
        traceback.print_exc()
        return False


def create_ui(epochs=60, imgsz=640, train_pct=0.9, model_name=None, description=None, version="1.0"):
    """Tạo giao diện tương tác (GUI cho Colab, bảng điều khiển dự phòng cho CLI)"""
    try:
        # Kiểm tra xem có chạy trong Jupyter/Colab không
        get_ipython()  # Điều này sẽ gây ra NameError nếu không ở Jupyter
        return create_gui()
    except (NameError, AttributeError):
        # Chạy từ CLI, sử dụng giao diện bảng điều khiển
        return create_console_ui(epochs, imgsz, train_pct, model_name, description, version)


# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Quy trình huấn luyện YOLO')
    parser.add_argument('--url', default=None, help='TOKEN URL tải xuống dataset')
    parser.add_argument('--epochs', type=int, default=60, help='Số lượng epochs huấn luyện (mặc định: 60)')
    parser.add_argument('--imgsz', type=int, default=640, help='Kích thước hình ảnh (mặc định: 640)')
    parser.add_argument('--train-pct', type=float, default=0.9, help='Phần trăm huấn luyện (mặc định: 0.9)')
    parser.add_argument('--api-url', default=None, help='TOKEN URL cơ sở API để tải mô hình')
    parser.add_argument('--model-name', default=None, help='Tên mô hình để tải')
    parser.add_argument('--description', default=None, help='Mô tả mô hình')
    parser.add_argument('--version', default='1.0', help='Phiên bản mô hình (mặc định: 1.0)')
    parser.add_argument('--verbose', action='store_true', help='Hiển thị chi tiết (mặc định: chế độ yên tĩnh)')
    parser.add_argument('--ui', action='store_true', help='Khởi chạy chế độ GUI tương tác')
    
    args = parser.parse_args()
    
    # Thiết lập chế độ verbose
    set_verbose(args.verbose)
    
    # Chế độ UI - chạy giao diện tương tác với các tham số tùy chọn làm mặc định
    if args.ui:
        create_ui(
            epochs=args.epochs,
            imgsz=args.imgsz,
            train_pct=args.train_pct,
            model_name=args.model_name,
            description=args.description,
            version=args.version
        )
    # Chế độ CLI - sử dụng --url được cung cấp và chạy với các tham số
    elif args.url:
        success = main(
            dataset_url=args.url,
            epochs=args.epochs,
            imgsz=args.imgsz,
            train_pct=args.train_pct,
            api_url=args.api_url,
            model_name=args.model_name,
            description=args.description,
            version=args.version
        )
        sys.exit(0 if success else 1)
    else:
        parser.print_help()
        sys.exit(1)
