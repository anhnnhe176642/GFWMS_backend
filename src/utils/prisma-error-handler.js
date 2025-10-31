import { ConflictError, NotFoundError, ValidationError, InternalServerError } from './errors.js';
import { Prisma } from '@prisma/client';

/**
 * Lấy primary key field names từ model
 * @param {Object} model - Prisma DMMF model
 * @returns {string} - Field name hoặc composite field names
 */
const getPrimaryKeyFields = (model) => {
  // Ưu tiên lấy từ primaryKey
  if (model.primaryKey?.fields) {
    return model.primaryKey.fields.length === 1
      ? model.primaryKey.fields[0]
      : model.primaryKey.fields.join('_');
  }
  
  // Fallback: tìm field có isId = true
  const idField = model.fields.find(field => field.isId);
  return idField?.name || 'id';
};

/**
 * Kiểm tra constraint có khớp với unique field pattern không
 * @param {string} constraintName - Constraint name từ error
 * @param {string} modelName - Model name
 * @param {string} tableName - Table name (có thể khác model name nếu có @@map)
 * @param {string} fieldName - Field name
 * @returns {boolean}
 */
const matchesUniqueConstraint = (constraintName, modelName, tableName, fieldName) => {
  return constraintName === `${modelName}_${fieldName}_key` ||
         constraintName === `${tableName}_${fieldName}_key`;
};

/**
 * Extract field name from Prisma constraint name using DMMF
 * @param {string} constraintName - Constraint name like "User_email_key" or "PRIMARY"
 * @param {string} modelName - Model name from error.meta (required)
 * @returns {string} - Field name like "email" or "id"
 */
const extractFieldFromConstraint = (constraintName, modelName) => {
  if (typeof constraintName !== 'string' || !modelName) {
    return constraintName;
  }
  
  try {
    const dmmf = Prisma.dmmf;
    const model = dmmf.datamodel.models.find(m => m.name === modelName);
    
    if (!model) {
      console.warn(`Model "${modelName}" not found in DMMF`);
      return constraintName;
    }
    
    // 1. Xử lý PRIMARY KEY constraint (MySQL)
    if (constraintName === 'PRIMARY') {
      return getPrimaryKeyFields(model);
    }
    
    // 2. Kiểm tra primary key với tên cụ thể (@@id([name: "custom_pk"]))
    if (model.primaryKey?.name === constraintName) {
      return getPrimaryKeyFields(model);
    }
    
    // 3. Kiểm tra composite unique constraints (@@unique)
    if (model.uniqueIndexes) {
      const uniqueIndex = model.uniqueIndexes.find(idx => idx.name === constraintName);
      if (uniqueIndex) {
        return uniqueIndex.fields.length === 1
          ? uniqueIndex.fields[0]
          : uniqueIndex.fields.join('_');
      }
    }
    
    // 4. Kiểm tra single field unique constraints (@unique)
    const tableName = model.dbName || model.name;
    const uniqueField = model.fields.find(field => 
      field.isUnique && matchesUniqueConstraint(constraintName, model.name, tableName, field.name)
    );
    
    if (uniqueField) {
      return uniqueField.name;
    }
    
  } catch (error) {
    console.warn('Could not extract field from constraint using DMMF:', error);
  }
  
  return constraintName;
};

/**
 * Xử lý lỗi Prisma và convert thành custom errors
 * @param {Error} error - Prisma error
 * @param {Object} fieldMappings - Mapping các field để custom message
 * @throws {AppError} - Custom error với status code phù hợp
 */
export const handlePrismaError = (error, fieldMappings = {}) => {
  // Nếu không phải lỗi Prisma, throw lại error gốc
  if (!error.code) {
    throw error;
  }

  switch (error.code) {
    case 'P2002': {
      // Unique constraint violation
      const target = error.meta?.target;
      const modelName = error.meta?.modelName || error.meta?.model_name;
      console.log('P2002 Error Meta:', JSON.stringify(error.meta, null, 2));
      const targetFields = Array.isArray(target) ? target : [target];
      
      for (const constraintName of targetFields) {
        // Thử match với constraint name trước
        if (fieldMappings[constraintName]) {
          throw new ConflictError(fieldMappings[constraintName]);
        }
        
        // Nếu không có, thử extract field name và match
        const fieldName = extractFieldFromConstraint(constraintName, modelName);
        if (fieldMappings[fieldName]) {
          throw new ConflictError(fieldMappings[fieldName], fieldName);
        }
      }
      
      // Default message nếu không có mapping
      const fieldName = extractFieldFromConstraint(targetFields[0], modelName) || 'dữ liệu';
      throw new ConflictError(`${fieldName} đã tồn tại`, fieldName);
    }
    
    case 'P2025': {
      // Record not found during update/delete
      const modelName = error.meta?.modelName || 'Bản ghi';
      throw new NotFoundError(`${modelName} không tồn tại`);
    }
    
    case 'P2003': {
      // Foreign key constraint failed (có 2 trường hợp)
      console.log('P2003 Error Meta:', JSON.stringify(error.meta, null, 2));
      console.log('P2003 Error Message:', error.message);
      
      let fieldName = 'Tham chiếu';
      
      if (error.meta?.field_name) {
        // Nếu field_name là array, lấy phần tử đầu tiên
        fieldName = Array.isArray(error.meta.field_name) 
          ? error.meta.field_name[0] 
          : error.meta.field_name;
      } else if (error.meta?.constraint) {
        // constraint có thể là array hoặc string
        const constraintValue = Array.isArray(error.meta.constraint)
          ? error.meta.constraint[0]
          : error.meta.constraint;
        
        // Extract field name từ constraint
        fieldName = extractFieldFromConstraint(constraintValue) || constraintValue;
      }
      
      // Phân biệt 2 trường hợp dựa vào message
      const errorMessage = error.message || '';
      
      // Trường hợp 1: Xóa khi có bản ghi tham chiếu (delete operation)
      if (errorMessage.includes('delete')) {
        
        // Kiểm tra fieldMappings trước
        const customMessage = fieldMappings[fieldName];
        if (customMessage) {
          throw new ConflictError(customMessage, fieldName);
        }
        
        const modelName = error.meta?.modelName || 'Bản ghi';
        throw new ConflictError(
          `Không thể xóa ${modelName} vì có dữ liệu khác đang tham chiếu đến bản ghi này`,
          fieldName
        );
      }
      
      // Trường hợp 2: Tạo/cập nhật với khóa ngoại không hợp lệ
      const customMessage = fieldMappings[fieldName];
      if (customMessage) {
        throw new ConflictError(customMessage, fieldName);
      }
      
      throw new ConflictError(`${fieldName} không hợp lệ hoặc không tồn tại`, fieldName);
    }
    
    case 'P2023': {
      // Inconsistent column data
      throw new ValidationError('Dữ liệu cột không nhất quán');
    }
    
    case 'P2010': {
      // Raw query failed
      throw new InternalServerError('Truy vấn thô thất bại');
    }
    
    case 'P2011': {
      // Null constraint violation
      const target = error.meta?.constraint || error.meta?.column || 'Trường';
      throw new ValidationError(`${target} không được để trống`);
    }
    
    case 'P2015': {
      // Related record not found
      throw new NotFoundError('Bản ghi liên quan không tồn tại');
    }
    
    case 'P2018': {
      // Required connected records not found
      throw new NotFoundError('Không tìm thấy bản ghi được yêu cầu kết nối');
    }
    
    case 'P2017': {
      // Records for relation between models not connected (xóa khi có khóa ngoại tham chiếu)
      const relationName = error.meta?.relation_name || 'bản ghi';
      throw new ConflictError(
        `Không thể xóa vì có ${relationName} đang tham chiếu đến bản ghi này`,
        relationName
      );
    }
    
    case 'P2014': {
      // Required relation violation
      const relationName = error.meta?.relation_name || 'Quan hệ';
      throw new ValidationError(`${relationName} là bắt buộc`);
    }
    
    case 'P2016': {
      // Query interpretation error
      throw new ValidationError('Truy vấn không hợp lệ');
    }
    
    case 'P2021': {
      // Table does not exist
      throw new InternalServerError('Lỗi cấu trúc cơ sở dữ liệu');
    }
    
    case 'P2022': {
      // Column does not exist
      throw new InternalServerError('Lỗi cấu trúc cơ sở dữ liệu');
    }
    
    default: {
      // Các lỗi Prisma khác
      console.error('Unhandled Prisma error:', error);
      throw new InternalServerError('Lỗi cơ sở dữ liệu');
    }
  }
};

/**
 * Wrapper function cho các operation Prisma
 * @param {Function} operation - Prisma operation
 * @param {Object} fieldMappings - Field mappings cho error messages
 * @returns {Promise} - Result của operation
 */
export const withPrismaErrorHandling = async (operation, fieldMappings = {}) => {
  try {
    return await operation();
  } catch (error) {
    handlePrismaError(error, fieldMappings);
  }
};