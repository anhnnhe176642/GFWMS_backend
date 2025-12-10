import { roleRepository } from '../repositories/role.repository.js';
import { NotFoundError } from '../utils/errors.js';
import { ConflictError } from '../utils/errors.js';
import uniDecoder from 'unidecode';

export const getAllRoles = async () => {
  return await roleRepository.findAll();
};

export const createRole = async (roleData) => {
  return await roleRepository.create(roleData);
};

export const getRoleByName = async (name) => {
  const role = await roleRepository.findByName(name);
  if (!role) {
    throw new NotFoundError('Role không tồn tại');
  }
  return role;
};

export const deleteRole = async (name) => {
  const existingRole = await roleRepository.findByName(name);
  if (!existingRole) {
    throw new NotFoundError('Role không tồn tại');
  }
  
  const userCount = await roleRepository.countUsersWithRole(name);
  if (userCount > 0) {
    throw new ConflictError(`Không thể xóa role vì có ${userCount} user đang sử dụng`);
  }

  return await roleRepository.delete(name);
};

export const updateRole = async (name, roleData) => {
  const existingRole = await roleRepository.findByName(name);
  if (!existingRole) {
    throw new NotFoundError('Role không tồn tại');
  }
  
  return await roleRepository.update(name, roleData);
};

export const getAllRolesAdvanced = async (queryOptions) => {
  return await roleRepository.findWithAdvancedQuery(queryOptions);
};

/**
 * Generate unique role name based on input
 * Takes first character of each word, removes accents, creates abbreviation
 * @param {string} input - Input string in Vietnamese (e.g., "Nhân Viên Kho Đ")
 * @returns {Promise<{name: string, suggestion: string}>} - Generated unique name
 */
export const generateUniqueName = async (input) => {
  if (!input || typeof input !== 'string') {
    throw new Error('Input phải là một chuỗi không rỗng');
  }

  // Remove leading/trailing spaces
  const trimmedInput = input.trim();
  
  if (!trimmedInput) {
    throw new Error('Input không hợp lệ sau khi xử lý');
  }

  // Get first character of each word, remove accents using unidecode, convert to uppercase
  const baseName = trimmedInput
    .split(/\s+/) // Split by whitespace
    .filter(word => word.length > 0) // Remove empty strings
    .map(word => {
      // Remove accents using unidecode and take first character
      const unaccented = uniDecoder(word);
      return unaccented[0].toLowerCase();
    })
    .join('') // Join without separator
    .toUpperCase() // Convert to uppercase
    .substring(0, 10); // Truncate to max 10 characters

  if (!baseName) {
    throw new Error('Input không hợp lệ sau khi xử lý');
  }

  let uniqueName = baseName;
  let counter = 1;

  // Check if name exists and generate unique name with counter
  while (await roleRepository.findByName(uniqueName)) {
    // Keep base name and append counter (e.g., "NVKD1", "NVKD2")
    const baseForCounter = baseName.substring(0, 10 - String(counter).length);
    uniqueName = `${baseForCounter}${counter}`;
    counter++;

    // Safety check to prevent infinite loop
    if (counter > 9999) {
      throw new Error('Không thể tạo tên duy nhất');
    }
  }

  return {
    suggestion: uniqueName,
    baseName: baseName
  };
};