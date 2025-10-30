import { importFabricService } from '../services/importFabric.service.js';
import { buildQueryParams } from '../utils/filter-builder.js';

export const createImportFabric = async (req, res, next) => {
  try {
    const { warehouseId, items } = req.body; 
    const importer = req.user.id;
    
    const transformedItems = items.map(item => ({
      fabricAttributes: {
        thickness: item.thickness,
        glossId: item.glossId,
        length: item.length,
        width: item.width,
        weight: item.weight,
        categoryId: item.categoryId,
        colorId: item.colorId,
        supplierId: item.supplierId
      },
        quantity: item.quantity,
        price: item.price
    }));

    const result = await importFabricService.createImport({
      warehouseId: warehouseId,
      importer,
    }, transformedItems);

    res.status(201).json({
      message: 'Nhập vải thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getAllImportFabrics = async (req, res, next) => {
  try {
    const queryParams = buildQueryParams(req.query, {
      filterFields: ['warehouseId', 'importer'],
      dateRangeConfig: { 
        fromField: 'importDateFrom', 
        toField: 'importDateTo', 
        targetField: 'importDate' 
      }
    });
    
    const result = await importFabricService.getAllImportFabricsAdvanced(queryParams);
    res.json({
      message: 'Lấy danh sách phiếu nhập thành công',
      data: result.data,
    pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

export const getImportFabricById = async (req, res, next) => {
  try {
    const importFabric = await importFabricService.getById(req.params.id);
    res.json({
      message: 'Lấy chi tiết phiếu nhập thành công',
      data: importFabric 
    });
  } catch (error) {
    next(error);
  }
};