import { fabricShelfService } from '../services/fabricShelf.service.js';

export const allocateFabricToShelves = async (req, res, next) => {
  try {
    const fabricId = Number(req.params.fabricId);
    const { importFabricId, shelves } = req.body;

    const result = await fabricShelfService.assignFabricToShelves({
      fabricId,
      importFabricId,
      shelves: shelves.map(s => ({
        shelfId: Number(s.shelfId),
        quantity: Number(s.quantity)
      }))
    });

    res.status(200).json({
      message: 'Phân bổ vải vào kệ thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
