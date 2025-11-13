# YOLO Dataset & Training System

## Overview
Hệ thống quản lý dataset và training cho YOLO model với khả năng continuous learning.

## Cấu trúc Dataset

### Cấu trúc thư mục
```t
src/python/
├── datasets/
│   ├── images/
│   │   ├── train/       # Training images
│   │   ├── val/         # Validation images
│   │   └── test/        # Test images
│   ├── labels/
│   │   ├── train/       # Training labels (YOLO format)
│   │   ├── val/         # Validation labels
│   │   └── test/        # Test labels
│   └── data.yaml        # Dataset configuration
├── models/
│   └── best.pt          # Base model for training
└── runs/
    └── train/           # Training outputs
        └── exp_*/
            ├── weights/
            │   ├── best.pt
            │   └── last.pt
            └── results.csv
```

## Database Schema

### YoloDataset
Quản lý phiên bản dataset
- `name`: Tên dataset (v1.0, v2.0...)
- `totalImages`: Tổng số ảnh
- `trainImages`, `valImages`, `testImages`: Số ảnh mỗi split
- `status`: ACTIVE/ARCHIVED/TRAINING

### YoloImage
Lưu thông tin từng ảnh
- `imagePath`: Đường dẫn tương đối
- `width`, `height`: Kích thước
- `split`: TRAIN/VAL/TEST
- `sourceType`: MANUAL/DETECTION/IMPORT

### YoloLabel
Labels theo YOLO format (normalized 0-1)
- `classId`, `className`
- `centerX`, `centerY`: Tọa độ tâm (normalized)
- `width`, `height`: Kích thước (normalized)
- `confidence`: Độ tin cậy (nếu từ auto-detection)
- `verified`: Đã verify manual chưa

### YoloTrainRun
Theo dõi quá trình training
- `baseModel`: Model base để train
- `epochs`, `batchSize`, `imageSize`: Config
- `status`: PENDING/RUNNING/COMPLETED/FAILED
- `mapScore`, `precision`, `recall`: Kết quả

## API Endpoints

### Dataset Management

#### Tạo dataset mới
```http
POST /api/v1/yolo/datasets
Content-Type: application/json

{
  "name": "fabric_v1.0",
  "description": "Initial fabric dataset",
  "status": "ACTIVE"
}
```

#### Lưu ảnh với labels thủ công
```http
POST /api/v1/yolo/datasets/{id}/images
Content-Type: multipart/form-data

image: <file>
labels: [
  {
    "class_id": 0,
    "class_name": "fabric_defect",
    "center_x": 0.5,
    "center_y": 0.5,
    "width": 0.3,
    "height": 0.4
  }
]
split: "train"
```

#### Lưu kết quả detection để retrain
```http
POST /api/v1/yolo/datasets/{id}/save-detection
Content-Type: multipart/form-data

image: <file>
detection_result: {
  "success": true,
  "image_info": {
    "width": 1920,
    "height": 1080
  },
  "detections": [
    {
      "class_id": 0,
      "class_name": "fabric_defect",
      "confidence": 0.85,
      "bbox": {
        "x1": 100,
        "y1": 200,
        "x2": 300,
        "y2": 400
      }
    }
  ]
}
split: "train"
```

#### Bắt đầu training
```http
POST /api/v1/yolo/datasets/{id}/train
Content-Type: application/json

{
  "base_model": "best.pt",
  "epochs": 100,
  "batch_size": 16,
  "image_size": 640
}
```

#### Xem tiến độ training
```http
GET /api/v1/yolo/training-runs/{id}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "status": "COMPLETED",
    "startedAt": "2024-11-13T10:00:00Z",
    "completedAt": "2024-11-13T12:30:00Z",
    "mapScore": 0.87,
    "precision": 0.89,
    "recall": 0.85,
    "modelPath": "src/python/runs/train/exp_20241113/weights/best.pt"
  }
}
```

## Workflow

### 1. Tạo Dataset Mới
```javascript
// Tạo dataset
const dataset = await fetch('/api/v1/yolo/datasets', {
  method: 'POST',
  body: JSON.stringify({
    name: 'fabric_v2.0',
    description: 'Updated fabric defect dataset'
  })
});
```

### 2. Thu thập Data

**Option A: Manual labeling**
```javascript
// Upload ảnh với labels thủ công
const formData = new FormData();
formData.append('image', imageFile);
formData.append('labels', JSON.stringify([
  {
    class_id: 0,
    class_name: 'defect',
    center_x: 0.5,
    center_y: 0.5,
    width: 0.3,
    height: 0.4
  }
]));
formData.append('split', 'train');

await fetch(`/api/v1/yolo/datasets/${datasetId}/images`, {
  method: 'POST',
  body: formData
});
```

**Option B: Save from detection**
```javascript
// 1. Detect object
const detectResult = await fetch('/api/v1/yolo/detect', {
  method: 'POST',
  body: detectFormData
});

// 2. Save to dataset
const saveFormData = new FormData();
saveFormData.append('image', imageFile);
saveFormData.append('detection_result', JSON.stringify(detectResult.data));
saveFormData.append('split', 'train');

await fetch(`/api/v1/yolo/datasets/${datasetId}/save-detection`, {
  method: 'POST',
  body: saveFormData
});
```

### 3. Kiểm tra Dataset Stats
```javascript
const stats = await fetch(`/api/v1/yolo/datasets/${datasetId}/stats`);
// {
//   "train": {"images": 150, "labels": 150},
//   "val": {"images": 30, "labels": 30},
//   "test": {"images": 20, "labels": 20},
//   "total_images": 200
// }
```

### 4. Start Training
```javascript
const trainRun = await fetch(`/api/v1/yolo/datasets/${datasetId}/train`, {
  method: 'POST',
  body: JSON.stringify({
    base_model: 'best.pt',  // Train from current best model
    epochs: 100,
    batch_size: 16,
    image_size: 640
  })
});

// Training runs in background
// Check status:
const status = await fetch(`/api/v1/yolo/training-runs/${trainRun.data.id}`);
```

### 5. Sau khi Training xong
```javascript
// Get training result
const result = await fetch(`/api/v1/yolo/training-runs/${runId}`);

if (result.data.status === 'COMPLETED') {
  // Copy new model to production
  // result.data.modelPath -> src/python/models/best.pt
  
  // Update dataset
  await fetch(`/api/v1/yolo/datasets/${datasetId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      lastTrainedAt: new Date(),
      modelVersion: 'v2.0'
    })
  });
}
```

## Best Practices

### 1. Dataset Organization
- **Tỷ lệ split**: 70% train, 20% val, 10% test
- **Naming convention**: `fabric_v{major}.{minor}`
- **Version control**: Mỗi lần train tạo version mới

### 2. Data Collection Strategy
- **LƯU TOÀN BỘ dataset (cũ + mới)** để tránh catastrophic forgetting
- Verify labels từ auto-detection trước khi train
- Balance classes để tránh bias

### 3. Training Strategy
- Start với `base_model = "best.pt"` (model hiện tại)
- Epochs: 50-100 cho fine-tuning
- Monitor validation mAP để tránh overfitting
- Keep training runs history để rollback nếu cần

### 4. Model Deployment
```bash
# Sau khi training xong, copy model mới
cp src/python/runs/train/exp_*/weights/best.pt src/python/models/best.pt

# Hoặc tự động trong code khi training COMPLETED
```

## Python Scripts Usage

### Dataset Manager
```bash
# Save image with labels
python dataset_manager.py save_image <image_path> '<labels_json>' train <image_id>

# Save detection result
python dataset_manager.py save_detection <image_path> '<detection_json>' train <image_id>

# Get stats
python dataset_manager.py stats

# Create data.yaml
python dataset_manager.py create_yaml '["class1", "class2"]'
```

### Trainer
```bash
# Train model
python yolo_trainer.py train <data.yaml> best.pt 100 16 640

# Resume training
python yolo_trainer.py resume <run_path> 50

# Export model
python yolo_trainer.py export <model.pt> onnx
```

## Migration & Setup

### 1. Run Prisma Migration
```bash
pnpm run prisma:all
```

### 2. Create directories
```bash
mkdir -p src/python/datasets/{images,labels}/{train,val,test}
mkdir -p src/python/runs/train
```

### 3. Test the flow
```bash
# 1. Create dataset
curl -X POST http://localhost:3000/api/v1/yolo/datasets \
  -H "Content-Type: application/json" \
  -d '{"name": "test_v1.0"}'

# 2. Upload image with labels
# (use Postman/Thunder Client)

# 3. Start training
curl -X POST http://localhost:3000/api/v1/yolo/datasets/1/train \
  -H "Content-Type: application/json" \
  -d '{"epochs": 10}'

# 4. Check status
curl http://localhost:3000/api/v1/yolo/training-runs/1
```

## Notes

### Lưu toàn bộ hay chỉ lưu mới?
**Trả lời: LƯU TOÀN BỘ (cũ + mới)**

**Lý do:**
1. YOLO training cần toàn bộ dataset để maintain performance
2. Incremental learning phức tạp, dễ gây catastrophic forgetting
3. Mỗi lần train cần shuffle và split lại train/val/test
4. Disk space rẻ hơn là mất accuracy

**Quản lý storage:**
- Archive datasets cũ (status = ARCHIVED)
- Chỉ giữ 3-5 versions gần nhất là ACTIVE
- Backup định kỳ sang cloud storage

### Training Strategy
- **Initial training**: Train from scratch với full dataset
- **Fine-tuning**: Train from best.pt với dataset mới
- **Continuous learning**: Merge old + new → retrain from best.pt

