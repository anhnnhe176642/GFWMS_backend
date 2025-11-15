import { PrismaClient } from '@prisma/client';
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

class YoloModelRepository {
  #selectOptions = {
    id: true,
    name: true,
    fileName: true,
    filePath: true,
    description: true,
    isActive: true,
    version: true,
    status: true,
    metadata: true,
    createdAt: true,
    updatedAt: true
  };

  /**
   * Create new YOLO model record
   */
  async create(data) {
    return prisma.yoloModel.create({
      data,
      select: this.#selectOptions
    });
  }

  /**
   * Find model by ID
   */
  async findById(id) {
    return prisma.yoloModel.findUnique({
      where: { id },
      select: this.#selectOptions
    });
  }

  /**
   * Find model by name
   */
  async findByName(name) {
    return prisma.yoloModel.findUnique({
      where: { name },
      select: this.#selectOptions
    });
  }

  /**
   * Get active model (only one should be active)
   */
  async getActiveModel() {
    return prisma.yoloModel.findFirst({
      where: { 
        isActive: true,
        status: 'ACTIVE'
      },
      select: this.#selectOptions
    });
  }

  /**
   * Get all models with pagination
   */
  async findAll(filters = {}) {
    const { status = 'ACTIVE', skip = 0, take = 10 } = filters;

    const where = {
      ...(status && { status })
    };

    const [data, total] = await Promise.all([
      prisma.yoloModel.findMany({
        where,
        select: this.#selectOptions,
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.yoloModel.count({ where })
    ]);

    return { data, total, skip, take };
  }

  /**
   * Find with advanced query (with filters, search, sort, pagination)
   */
  async findWithAdvancedQuery(queryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      filters = {}
    } = queryOptions;

    // Build where clause with search and filters
    const searchableFields = ['name', 'description'];
    const filterWhere = buildWhereClause(
      { search, ...filters },
      searchableFields
    );

    const where = filterWhere;

    // Build pagination
    const { skip, take } = buildPagination(page, limit);

    // Build sort
    const orderBy = buildSort(sortBy, order);

    // Execute queries
    const [data, total] = await Promise.all([
      prisma.yoloModel.findMany({
        where,
        skip,
        take,
        select: this.#selectOptions,
        orderBy
      }),
      prisma.yoloModel.count({ where })
    ]);

    return formatPaginatedResponse(data, total, page, take);
  }

  /**
   * Update model
   */
  async update(id, data) {
    return prisma.yoloModel.update({
      where: { id },
      data,
      select: this.#selectOptions
    });
  }

  /**
   * Set active model (deactivate others)
   */
  async setActiveModel(modelId) {
    // Deactivate all models
    await prisma.yoloModel.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Activate the selected model
    return prisma.yoloModel.update({
      where: { id: modelId },
      data: { isActive: true },
      select: this.#selectOptions
    });
  }

  /**
   * Soft delete model
   */
  async delete(id) {
    return prisma.yoloModel.delete({
      where: { id },
      select: this.#selectOptions
    });
  }

  /**
   * Log detection
   */
  async logDetection(data) {
    return prisma.yoloDetectionLog.create({
      data
    });
  }

  /**
   * Get detection logs with pagination
   */
  async getDetectionLogs(filters = {}) {
    const { modelId, page = 1, limit = 20 } = filters;

    const where = {
      ...(modelId && { modelId })
    };

    // Build pagination
    const { skip, take } = buildPagination(page, limit);

    const [data, total] = await Promise.all([
      prisma.yoloDetectionLog.findMany({
        where,
        orderBy: { detectedAt: 'desc' },
        skip,
        take
      }),
      prisma.yoloDetectionLog.count({ where })
    ]);

    return formatPaginatedResponse(data, total, page, take);
  }

  /**
   * Check if model file already exists
   */
  async modelFileExists(filePath) {
    const model = await prisma.yoloModel.findFirst({
      where: { filePath }
    });
    return !!model;
  }
}

export default new YoloModelRepository();
