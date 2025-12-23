import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { AppError } from '../utils/errors.js';
import yoloModelRepository from '../repositories/yoloModel.repository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class YOLOService {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, '../python/yolo_detector.py');
    // Đường dẫn đến model - bạn sẽ đặt file .pt vào đây
    this.defaultModelPath = path.join(__dirname, '../python/models/best.pt');
    this.tempDir = path.join(process.cwd(), 'temp', 'uploads');
    this.pythonCommand = null; // Cache for available python command
  }

  /**
   * Get Python executable path
   * Priority: mise python (production/Railway) -> system python3/python (dev)
   * @returns {Promise<string>} - Path to Python executable
   */
  async getAvailablePythonCommand() {
    // Return cached result if already determined
    if (this.pythonCommand) {
      return this.pythonCommand;
    }

    // Try mise Python path first (production/Railway)
    const misePythonPath = '/mise/installs/python/3.11.14/bin/python3';
    try {
      await new Promise((resolve, reject) => {
        const python = spawn(misePythonPath, ['--version'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 5000
        });

        python.on('error', reject);
        python.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error('mise python not available'));
          }
        });
      });

      this.pythonCommand = misePythonPath;
      console.log(`Using mise Python: ${misePythonPath}`);
      return misePythonPath;
    } catch {
      // Fallback to system python3 (dev environment)
      try {
        await new Promise((resolve, reject) => {
          const python = spawn('python3', ['--version'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 5000
          });

          python.on('error', reject);
          python.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error('python3 not available'));
            }
          });
        });

        this.pythonCommand = 'python3';
        console.log('Using system python3 (dev environment)');
        return 'python3';
      } catch {
        // Final fallback to python
        try {
          await new Promise((resolve, reject) => {
            const python = spawn('python', ['--version'], {
              stdio: ['pipe', 'pipe', 'pipe'],
              timeout: 5000
            });

            python.on('error', reject);
            python.on('close', (code) => {
              if (code === 0) {
                resolve();
              } else {
                reject(new Error('python not available'));
              }
            });
          });

          this.pythonCommand = 'python';
          console.log('Using system python (dev environment)');
          return 'python';
        } catch {
          throw new AppError(
            'Python not found. Tried: mise Python, python3, python',
            500
          );
        }
      }
    }
  }

  /**
   * Initialize service - create temp directory if not exists
   */
  async initialize() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Save buffer to temporary file
   * @param {Buffer} buffer - Image buffer from multer
   * @param {string} originalName - Original filename
   * @returns {Promise<string>} - Path to saved file
   */
  async saveTemporaryFile(buffer, originalName) {
    await this.initialize();
    
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const filename = `yolo_${timestamp}${ext}`;
    const filePath = path.join(this.tempDir, filename);
    
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  /**
   * Delete temporary file
   * @param {string} filePath - Path to file to delete
   */
  async deleteTemporaryFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Failed to delete temporary file:', error);
    }
  }

  /**
   * Verify model file exists
   * @param {string} modelPath - Path to model file
   * @returns {Promise<boolean>}
   */
  async verifyModelExists(modelPath = null) {
    const pathToCheck = modelPath || this.defaultModelPath;
    try {
      await fs.access(pathToCheck);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Run YOLO detection on image
   * @param {string} imagePath - Path to image file
   * @param {Object} options - Detection options
   * @param {number} options.confidence - Confidence threshold (0-1)
   * @param {string} options.modelPath - Custom model path (optional)
   * @returns {Promise<Object>} - Detection results
   */
  async detectObjects(imagePath, options = {}) {

    const { confidence = 0.5, modelPath = null } = options;
    
    const modelToUse = modelPath || this.defaultModelPath;

    // Verify files exist
    try {
      await fs.access(imagePath);
    } catch {
      throw new AppError('Image file not found', 404);
    }

    const modelExists = await this.verifyModelExists(modelToUse);
    if (!modelExists) {
      throw new AppError(
        'YOLO model not found. Please place your trained model (.pt file) in src/python/models/best.pt',
        404
      );
    }

    // Get available Python command before creating Promise
    const pythonCmd = await this.getAvailablePythonCommand();

    return new Promise((resolve, reject) => {
      const pythonScript = path.join(this.pythonScriptPath);
      const args = [pythonScript, imagePath, modelToUse, confidence.toString()];

      const python = spawn(pythonCmd, args, {
        timeout: 300000, // 5 minutes
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('error', (err) => {
        reject(new AppError(`Failed to start Python process: ${err.message}`, 500));
      });

      python.on('close', (code) => {
        if (code !== 0) {
          return reject(new AppError(`Python script exited with code ${code}: ${stderr}`, 500));
        }

        try {
          // Filter out warnings and non-JSON output from stdout
          const lines = stdout.trim().split('\n');
          let jsonStr = '';
          
          for (const line of lines) {
            // Skip warning lines and other non-JSON output
            if (line.startsWith('{') || line.startsWith('[') || (jsonStr && line.trim())) {
              jsonStr += line;
            }
          }

          const result = JSON.parse(jsonStr);

          if (!result.success) {
            return reject(new AppError(`Detection error: ${result.error}`, 500));
          }

          resolve(result);
        } catch (parseErr) {
          return reject(new AppError(`Failed to parse detection results: ${parseErr.message}`, 500));
        }
      });
    });
  }

  /**
   * Get active model from database or use default
   * @returns {Promise<string>} - Path to active model
   */
  async getActiveModelPath() {
    try {
      const activeModel = await yoloModelRepository.getActiveModel();
      if (activeModel && activeModel.filePath) {
        const modelExists = await this.verifyModelExists(activeModel.filePath);
        if (modelExists) {
          return activeModel.filePath;
        }
      }
    } catch (error) {
      console.warn('Failed to get active model from DB, using default:', error.message);
    }
    return this.defaultModelPath;
  }

  /**
   * Detect objects from image buffer (from multer upload)
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} originalName - Original filename
   * @param {Object} options - Detection options
   * @returns {Promise<Object>} - Detection results
   */
  async detectFromBuffer(imageBuffer, originalName, options = {}) {
    let tempFilePath = null;

    try {
      // Save buffer to temp file
      tempFilePath = await this.saveTemporaryFile(imageBuffer, originalName);

      // Get model path (from options or active from DB)
      const modelPath = options.modelPath || await this.getActiveModelPath();

      // Run detection
      const start = process.hrtime.bigint();
      const result = await this.detectObjects(tempFilePath, { ...options, modelPath });
      const end = process.hrtime.bigint();
      const detectionTime = Number(end - start) / 1e6; // milliseconds

      // Clean up temp file
      await this.deleteTemporaryFile(tempFilePath);

      // Log detection if modelRepository is available
      try {
        const activeModel = await yoloModelRepository.getActiveModel();
        if (activeModel) {
          // Calculate average confidence from all detections
          let averageConfidence = 0;
          if (result.detections && result.detections.length > 0) {
            const totalConfidence = result.detections.reduce((sum, detection) => sum + detection.confidence, 0);
            averageConfidence = totalConfidence / result.detections.length;
          }

          await yoloModelRepository.logDetection({
            modelId: activeModel.id,
            imagePath: originalName,
            totalObjects: result.total_objects,
            confidence: averageConfidence,
            detectionTime: detectionTime
          });
        }
      } catch (logError) {
        console.warn('Failed to log detection:', logError.message);
      }

      return result;
    } catch (error) {
      // Clean up temp file on error
      if (tempFilePath) {
        await this.deleteTemporaryFile(tempFilePath);
      }
      throw error;
    }
  }

  /**
   * Get available model classes
   * @param {string} modelPath - Path to model (optional)
   * @returns {Promise<Object>} - Model information
   */
  async getModelInfo(modelPath = null) {
    const modelToUse = modelPath || this.defaultModelPath;
    
    const modelExists = await this.verifyModelExists(modelToUse);
    if (!modelExists) {
      throw new AppError('Model file not found', 404);
    }

    return {
      model_path: modelToUse,
      exists: true,
      name: path.basename(modelToUse)
    };
  }
}

// Export singleton instance
export default new YOLOService();
