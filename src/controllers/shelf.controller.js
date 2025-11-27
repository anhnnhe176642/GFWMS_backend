import { shelfService } from '../services/shelf.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';


export const getAllShelves = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['warehouseId'], 
      dateRangeConfig: {
        fromField: 'createdFrom',
        toField: 'createdTo',
        targetField: 'createdAt'
      }
    });

    // Support grouping by fabric attributes
    const { groupBy } = req.query;
    const groupByFields = groupBy ? (Array.isArray(groupBy) ? groupBy : groupBy.split(',').map(f => f.trim())) : null;

    const result = await shelfService.getAllShelvesAdvanced(queryParams, groupByFields);
    res.json({
      message: groupByFields ? 'Lấy danh sách kệ gom nhóm thành công' : 'Lấy danh sách kệ thành công',
      ...result
    });
  } catch (error) {
    next(error);
  }
};


export const createShelf = async (req, res, next) => {
  try {
    const shelf = await shelfService.createShelf(req.body);
    res.status(201).json({
      message: 'Tạo kệ thành công',
      shelf
    });
  } catch (error) {
    next(error);
  }
};


export const getShelfById = async (req, res, next) => {
  try {
    const shelf = await shelfService.getShelfById(req.params.id);
    res.json({
      message: 'Lấy thông tin kệ thành công',
      shelf
    });
  } catch (error) {
    next(error);
  }
};


export const updateShelf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const shelf = await shelfService.updateShelf(id, updateData);
    res.json({
      message: 'Cập nhật kệ thành công',
      shelf
    });
  } catch (error) {
    next(error);
  }
};


export const deleteShelf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await shelfService.deleteShelf(id);

    res.status(200).json({
      success: true,
      message: 'Xóa kệ thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
