#!/usr/bin/env python3
"""
Python Installation Script for YOLO Detection Setup
Handles installation of CPU and GPU variants with error handling
"""

import subprocess
import sys
import os
from pathlib import Path

# ANSI color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_header(text):
    print(f"\n{BLUE}{'='*70}{RESET}")
    print(f"{BLUE}{text.center(70)}{RESET}")
    print(f"{BLUE}{'='*70}{RESET}\n")

def print_success(text):
    print(f"{GREEN}✓{RESET} {text}")

def print_error(text):
    print(f"{RED}✗{RESET} {text}")

def print_warning(text):
    print(f"{YELLOW}⚠{RESET} {text}")

def print_info(text):
    print(f"{BLUE}ℹ{RESET} {text}")

def check_python_version():
    """Check if Python version is 3.8+"""
    print_header("Checking Python Version")
    version = sys.version_info
    version_str = f"{version.major}.{version.minor}.{version.micro}"
    
    if version.major == 3 and version.minor >= 8:
        print_success(f"Python {version_str} is compatible")
        return True
    else:
        print_error(f"Python {version_str} - Requires Python 3.8+")
        return False

def check_pip():
    """Check if pip is available"""
    print_header("Checking pip Installation")
    try:
        result = subprocess.run([sys.executable, "-m", "pip", "--version"], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print_success(result.stdout.strip())
            return True
    except Exception as e:
        print_error(f"Failed to check pip: {e}")
    return False

def check_cuda_availability():
    """Check if CUDA is available"""
    print_header("Checking CUDA Availability")
    try:
        import torch
        if torch.cuda.is_available():
            cuda_version = torch.version.cuda
            device_name = torch.cuda.get_device_name(0)
            device_memory = torch.cuda.get_device_properties(0).total_memory / (1024**3)
            
            print_success(f"CUDA Available: YES")
            print_info(f"CUDA Version: {cuda_version}")
            print_info(f"GPU Device: {device_name}")
            print_info(f"GPU Memory: {device_memory:.2f} GB")
            return True
        else:
            print_warning("CUDA Not Available - Will install CPU version")
            return False
    except ImportError:
        print_warning("PyTorch not installed yet - Proceeding with installation")
        return None

def install_cpu_packages():
    """Install packages for CPU-only execution"""
    print_header("Installing CPU Packages")
    
    packages = [
        "ultralytics>=8.0.0",
        "opencv-python>=4.8.0",
        "Pillow>=10.0.0",
        "numpy>=1.24.0",
        "pyyaml>=6.0"
    ]
    
    # Install CPU-only PyTorch
    print_info("Installing PyTorch for CPU...")
    pytorch_cmd = [
        sys.executable, "-m", "pip", "install",
        "torch>=2.0.0",
        "torchvision>=0.15.0"
    ]
    
    try:
        subprocess.run(pytorch_cmd, check=True)
        print_success("PyTorch installed successfully")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to install PyTorch: {e}")
        return False
    
    # Install other packages
    print_info("Installing other required packages...")
    for package in packages:
        print_info(f"Installing {package}...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", package], 
                         check=True, capture_output=True)
            print_success(f"Installed {package}")
        except subprocess.CalledProcessError as e:
            print_error(f"Failed to install {package}: {e}")
            return False
    
    return True

def install_gpu_packages():
    """Install packages with GPU support (CUDA 13.0+)"""
    print_header("Installing GPU Packages (CUDA 13.0+)")
    
    packages = [
        "ultralytics>=8.0.0",
        "opencv-python>=4.8.0",
        "Pillow>=10.0.0",
        "numpy>=1.24.0",
        "pyyaml>=6.0"
    ]
    
    # Install GPU-enabled PyTorch
    print_info("Installing PyTorch for GPU (CUDA 13.0)...")
    pytorch_cmd = [
        sys.executable, "-m", "pip", "install",
        "torch>=2.0.0", "torchvision>=0.15.0",
        "--index-url", "https://download.pytorch.org/whl/cu130"
    ]
    
    try:
        subprocess.run(pytorch_cmd, check=True)
        print_success("PyTorch with GPU support installed successfully")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to install PyTorch: {e}")
        return False
    
    # Install other packages
    print_info("Installing other required packages...")
    for package in packages:
        print_info(f"Installing {package}...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", package], 
                         check=True, capture_output=True)
            print_success(f"Installed {package}")
        except subprocess.CalledProcessError as e:
            print_error(f"Failed to install {package}: {e}")
            return False
    
    return True

def verify_installation():
    """Verify all packages are installed correctly"""
    print_header("Verifying Installation")
    
    packages = {
        'ultralytics': 'YOLO Framework',
        'cv2': 'OpenCV',
        'PIL': 'Pillow',
        'numpy': 'NumPy',
        'torch': 'PyTorch'
    }
    
    all_ok = True
    for package, name in packages.items():
        try:
            __import__(package)
            print_success(f"{name}: Installed")
        except ImportError:
            print_error(f"{name}: NOT installed")
            all_ok = False
    
    return all_ok

def main():
    """Main installation flow"""
    print_header("YOLO Detection Setup - Installation Script")
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Check pip
    if not check_pip():
        sys.exit(1)
    
    # Check CUDA and decide on installation type
    cuda_available = check_cuda_availability()
    
    if cuda_available is None:
        # First time - ask user
        print_header("Installation Options")
        print("1. CPU-only (slower, works everywhere)")
        print("2. GPU with CUDA 13.0+ (faster, NVIDIA GPU required)")
        print()
        choice = input("Select installation type (1 or 2): ").strip()
        
        if choice == "2":
            use_gpu = True
        else:
            use_gpu = False
    else:
        use_gpu = cuda_available
    
    # Install packages
    if use_gpu:
        print_info("Installing for GPU (CUDA 13.0+)...")
        success = install_gpu_packages()
    else:
        print_info("Installing for CPU...")
        success = install_cpu_packages()
    
    if not success:
        print_error("Installation failed!")
        sys.exit(1)
    
    # Verify installation
    if verify_installation():
        print_header("✅ Installation Complete!")
        print_success("All packages installed successfully!")
        print()
        print_info("Next steps:")
        print_info("1. Verify setup: python verify_setup.py")
        print_info("2. Start the server: pnpm run dev")
        print_info("3. Test the API: curl http://localhost:3000/api/yolo/health")
    else:
        print_error("Verification failed! Some packages are missing.")
        sys.exit(1)

if __name__ == "__main__":
    main()
