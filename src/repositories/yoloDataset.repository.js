import { PrismaClient } from '@prisma/client';
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

class YoloDatasetRepository {
  #datasetSelectOptions = {
    id: true,
    name: true,
    description: true,
    totalImages: true,
    totalLabels: true,
    classes: true,
    datasetPath: true,
    status: true,
    createdAt: true,
    updatedAt: true
  };

  #imageSelectOptions = {
    id: true,
    datasetId: true,
    filename: true,
    imagePath: true,
    width: true,
    height: true,
    format: true,
    objectCount: true,
    classes: true,
    annotations: true,
    status: true,
    uploadedBy: true,
    uploadedByUser: {
      select: {
        id: true,
        fullname: true,
        username: true
      }
    },
    notes: true,
    createdAt: true,
    updatedAt: true
  };

  #imageListSelectOptions = {
    id: true,
    filename: true,
    imagePath: true,
    objectCount: true,
    status: true,
    notes: true,
    uploadedByUser: {
      select: {
        id: true,
        fullname: true
      }
    },
    createdAt: true
  };

  /**
   * Create new dataset
   */
  async createDataset(data) {
    return prisma.yoloDataset.create({
      data,
      select: this.#datasetSelectOptions
    });
  }

  /**
   * Find dataset by ID
   */
  async findDatasetById(id) {
    return prisma.yoloDataset.findUnique({
      where: { id },
      select: {
        ...this.#datasetSelectOptions,
        _count: {
          select: { images: true }
        }
      }
    });
  }

  /**
   * Find dataset by name
   */
  async findDatasetByName(name) {
    return prisma.yoloDataset.findUnique({
      where: { name },
      select: this.#datasetSelectOptions
    });
  }

  /**
   * Get all datasets with advanced query
   */
  async findDatasetsWithAdvancedQuery(queryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      filters = {}
    } = queryOptions;

    // Build where clause
    const searchableFields = ['name', 'description'];
    const where = buildWhereClause({ search, ...filters }, searchableFields);

    // Build pagination and sort
    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order);

    // Execute queries
    const [data, total] = await Promise.all([
      prisma.yoloDataset.findMany({
        where,
        skip,
        take,
        select: {
          ...this.#datasetSelectOptions,
          _count: {
            select: { images: true }
          }
        },
        orderBy
      }),
      prisma.yoloDataset.count({ where })
    ]);

    return formatPaginatedResponse(data, total, page, take);
  }

  /**
   * Update dataset
   */
  async updateDataset(id, data) {
    return prisma.yoloDataset.update({
      where: { id },
      data,
      select: this.#datasetSelectOptions
    });
  }

  /**
   * Delete dataset (cascade will delete all images)
   */
  async deleteDataset(id) {
    return prisma.yoloDataset.delete({
      where: { id },
      select: this.#datasetSelectOptions
    });
  }

  /**
   * Add image to dataset
   */
  async addImage(data) {
    return prisma.yoloDatasetImage.create({
      data,
      select: this.#imageSelectOptions
    });
  }

  /**
   * Find image by ID
   */
  async findImageById(id) {
    return prisma.yoloDatasetImage.findUnique({
      where: { id },
      select: this.#imageSelectOptions
    });
  }

  /**
   * Get images in a dataset with pagination
   */
  async getDatasetImages(datasetId, queryOptions = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      filters = {}
    } = queryOptions;

    const searchableFields = ['filename', 'notes'];
    const baseWhere = buildWhereClause({ search, ...filters }, searchableFields);
    const where = {
      datasetId,
      ...baseWhere
    };

    const { skip, take } = buildPagination(page, limit);
    const orderBy = buildSort(sortBy, order);

    const [data, total] = await Promise.all([
      prisma.yoloDatasetImage.findMany({
        where,
        skip,
        take,
        select: this.#imageListSelectOptions,
        orderBy
      }),
      prisma.yoloDatasetImage.count({ where })
    ]);

    return formatPaginatedResponse(data, total, page, take);
  }

  /**
   * Get all images in a dataset without pagination, filtering, or sorting
   * Used for export operations
   * @param {string} datasetId - Dataset ID
   * @param {Array<string>} statusFilter - Optional array of statuses to include. If null, returns COMPLETED images only
   */
  async getAllDatasetImages(datasetId, statusFilter = null) {
    const where = {
      datasetId
    };

    // If statusFilter is provided, use it; otherwise default to COMPLETED
    if (statusFilter && Array.isArray(statusFilter) && statusFilter.length > 0) {
      where.status = {
        in: statusFilter
      };
    } else {
      where.status = 'COMPLETED';
    }

    return prisma.yoloDatasetImage.findMany({
      where,
      select: {
        ...this.#imageSelectOptions
      }
    });
  }

  /**
   * Update image
   */
  async updateImage(id, data) {
    return prisma.yoloDatasetImage.update({
      where: { id },
      data,
      select: this.#imageSelectOptions
    });
  }

  /**
   * Delete image
   */
  async deleteImage(id) {
    return prisma.yoloDatasetImage.delete({
      where: { id },
      select: this.#imageSelectOptions
    });
  }

  /**
   * Delete multiple images by dataset ID
   */
  async deleteImagesByDataset(datasetId) {
    return prisma.yoloDatasetImage.deleteMany({
      where: { datasetId }
    });
  }

  /**
   * Get dataset statistics
   */
  async getDatasetStats(datasetId) {
    const [dataset, imageCount, totalObjects, completedImages] = await Promise.all([
      prisma.yoloDataset.findUnique({
        where: { id: datasetId },
        select: {
          classes: true,
          totalImages: true,
          totalLabels: true
        }
      }),
      prisma.yoloDatasetImage.count({
        where: { datasetId }
      }),
      prisma.yoloDatasetImage.aggregate({
        where: { datasetId, status: 'COMPLETED' },
        _sum: { objectCount: true }
      }),
      prisma.yoloDatasetImage.count({
        where: { datasetId, status: 'COMPLETED' }
      })
    ]);

    return {
      ...dataset,
      actualImageCount: imageCount,
      completedImageCount: completedImages,
      totalObjects: totalObjects._sum.objectCount || 0
    };
  }

  /**
   * Check if image filename exists in dataset
   */
  async imageExists(datasetId, filename) {
    const image = await prisma.yoloDatasetImage.findUnique({
      where: {
        datasetId_filename: {
          datasetId,
          filename
        }
      }
    });
    return !!image;
  }

  /**
   * Update dataset counters
   * totalImages: number of all images
   * totalLabels: number of COMPLETED images
   * Note: classes is NOT updated here - it's defined when dataset is created and only can be added manually
   */
  async updateDatasetCounters(datasetId) {
    const stats = await this.getDatasetStats(datasetId);

    return prisma.yoloDataset.update({
      where: { id: datasetId },
      data: {
        totalImages: stats.actualImageCount,
        totalLabels: stats.completedImageCount
      },
      select: this.#datasetSelectOptions
    });
  }
}

export default new YoloDatasetRepository();
