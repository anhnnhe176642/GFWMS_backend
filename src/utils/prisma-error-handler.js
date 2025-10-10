import { ConflictError, NotFoundError, ValidationError, InternalServerError } from './errors.js';
import { Prisma } from '@prisma/client';

/**
 * Extract field name from Prisma constraint name using DMMF
 * @param {string} constraintName - Constraint name like "User_email_key"
 * @returns {string} - Field name like "email"
 */
const extractFieldFromConstraint = (constraintName) => {
  if (typeof constraintName !== 'string') return constraintName;
  
  try {
    // Lấy DMMF từ Prisma 
    const dmmf = Prisma.dmmf;
    
    // Duyệt qua tất cả models
    for (const model of dmmf.datamodel.models) {
      // 1. Kiểm tra single field unique constraints (@unique)
      for (const field of model.fields) {
        if (field.isUnique) {
          const expectedConstraintName = `${model.name}_${field.name}_key`;
          if (expectedConstraintName === constraintName) {
            return field.name;
          }
        }
      }
      
      // 2. Kiểm tra composite unique constraints (@@unique)
      if (model.uniqueIndexes) {
        for (const uniqueIndex of model.uniqueIndexes) {
          if (uniqueIndex.name === constraintName) {
            return uniqueIndex.fields.length === 1 
              ? uniqueIndex.fields[0] 
              : uniqueIndex.fields.join('_');
          }
        }
      }
      
      // 3. Kiểm tra primary key constraints (@@id)
      if (model.primaryKey && model.primaryKey.name === constraintName) {
        return model.primaryKey.fields.length === 1
          ? model.primaryKey.fields[0]
          : model.primaryKey.fields.join('_');
      }
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
      
      const targetFields = Array.isArray(target) ? target : [target];
      
      for (const constraintName of targetFields) {
        // Thử match với constraint name trước
        if (fieldMappings[constraintName]) {
          throw new ConflictError(fieldMappings[constraintName]);
        }
        
        // Nếu không có, thử extract field name và match
        const fieldName = extractFieldFromConstraint(constraintName);
        if (fieldMappings[fieldName]) {
          throw new ConflictError(fieldMappings[fieldName], fieldName);
        }
      }
      
      // Default message nếu không có mapping
      const fieldName = extractFieldFromConstraint(targetFields[0]) || 'dữ liệu';
      throw new ConflictError(`${fieldName} đã tồn tại`, fieldName);
    }
    
    case 'P2025': {
      // Record not found during update/delete
      const modelName = error.meta?.modelName || 'Bản ghi';
      throw new NotFoundError(`${modelName} không tồn tại`);
    }
    
    case 'P2003': {
      // Foreign key constraint failed
      console.log('P2003 Error Meta:', JSON.stringify(error.meta, null, 2));
      
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
      
      // Kiểm tra fieldMappings để custom message
      const customMessage = fieldMappings[fieldName];
      if (customMessage) {
        throw new ConflictError(customMessage, fieldName);
      }
      
      throw new ConflictError(`${fieldName} không hợp lệ hoặc không tồn tại`, fieldName);
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