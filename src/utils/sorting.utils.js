/**
 * Sắp xếp các điểm theo hàng (y-coordinate), sau đó theo thứ tự trái sang phải
 * Ưu tiên các object nằm trên cùng một hàng ngang, với dung sai cho các sai lệch nhỏ
 * @param {Array<Object>} points - Mảng các điểm có tọa độ {x, y, width, height}
 * @param {number} tolerancePercentage - Phần trăm chiều cao detection dùng làm dung sai (mặc định: 0.5 = 50%)
 * @returns {Array<Object>} - Mảng các điểm đã sắp xếp với chỉ số hàng
 */
export function nearestNeighborSortFromCenter(points, tolerancePercentage = 0.5) {
  if (points.length === 0) return [];
  if (points.length === 1) return [{ ...points[0], row: 1 }];

  // Nhóm các điểm theo hàng (y-coordinate) với dung sai dựa trên chiều cao của detection
  const rows = [];
  const sorted = [...points].sort((a, b) => a.y - b.y);

  let currentRow = [sorted[0]];
  let rowIndex = 1;
  let sumY = sorted[0].y; 
  
  for (let i = 1; i < sorted.length; i++) {
    // Tính trung bình y của hàng hiện tại
    const avgY = sumY / currentRow.length;
    const yDiff = Math.abs(sorted[i].y - avgY);
    // Dung sai = chiều cao detection × phần trăm dung sai
    const rowTolerance = (currentRow[0].height || 50) * tolerancePercentage;
    
    if (yDiff <= rowTolerance) {
      // Thêm vào hàng hiện tại
      currentRow.push(sorted[i]);
      sumY += sorted[i].y; // Cập nhật tổng y
    } else {
      // Tạo hàng mới: sắp xếp hàng hiện tại từ trái sang phải (theo x)
      currentRow.sort((a, b) => a.x - b.x);
      rows.push(...currentRow.map(p => ({ ...p, row: rowIndex })));
      rowIndex++;
      currentRow = [sorted[i]];
      sumY = sorted[i].y; // Reset tổng y cho hàng mới
    }
  }
  
  // Sắp xếp hàng cuối cùng
  if (currentRow.length > 0) {
    currentRow.sort((a, b) => a.x - b.x);
    rows.push(...currentRow.map(p => ({ ...p, row: rowIndex })));
  }

  return rows;
}

/**
 * Trích xuất tọa độ tâm và kích thước từ đối tượng detection
 * @param {Object} detection - Đối tượng detection có center hoặc bbox và dimensions
 * @returns {Object} - Tọa độ tâm {x, y, width, height}
 */
export function getDetectionCenter(detection) {
  // Đối tượng detection đã có sẵn center từ Python script
  if (detection.center && detection.dimensions) {
    return {
      x: detection.center.x,
      y: detection.center.y,
      width: detection.dimensions.width,
      height: detection.dimensions.height
    };
  }
  // Fallback nếu cấu trúc khác: tính center từ bbox
  if (detection.bbox && detection.dimensions) {
    const { x1, y1, x2, y2 } = detection.bbox;
    return {
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2,
      width: detection.dimensions.width,
      height: detection.dimensions.height
    };
  }
  throw new Error('Đối tượng detection không có các thuộc tính cần thiết (center/bbox và dimensions)');
}