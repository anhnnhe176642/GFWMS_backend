# YOLO Dataset & Training - Quick Start

## TL;DR - Câu trả lời cho câu hỏi của bạn

### 1. Lưu dataset ở đâu?
```t
src/python/datasets/
├── images/
│   ├── train/
│   ├── val/
│   └── test/
└── labels/
    ├── train/
    ├── val/
    └── test/
```

### 2. Lưu toàn bộ hay chỉ lưu mới?
**=> LƯU TOÀN BỘ (cũ + mới)**

**Lý do:**
- YOLO cần toàn bộ dataset để tránh quên kiến thức cũ (catastrophic forgetting)
- Incremental learning với YOLO rất phức tạp
- Mỗi lần train cần shuffle lại train/val/test
- Storage rẻ hơn việc mất accuracy

## Cách sử dụng

### Flow 1: Lưu ảnh từ Detection API
```javascript
// Bước 1: Detect object
const formData = new FormData();
formData.append('image', imageFile);
const detectRes = await fetch('/api/v1/yolo/detect', {
  method: 'POST',
  body: formData
});

// Bước 2: Lưu vào dataset để train lại
const saveData = new FormData();
saveData.append('image', imageFile);
saveData.append('detection_result', JSON.stringify(detectRes.data));
saveData.append('split', 'train'); // hoặc 'val', 'test'

await fetch('/api/v1/yolo/datasets/1/save-detection', {
  method: 'POST',
  body: saveData
});
```

### Flow 2: Train lại model
```javascript
// Sau khi thu thập đủ data mới, bắt đầu training
const trainRes = await fetch('/api/v1/yolo/datasets/1/train', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    base_model: 'best.pt',  // Train từ model hiện tại
    epochs: 100,
    batch_size: 16,
    image_size: 640
  })
});

// Training chạy background, check status
const status = await fetch(`/api/v1/yolo/training-runs/${trainRes.data.id}`);
```

## Setup

1. Chạy migration:
```bash
pnpm run prisma:all
```

2. Tạo thư mục:
```bash
mkdir -p src/python/datasets/{images,labels}/{train,val,test}
```

3. Test:
```bash
# Tạo dataset
curl -X POST http://localhost:3000/api/v1/yolo/datasets \
  -H "Content-Type: application/json" \
  -d '{"name": "fabric_v1.0"}'
```

## Tài liệu đầy đủ
Xem `YOLO_DATASET.md` để biết chi tiết đầy đủ.
