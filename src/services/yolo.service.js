import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { AppError } from '../utils/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class YOLOService {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, '../python/yolo_detector.py');
    // Đường dẫn đến model - bạn sẽ đặt file .pt vào đây
    this.defaultModelPath = path.join(__dirname, '../python/models/best.pt');
    this.tempDir = path.join(process.cwd(), 'temp', 'uploads');
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

    return new Promise((resolve, reject) => {
      const pythonScript = path.join(this.pythonScriptPath);
      const args = [pythonScript, imagePath, modelToUse, confidence.toString()];

      const python = spawn('python', args, {
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
          const result = JSON.parse(stdout.trim());

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

      // Run detection
      const result = await this.detectObjects(tempFilePath, options);

      // Clean up temp file
      await this.deleteTemporaryFile(tempFilePath);

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
