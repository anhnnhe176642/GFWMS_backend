#!/usr/bin/env python3
"""
YOLO Model Trainer
Trains or fine-tunes YOLO models on custom datasets
Supports transfer learning from existing weights
"""

import sys
import json
import os
import shutil
from pathlib import Path
from datetime import datetime
from ultralytics import YOLO
import torch


class YOLOTrainer:
    """YOLO model training manager"""
    
    def __init__(self):
        self.script_dir = Path(__file__).parent
        self.models_dir = self.script_dir / "models"
        self.runs_dir = self.script_dir / "runs"
        
    def train(self, data_yaml, base_model="best.pt", epochs=100, batch_size=16, 
              imgsz=640, device=None, patience=50, project=None, name=None):
        """
        Train YOLO model
        
        Args:
            data_yaml: Path to data.yaml configuration file
            base_model: Model to train from (path to .pt file or model name)
            epochs: Number of training epochs
            batch_size: Batch size for training
            imgsz: Image size for training
            device: Device to use (None=auto, 0=GPU, 'cpu'=CPU)
            patience: Early stopping patience
            project: Project directory for saving runs
            name: Run name
            
        Returns:
            dict: Training results
        """
        try:
            # Determine device
            if device is None:
                device = 0 if torch.cuda.is_available() else 'cpu'
                print(f"DEBUG: Device auto-selected: {device}, CUDA available: {torch.cuda.is_available()}")
            else:
                print(f"DEBUG: Device specified: {device}")
            
            # Setup paths
            if project is None:
                project = str(self.runs_dir / "train")
            
            if name is None:
                name = f"exp_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Resolve base model path
            if not os.path.isabs(base_model):
                # Check in models directory first
                model_path = self.models_dir / base_model
                if not model_path.exists():
                    # Use as-is (might be ultralytics model name like 'yolo11s.pt')
                    model_path = base_model
                base_model = str(model_path)
            
            # Verify data.yaml exists
            if not os.path.exists(data_yaml):
                raise FileNotFoundError(f"Data configuration not found: {data_yaml}")
            
            # Load model
            model = YOLO(base_model)
            
            # Train
            results = model.train(
                data=data_yaml,
                epochs=epochs,
                batch=batch_size,
                imgsz=imgsz,
                device=device,
                patience=patience,
                project=project,
                name=name,
                verbose=True,
                save=True,
                plots=True
            )
            
            # Get best model path
            run_dir = Path(project) / name
            best_model = run_dir / "weights" / "best.pt"
            last_model = run_dir / "weights" / "last.pt"
            
            # Validate model
            val_results = model.val()
            
            # Auto-update best.pt in models directory
            best_model_backup = self.models_dir / "best.pt"
            if best_model.exists():
                shutil.copy2(str(best_model), str(best_model_backup))
                print(f"✓ Auto-updated: {best_model_backup}")
            
            response = {
                'success': True,
                'training_completed': True,
                'run_directory': str(run_dir),
                'models': {
                    'best': str(best_model) if best_model.exists() else None,
                    'last': str(last_model) if last_model.exists() else None,
                    'best_backup': str(best_model_backup) if best_model_backup.exists() else None
                },
                'metrics': {
                    'map50': float(val_results.results_dict.get('metrics/mAP50(B)', 0)),
                    'map50_95': float(val_results.results_dict.get('metrics/mAP50-95(B)', 0)),
                    'precision': float(val_results.results_dict.get('metrics/precision(B)', 0)),
                    'recall': float(val_results.results_dict.get('metrics/recall(B)', 0))
                },
                'training_info': {
                    'base_model': base_model,
                    'epochs': epochs,
                    'batch_size': batch_size,
                    'image_size': imgsz,
                    'device_used': 'GPU (CUDA)' if device == 0 else 'CPU',
                    'data_config': data_yaml
                }
            }
            
            return response
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'error_type': type(e).__name__
            }
    
    def resume_training(self, run_path, epochs=None):
        """
        Resume training from a previous run
        
        Args:
            run_path: Path to previous run directory
            epochs: Additional epochs to train (if None, uses original setting)
            
        Returns:
            dict: Training results
        """
        try:
            run_dir = Path(run_path)
            last_model = run_dir / "weights" / "last.pt"
            
            if not last_model.exists():
                raise FileNotFoundError(f"Cannot resume: {last_model} not found")
            
            model = YOLO(str(last_model))
            
            # Resume training
            kwargs = {'resume': True}
            if epochs is not None:
                kwargs['epochs'] = epochs
            
            results = model.train(**kwargs)
            
            return {
                'success': True,
                'resumed': True,
                'run_directory': str(run_dir)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'error_type': type(e).__name__
            }
    
    def export_model(self, model_path, format='onnx'):
        """
        Export trained model to different formats
        
        Args:
            model_path: Path to .pt model file
            format: Export format (onnx, torchscript, coreml, etc.)
            
        Returns:
            dict: Export results
        """
        try:
            model = YOLO(model_path)
            export_path = model.export(format=format)
            
            return {
                'success': True,
                'exported_path': str(export_path),
                'format': format
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'error_type': type(e).__name__
            }


def main():
    """Main entry point for CLI usage"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python yolo_trainer.py <command> [args...]\n'
                    'Commands:\n'
                    '  train <data_yaml> <base_model> [epochs] [batch_size] [imgsz]\n'
                    '  resume <run_path> [epochs]\n'
                    '  export <model_path> [format]'
        }))
        sys.exit(1)
    
    command = sys.argv[1]
    trainer = YOLOTrainer()
    
    try:
        if command == 'train':
            data_yaml = sys.argv[2]
            base_model = sys.argv[3] if len(sys.argv) > 3 else "best.pt"
            epochs = int(sys.argv[4]) if len(sys.argv) > 4 else 100
            batch_size = int(sys.argv[5]) if len(sys.argv) > 5 else 16
            imgsz = int(sys.argv[6]) if len(sys.argv) > 6 else 640
            
            result = trainer.train(
                data_yaml=data_yaml,
                base_model=base_model,
                epochs=epochs,
                batch_size=batch_size,
                imgsz=imgsz
            )
            print(json.dumps(result, indent=2))
            
        elif command == 'resume':
            run_path = sys.argv[2]
            epochs = int(sys.argv[3]) if len(sys.argv) > 3 else None
            
            result = trainer.resume_training(run_path, epochs)
            print(json.dumps(result, indent=2))
            
        elif command == 'export':
            model_path = sys.argv[2]
            export_format = sys.argv[3] if len(sys.argv) > 3 else 'onnx'
            
            result = trainer.export_model(model_path, export_format)
            print(json.dumps(result, indent=2))
            
        else:
            print(json.dumps({
                'success': False,
                'error': f'Unknown command: {command}'
            }))
            sys.exit(1)
            
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()

