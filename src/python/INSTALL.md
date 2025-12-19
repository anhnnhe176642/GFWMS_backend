# YOLO Detection - Python Setup Guide

## Overview
Hướng dẫn cài đặt và cấu hình môi trường Python cho YOLO Object Detection trong dự án GFWMS.

### Requirements
- **Python 3.8+** (khuyến nghị Python 3.10+)
- **pip** (trình quản lý gói Python)
- **(Optional) NVIDIA GPU + CUDA 13.0+** (để tăng tốc độ nhận diện)

## 📦 Các Packages Chính

| Package | Version | Mục đích |
|---------|---------|---------|
| `ultralytics` | ≥8.0.0 | Framework YOLO |
| `opencv-python` | ≥4.8.0 | Xử lý hình ảnh |
| `Pillow` | ≥10.0.0 | Xử lý ảnh |
| `numpy` | ≥1.24.0 | Tính toán số học |
| `torch` | ≥2.0.0 | Deep Learning framework (CPU/GPU) |
| `torchvision` | ≥0.15.0 | Computer vision utilities |
| `pyyaml` | ≥6.0 | Xử lý YAML config |

## 🚀 Installation

### 1. **Windows** - Sử dụng Batch Script

```batch
# Chạy script cài đặt tự động
cd src\python
install.bat

# Hoặc cài từ requirements.txt
pip install -r requirements.txt

# Nếu có GPU NVIDIA (CUDA 13.0+)
pip install -r requirements-gpu.txt
```

### 2. **Linux / macOS** - Sử dụng Bash Script

```bash
# Chạy script cài đặt tự động
cd src/python
chmod +x install.sh
./install.sh

# Hoặc cài từ requirements.txt
pip3 install -r requirements.txt

# Nếu có GPU NVIDIA (CUDA 13.0+)
pip3 install -r requirements-gpu.txt
```

### 3. **Cross-platform** - Sử dụng Python Script

```bash
cd src/python
python install.py        # (Windows/Linux/macOS)
# hoặc
python3 install.py       # (Linux/macOS)
```

Script sẽ tự động:
- ✓ Kiểm tra phiên bản Python
- ✓ Kiểm tra CUDA/GPU có sẵn
- ✓ Hỏi bạn chọn cài đặt CPU hay GPU
- ✓ Cài đặt PyTorch phù hợp
- ✓ Cài đặt các packages khác
- ✓ Xác minh cài đặt thành công

## ✅ Xác Minh Cài Đặt

Sau khi cài đặt, hãy chạy script kiểm tra:

```bash
python verify_setup.py        # (Windows)
python3 verify_setup.py       # (Linux/macOS)
```

Script sẽ kiểm tra:
- ✓ Phiên bản Python
- ✓ Tất cả packages bắt buộc
- ✓ CUDA/GPU availability
- ✓ Model file (`models/best.pt`)
- ✓ Python scripts

**Output thành công:**
```
✅ SETUP COMPLETE! (Running with GPU)
   You can now:
   1. Start the server: pnpm run dev
   2. Test the API: curl http://localhost:3000/api/yolo/health
```

## 🔧 Cài Đặt Thủ Công

### CPU-only (Nếu không có GPU)

```bash
# Cài PyTorch cho CPU
pip install torch>=2.0.0 torchvision>=0.15.0

# Cài các packages khác
pip install -r requirements.txt
```

### GPU (CUDA 13.0+)

```bash
# Cài PyTorch với GPU support
pip install torch>=2.0.0 torchvision>=0.15.0 \
    --index-url https://download.pytorch.org/whl/cu130

# Cài các packages khác
pip install -r requirements-gpu.txt
```

## 📂 Cấu Trúc Thư Mục

```
src/python/
├── requirements.txt              # CPU packages
├── requirements-gpu.txt          # GPU packages (CUDA 13.0+)
├── install.py                    # Python installation script (cross-platform)
├── install.sh                    # Bash installation script (Linux/macOS)
├── install.bat                   # Batch installation script (Windows)
├── verify_setup.py               # Verification script
├── yolo_detector.py              # YOLO detection engine
├── train_yolo_colab.py           # Model training script
├── test_detector.py              # Testing script
├── models/                        # Model storage
│   ├── best.pt                   # Default model file
│   └── ...other models...
└── README.md                     # This file
```

## 🐍 Cách Sử Dụng

### 1. **Kiểm Tra Cài Đặt**

```bash
python verify_setup.py
```

### 2. **Phát Hiện Đối Tượng (Detection)**

```bash
python yolo_detector.py <image_path> <model_path> [confidence_threshold] [use_gpu]
```

**Example:**
```bash
python yolo_detector.py ./test.jpg ./models/best.pt 0.5 true
```

**Output:** JSON với thông tin detection

### 3. **Đào Tạo Mô Hình (Training)**

```bash
python train_yolo_colab.py --url "DOWNLOAD_URL" --epochs 100
```

### 4. **Test Detection**

```bash
python test_detector.py
```

## ⚠️ Troubleshooting

### "ModuleNotFoundError: No module named 'ultralytics'"

**Giải pháp:**
```bash
pip install ultralytics>=8.0.0
```

### "ImportError: libGL.so.1: cannot open shared object file" (Linux)

**Giải pháp:**
```bash
sudo apt-get install libgl1-mesa-glx
```

### CUDA Not Available (GPU)

**Kiểm tra CUDA:**
```python
import torch
print(torch.cuda.is_available())  # Should print: True
print(torch.cuda.get_device_name(0))  # GPU name
```

**Cài PyTorch với CUDA 13.0:**
```bash
pip install torch torchvision \
    --index-url https://download.pytorch.org/whl/cu130
```

### Model file not found

Đảm bảo file model `.pt` được đặt trong: `src/python/models/best.pt`

## 📝 Environment Variables (Optional)

```bash
# GPU selection (0 = GPU, 'cpu' = CPU)
YOLO_DEVICE=0

# Model path
YOLO_MODEL_PATH=./models/best.pt

# Confidence threshold
YOLO_CONFIDENCE=0.5
```

## 🔗 Tài Liệu Tham Khảo

- **Ultralytics YOLO**: https://docs.ultralytics.com
- **PyTorch**: https://pytorch.org
- **OpenCV**: https://opencv.org
- **CUDA**: https://developer.nvidia.com/cuda-toolkit

## 📊 Hiệu Suất

### CPU Performance
- Thời gian xử lý: ~2-5 giây/ảnh (tùy thuộc vào máy)
- Memory: ~2-3 GB RAM

### GPU Performance (NVIDIA CUDA 13.0+)
- Thời gian xử lý: ~0.1-0.3 giây/ảnh
- Memory: ~4-6 GB VRAM
- Tăng tốc độ: ~10-50x so với CPU

## 🎯 Bước Tiếp Theo

1. ✅ Chạy `python verify_setup.py` để xác minh
2. ✅ Khởi động server: `pnpm run dev`
3. ✅ Kiểm tra API: `curl http://localhost:3000/api/yolo/health`
4. ✅ Đọc tài liệu API: http://localhost:3000/api-docs

---

**Tạo lúc:** December 2024  
**Phiên bản:** 1.0.0  
**Cập nhật lần cuối:** Auto-generated
