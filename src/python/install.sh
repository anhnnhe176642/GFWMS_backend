#!/bin/bash
# YOLO Detection Setup - Bash Installation Script (Linux/macOS)
# This script installs Python dependencies for YOLO detection

set -e

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}========================================================================${NC}"
    printf "${BLUE}%*s${NC}\n" $(((${#1}+70)/2)) "$1"
    echo -e "${BLUE}========================================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check Python version
check_python_version() {
    print_header "Checking Python Version"
    
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed"
        return 1
    fi
    
    local version=$(python3 --version 2>&1 | awk '{print $2}')
    print_success "Python $version found"
    return 0
}

# Check pip
check_pip() {
    print_header "Checking pip Installation"
    
    if ! python3 -m pip --version &> /dev/null; then
        print_error "pip is not installed"
        return 1
    fi
    
    python3 -m pip --version
    return 0
}

# Check CUDA
check_cuda() {
    print_header "Checking CUDA Availability"
    
    if command -v nvidia-smi &> /dev/null; then
        print_success "NVIDIA GPU detected"
        nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
        return 0
    else
        print_warning "NVIDIA GPU not detected - CPU installation will be used"
        return 1
    fi
}

# Install CPU packages
install_cpu_packages() {
    print_header "Installing CPU Packages"
    
    print_info "Installing PyTorch for CPU..."
    python3 -m pip install --upgrade pip
    python3 -m pip install "torch>=2.0.0" "torchvision>=0.15.0"
    print_success "PyTorch installed"
    
    print_info "Installing other required packages..."
    python3 -m pip install \
        "ultralytics>=8.0.0" \
        "opencv-python>=4.8.0" \
        "Pillow>=10.0.0" \
        "numpy>=1.24.0" \
        "pyyaml>=6.0"
    
    print_success "All packages installed"
    return 0
}

# Install GPU packages
install_gpu_packages() {
    print_header "Installing GPU Packages (CUDA 13.0+)"
    
    print_info "Installing PyTorch for GPU (CUDA 13.0)..."
    python3 -m pip install --upgrade pip
    python3 -m pip install --index-url https://download.pytorch.org/whl/cu130 \
        "torch>=2.0.0" \
        "torchvision>=0.15.0"
    print_success "PyTorch with GPU support installed"
    
    print_info "Installing other required packages..."
    python3 -m pip install \
        "ultralytics>=8.0.0" \
        "opencv-python>=4.8.0" \
        "Pillow>=10.0.0" \
        "numpy>=1.24.0" \
        "pyyaml>=6.0"
    
    print_success "All packages installed"
    return 0
}

# Verify installation
verify_installation() {
    print_header "Verifying Installation"
    
    local all_ok=true
    
    if python3 -c "import ultralytics" 2>/dev/null; then
        print_success "YOLO Framework: Installed"
    else
        print_error "YOLO Framework: NOT installed"
        all_ok=false
    fi
    
    if python3 -c "import cv2" 2>/dev/null; then
        print_success "OpenCV: Installed"
    else
        print_error "OpenCV: NOT installed"
        all_ok=false
    fi
    
    if python3 -c "import PIL" 2>/dev/null; then
        print_success "Pillow: Installed"
    else
        print_error "Pillow: NOT installed"
        all_ok=false
    fi
    
    if python3 -c "import numpy" 2>/dev/null; then
        print_success "NumPy: Installed"
    else
        print_error "NumPy: NOT installed"
        all_ok=false
    fi
    
    if python3 -c "import torch" 2>/dev/null; then
        print_success "PyTorch: Installed"
    else
        print_error "PyTorch: NOT installed"
        all_ok=false
    fi
    
    if [ "$all_ok" = true ]; then
        return 0
    else
        return 1
    fi
}

# Main flow
main() {
    print_header "YOLO Detection Setup - Installation Script"
    
    # Check Python
    if ! check_python_version; then
        exit 1
    fi
    
    # Check pip
    if ! check_pip; then
        exit 1
    fi
    
    # Check CUDA and decide installation type
    if check_cuda; then
        use_gpu=true
    else
        use_gpu=false
        # Ask user for preference
        print_header "Installation Options"
        echo "1. CPU-only (slower, works everywhere)"
        echo "2. GPU with CUDA 13.0+ (faster, NVIDIA GPU required)"
        echo ""
        read -p "Select installation type (1 or 2): " choice
        
        if [ "$choice" = "2" ]; then
            use_gpu=true
        fi
    fi
    
    # Install packages
    if [ "$use_gpu" = true ]; then
        print_info "Installing for GPU (CUDA 13.0+)..."
        if ! install_gpu_packages; then
            exit 1
        fi
    else
        print_info "Installing for CPU..."
        if ! install_cpu_packages; then
            exit 1
        fi
    fi
    
    # Verify
    if verify_installation; then
        print_header "✅ Installation Complete!"
        print_success "All packages installed successfully!"
        echo ""
        print_info "Next steps:"
        print_info "1. Verify setup: python3 verify_setup.py"
        print_info "2. Start the server: pnpm run dev"
        print_info "3. Test the API: curl http://localhost:3000/api/yolo/health"
    else
        print_error "Verification failed! Some packages are missing."
        exit 1
    fi
}

main
