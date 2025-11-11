"""
Quick verification script - Check if YOLO setup is ready
Run: python verify_setup.py
"""

import sys
import os

print("=" * 60)
print("YOLO Setup Verification")
print("=" * 60)
print()

# Check 1: Python version
print("✓ Checking Python version...")
print(f"  Python {sys.version}")
if sys.version_info < (3, 8):
    print("  ⚠️  Warning: Python 3.8+ recommended")
else:
    print("  ✓ OK")
print()

# Check 2: Required packages
print("✓ Checking required packages...")
required_packages = {
    'ultralytics': 'YOLO framework',
    'cv2': 'OpenCV (opencv-python)',
    'PIL': 'Pillow',
    'numpy': 'NumPy'
}

missing_packages = []
for package, description in required_packages.items():
    try:
        __import__(package)
        print(f"  ✓ {description}: OK")
    except ImportError:
        print(f"  ✗ {description}: MISSING")
        missing_packages.append(package)

print()

if missing_packages:
    print("❌ Missing packages detected!")
    print("   Install with: pip install ultralytics opencv-python pillow numpy")
    print()
else:
    print("✓ All packages installed!")
    print()

# Check 3: Model file
print("✓ Checking model file...")
model_path = os.path.join(os.path.dirname(__file__), 'models', 'best.pt')
if os.path.exists(model_path):
    size_mb = os.path.getsize(model_path) / (1024 * 1024)
    print(f"  ✓ Model found: {model_path}")
    print(f"  ✓ Size: {size_mb:.2f} MB")
else:
    print(f"  ✗ Model NOT found: {model_path}")
    print(f"  ⚠️  Please copy your .pt file to: {model_path}")
print()

# Check 4: Python scripts
print("✓ Checking Python scripts...")
scripts = ['yolo_detector.py', 'test_detector.py']
for script in scripts:
    script_path = os.path.join(os.path.dirname(__file__), script)
    if os.path.exists(script_path):
        print(f"  ✓ {script}: OK")
    else:
        print(f"  ✗ {script}: MISSING")
print()

# Summary
print("=" * 60)
if missing_packages:
    print("❌ SETUP INCOMPLETE")
    print("   Missing packages. Run:")
    print("   pip install ultralytics opencv-python pillow numpy")
elif not os.path.exists(model_path):
    print("⚠️  SETUP ALMOST READY")
    print("   Please copy your YOLO model (.pt) to:")
    print(f"   {model_path}")
else:
    print("✅ SETUP COMPLETE!")
    print("   You can now:")
    print("   1. Start the server: pnpm run dev")
    print("   2. Test the API: curl http://localhost:3000/api/yolo/health")
print("=" * 60)
