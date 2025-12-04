import * as fabricService from '../services/fabric.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

/**  Lấy danh sách Fabric (hỗ trợ filter, sort, pagination) */
export const getAllFabrics = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['colorId', 'categoryId', 'glossId', 'supplierId'],
      dateRangeConfig: {
        fromField: 'createdFrom',
        toField: 'createdTo',
        targetField: 'createdAt'
      }
    });

    const result = await fabricService.getAllFabricsAdvanced(queryParams);

    res.json({
      message: 'Lấy danh sách vải thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**  Lấy Fabric theo ID */
export const getFabricById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fabric = await fabricService.getFabricById(parseInt(id));

    if (!fabric) {
      return res.status(404).json({ message: 'Không tìm thấy vải' });
    }

    res.json({
      message: 'Lấy thông tin vải thành công',
      fabric
    });
  } catch (error) {
    next(error);
  }
};


//Lấy thông tin tồn kho vải theo kho

export const getFabricInventoryByWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await fabricService.getFabricInventoryByWarehouse(parseInt(id));

    res.json({
      message: 'Lấy thông tin tồn kho vải theo kho thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};




