import { PrismaClient } from '@prisma/client';
import { withPrismaErrorHandling } from '../utils/prisma-error-handler.js';
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();

/**
 * YOLO Dataset Repository
 * Manages YOLO training datasets
 */

// ===== DATASET OPERATIONS =====

export const createDataset = async (data) => {
  return withPrismaErrorHandling(
    () => prisma.yoloDataset.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status || 'ACTIVE',
        totalImages: 0,
        trainImages: 0,
        valImages: 0,
        testImages: 0
      }
    }),
    { name: 'Dataset name' }
  );
};

export const findDatasets = async (params) => {
  const where = buildWhereClause(params.filters, params.searchFields);
  const pagination = buildPagination(params.page, params.limit);
  const orderBy = buildSort(params.sortBy, params.sortOrder);

  const [data, total] = await Promise.all([
    prisma.yoloDataset.findMany({
      where,
      ...pagination,
      orderBy,
      include: {
        _count: {
          select: { images: true, trainRuns: true }
        }
      }
    }),
    prisma.yoloDataset.count({ where })
  ]);

  return formatPaginatedResponse(data, total, params.page, params.limit);
};

export const findDatasetById = async (id) => {
  return prisma.yoloDataset.findUnique({
    where: { id: parseInt(id) },
    include: {
      _count: {
        select: { images: true, trainRuns: true }
      }
    }
  });
};

export const updateDataset = async (id, data) => {
  return withPrismaErrorHandling(
    () => prisma.yoloDataset.update({
      where: { id: parseInt(id) },
      data
    }),
    { name: 'Dataset name' }
  );
};

export const deleteDataset = async (id) => {
  return prisma.yoloDataset.delete({
    where: { id: parseInt(id) }
  });
};

export const updateDatasetStats = async (datasetId) => {
  const stats = await prisma.yoloImage.groupBy({
    by: ['split'],
    where: { datasetId: parseInt(datasetId) },
    _count: true
  });

  const counts = {
    trainImages: 0,
    valImages: 0,
    testImages: 0
  };

  stats.forEach(s => {
    if (s.split === 'TRAIN') counts.trainImages = s._count;
    if (s.split === 'VAL') counts.valImages = s._count;
    if (s.split === 'TEST') counts.testImages = s._count;
  });

  const totalImages = counts.trainImages + counts.valImages + counts.testImages;

  return prisma.yoloDataset.update({
    where: { id: parseInt(datasetId) },
    data: {
      totalImages,
      ...counts
    }
  });
};

// ===== IMAGE OPERATIONS =====

export const createImage = async (data) => {
  return withPrismaErrorHandling(
    () => prisma.yoloImage.create({
      data: {
        datasetId: data.datasetId,
        imagePath: data.imagePath,
        imageUrl: data.imageUrl,
        width: data.width,
        height: data.height,
        split: data.split || 'TRAIN',
        sourceType: data.sourceType || 'MANUAL',
        uploadedBy: data.uploadedBy,
        originalName: data.originalName,
        fileSize: data.fileSize
      }
    }),
    { imagePath: 'Image path' }
  );
};

export const findImages = async (params) => {
  const where = buildWhereClause(params.filters, params.searchFields);
  const pagination = buildPagination(params.page, params.limit);
  const orderBy = buildSort(params.sortBy, params.sortOrder);

  const [data, total] = await Promise.all([
    prisma.yoloImage.findMany({
      where,
      ...pagination,
      orderBy,
      include: {
        dataset: {
          select: { id: true, name: true }
        },
        _count: {
          select: { labels: true }
        }
      }
    }),
    prisma.yoloImage.count({ where })
  ]);

  return formatPaginatedResponse(data, total, params.page, params.limit);
};

export const findImageById = async (id) => {
  return prisma.yoloImage.findUnique({
    where: { id: parseInt(id) },
    include: {
      dataset: true,
      labels: true
    }
  });
};

export const deleteImage = async (id) => {
  return prisma.yoloImage.delete({
    where: { id: parseInt(id) }
  });
};

// ===== LABEL OPERATIONS =====

export const createLabels = async (imageId, labels) => {
  return prisma.yoloLabel.createMany({
    data: labels.map(label => ({
      imageId: parseInt(imageId),
      classId: label.classId,
      className: label.className,
      centerX: label.centerX,
      centerY: label.centerY,
      width: label.width,
      height: label.height,
      confidence: label.confidence,
      verified: label.verified || false
    }))
  });
};

export const updateLabel = async (id, data) => {
  return prisma.yoloLabel.update({
    where: { id: parseInt(id) },
    data
  });
};

export const deleteLabel = async (id) => {
  return prisma.yoloLabel.delete({
    where: { id: parseInt(id) }
  });
};

export const findLabelsByImageId = async (imageId) => {
  return prisma.yoloLabel.findMany({
    where: { imageId: parseInt(imageId) },
    orderBy: { classId: 'asc' }
  });
};

// ===== CLASS OPERATIONS =====

export const findOrCreateClass = async (classId, className) => {
  return prisma.yoloClass.upsert({
    where: { classId },
    update: {},
    create: {
      classId,
      className,
      active: true
    }
  });
};

export const findAllClasses = async (activeOnly = true) => {
  return prisma.yoloClass.findMany({
    where: activeOnly ? { active: true } : {},
    orderBy: { classId: 'asc' }
  });
};

export const updateClass = async (classId, data) => {
  return prisma.yoloClass.update({
    where: { classId },
    data
  });
};

// ===== TRAINING RUN OPERATIONS =====

export const createTrainRun = async (data) => {
  return prisma.yoloTrainRun.create({
    data: {
      datasetId: data.datasetId,
      baseModel: data.baseModel || 'best.pt',
      epochs: data.epochs || 100,
      batchSize: data.batchSize || 16,
      imageSize: data.imageSize || 640,
      status: 'PENDING',
      triggeredBy: data.triggeredBy
    }
  });
};

export const updateTrainRun = async (id, data) => {
  return prisma.yoloTrainRun.update({
    where: { id: parseInt(id) },
    data
  });
};

export const findTrainRuns = async (params) => {
  const where = buildWhereClause(params.filters, params.searchFields);
  const pagination = buildPagination(params.page, params.limit);
  const orderBy = buildSort(params.sortBy, params.sortOrder);

  const [data, total] = await Promise.all([
    prisma.yoloTrainRun.findMany({
      where,
      ...pagination,
      orderBy,
      include: {
        dataset: {
          select: { id: true, name: true }
        }
      }
    }),
    prisma.yoloTrainRun.count({ where })
  ]);

  return formatPaginatedResponse(data, total, params.page, params.limit);
};

export const findTrainRunById = async (id) => {
  return prisma.yoloTrainRun.findUnique({
    where: { id: parseInt(id) },
    include: {
      dataset: true
    }
  });
};

// ===== BULK OPERATIONS =====

export const createImageWithLabels = async (imageData, labelsData) => {
  return prisma.$transaction(async (tx) => {
    // Create image
    const image = await tx.yoloImage.create({
      data: imageData
    });

    // Create labels if any
    if (labelsData && labelsData.length > 0) {
      await tx.yoloLabel.createMany({
        data: labelsData.map(label => ({
          ...label,
          imageId: image.id
        }))
      });
    }

    // Update dataset stats
    const stats = await tx.yoloImage.groupBy({
      by: ['split'],
      where: { datasetId: imageData.datasetId },
      _count: true
    });

    const counts = {
      trainImages: 0,
      valImages: 0,
      testImages: 0
    };

    stats.forEach(s => {
      if (s.split === 'TRAIN') counts.trainImages = s._count;
      if (s.split === 'VAL') counts.valImages = s._count;
      if (s.split === 'TEST') counts.testImages = s._count;
    });

    const totalImages = counts.trainImages + counts.valImages + counts.testImages;

    await tx.yoloDataset.update({
      where: { id: imageData.datasetId },
      data: {
        totalImages,
        ...counts
      }
    });

    // Return image with labels
    return tx.yoloImage.findUnique({
      where: { id: image.id },
      include: { labels: true }
    });
  });
};

export default {
  // Dataset
  createDataset,
  findDatasets,
  findDatasetById,
  updateDataset,
  deleteDataset,
  updateDatasetStats,
  
  // Image
  createImage,
  findImages,
  findImageById,
  deleteImage,
  
  // Label
  createLabels,
  updateLabel,
  deleteLabel,
  findLabelsByImageId,
  
  // Class
  findOrCreateClass,
  findAllClasses,
  updateClass,
  
  // Training
  createTrainRun,
  updateTrainRun,
  findTrainRuns,
  findTrainRunById,
  
  // Bulk
  createImageWithLabels
};

