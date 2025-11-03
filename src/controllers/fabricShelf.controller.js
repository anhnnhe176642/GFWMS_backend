import { fabricShelfService } from '../services/fabricShelf.service.js';

export const allocateFabricToShelves = async (req, res, next) => {
  try {
    const result = await fabricShelfService.assignFabricToShelves({
      ...req.params,
      ...req.body
    });

    res.status(200).json({
      message: 'Phân bổ vải vào kệ thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

