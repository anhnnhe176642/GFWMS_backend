@echo off
REM YOLO Detection Setup - Batch Installation Script (Windows)
REM This script installs Python dependencies for YOLO detection

setlocal enabledelayedexpansion

REM Color codes (using findstr for colored output)
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RESET=[0m"

REM Check Python version
echo.
echo ========================================================================
echo              Checking Python Version
echo ========================================================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [91mX Python 3 is not installed[0m
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set "PYTHON_VERSION=%%i"
echo [92mO Python %PYTHON_VERSION% found[0m
echo.

REM Check pip
echo ========================================================================
echo              Checking pip Installation
echo ========================================================================
echo.

python -m pip --version >nul 2>&1
if errorlevel 1 (
    echo [91mX pip is not installed[0m
    exit /b 1
)

for /f "tokens=*" %%i in ('python -m pip --version 2^>^&1') do echo %%i
echo.

REM Ask user for installation type
echo ========================================================================
echo              Installation Options
echo ========================================================================
echo.
echo 1. CPU-only (slower, works everywhere)
echo 2. GPU with CUDA 13.0+ (faster, NVIDIA GPU required)
echo.

set /p choice="Select installation type (1 or 2): "

if "%choice%"=="2" (
    set "USE_GPU=true"
) else (
    set "USE_GPU=false"
)

REM Install PyTorch
echo.
echo ========================================================================
echo              Installing Packages
echo ========================================================================
echo.

if "%USE_GPU%"=="true" (
    echo [94mI Installing PyTorch for GPU (CUDA 13.0)...[0m
    python -m pip install --index-url https://download.pytorch.org/whl/cu130 "torch>=2.0.0" "torchvision>=0.15.0"
    if errorlevel 1 (
        echo [91mX Failed to install PyTorch[0m
        exit /b 1
    )
    echo [92mO PyTorch with GPU support installed[0m
) else (
    echo [94mI Installing PyTorch for CPU...[0m
    python -m pip install "torch>=2.0.0" "torchvision>=0.15.0"
    if errorlevel 1 (
        echo [91mX Failed to install PyTorch[0m
        exit /b 1
    )
    echo [92mO PyTorch installed[0m
)

REM Install other packages
echo [94mI Installing other required packages...[0m

python -m pip install ^
    "ultralytics>=8.0.0" ^
    "opencv-python>=4.8.0" ^
    "Pillow>=10.0.0" ^
    "numpy>=1.24.0" ^
    "pyyaml>=6.0"

if errorlevel 1 (
    echo [91mX Failed to install packages[0m
    exit /b 1
)

echo [92mO All packages installed[0m
echo.

REM Verify installation
echo ========================================================================
echo              Verifying Installation
echo ========================================================================
echo.

python -c "import ultralytics" >nul 2>&1
if errorlevel 1 (
    echo [91mX YOLO Framework: NOT installed[0m
    exit /b 1
) else (
    echo [92mO YOLO Framework: Installed[0m
)

python -c "import cv2" >nul 2>&1
if errorlevel 1 (
    echo [91mX OpenCV: NOT installed[0m
    exit /b 1
) else (
    echo [92mO OpenCV: Installed[0m
)

python -c "import PIL" >nul 2>&1
if errorlevel 1 (
    echo [91mX Pillow: NOT installed[0m
    exit /b 1
) else (
    echo [92mO Pillow: Installed[0m
)

python -c "import numpy" >nul 2>&1
if errorlevel 1 (
    echo [91mX NumPy: NOT installed[0m
    exit /b 1
) else (
    echo [92mO NumPy: Installed[0m
)

python -c "import torch" >nul 2>&1
if errorlevel 1 (
    echo [91mX PyTorch: NOT installed[0m
    exit /b 1
) else (
    echo [92mO PyTorch: Installed[0m
)

echo.
echo ========================================================================
echo                 ^! Installation Complete!
echo ========================================================================
echo.
echo [92mO All packages installed successfully![0m
echo.
echo [94mI Next steps:[0m
echo [94mI 1. Verify setup: python verify_setup.py[0m
echo [94mI 2. Start the server: pnpm run dev[0m
echo [94mI 3. Test the API: curl http://localhost:3000/api/yolo/health[0m
echo.

endlocal
