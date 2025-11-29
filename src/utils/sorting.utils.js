/**
 * Sắp xếp các điểm theo hàng (y-coordinate), sau đó theo thứ tự trái sang phải
 * Ưu tiên các object nằm trên cùng một hàng ngang, với dung sai cho các sai lệch nhỏ
 * Thay vì dùng trung bình y để gom hàng, hàm hiện tại fit 1 đường thẳng trên mỗi row
 * và dùng khoảng cách vuông góc từ điểm candidate tới đường để quyết định membership.
 * @param {Array<Object>} points - Mảng các điểm có tọa độ {x, y, width, height}
 * @param {number} tolerancePercentage - Phần trăm chiều cao detection dùng làm dung sai (mặc định: 0.5 = 50%)
 * @returns {Array<Object>} - Mảng các điểm đã sắp xếp với chỉ số hàng và `rowline` mỗi phần tử
 */
export function nearestNeighborSortFromCenter(points, tolerancePercentage = 0.5) {
  if (points.length === 0) return [];
  if (points.length === 1) return [{ ...points[0], row: 1, rowline: fitLinePCA([points[0]]) }];

  // Nhóm các điểm theo hàng (y-coordinate) với dung sai dựa trên chiều cao của detection
  const rows = [];
  const sorted = [...points].sort((a, b) => a.y - b.y);

  let currentRow = [sorted[0]];
  let rowIndex = 1;
  // incremental stats for PCA: n, sumX, sumY, sumXX, sumYY, sumXY
  let currentRowStats = createStatsFromPoint(sorted[0]);
  
  for (let i = 1; i < sorted.length; i++) {
    // Tính tolerance dựa trên chiều cao của điểm candidate (sorted[i])
    const rowTolerance = Math.min(sorted[i].height,sorted[i].width) * tolerancePercentage;

    // Nếu có >= 2 điểm trong currentRow thì fit 1 đường thẳng tốt nhất (PCA)
    // và tính khoảng cách vuông góc từ điểm candidate tới đường thẳng đó.
    let belongsToRow;
    if (currentRowStats.n >= 2) {
      const { meanX, meanY, dirX, dirY } = fitLineFromStats(currentRowStats);
      const dist = distancePointToLine({ x: sorted[i].x, y: sorted[i].y }, { x: meanX, y: meanY }, { x: dirX, y: dirY });
      belongsToRow = dist <= rowTolerance;
    } else {
      // fallback: dùng khoảng cách theo y nếu hàng có 1 phần tử
      const yDiff = Math.abs(sorted[i].y - currentRow[0].y);
      belongsToRow = yDiff <= rowTolerance;
    }

      if (belongsToRow) {
      // Thêm vào hàng hiện tại
      currentRow.push(sorted[i]);
      // incremental update of stats
      addPointToStats(currentRowStats, sorted[i]);
    } else {
      // Tạo hàng mới: sắp xếp hàng hiện tại từ trái sang phải (theo x)
      currentRow.sort((a, b) => a.x - b.x);
      // Fit đường cho hàng vừa đóng và gắn vào từng phần tử của hàng
      const lineForRow = fitLineFromStats(currentRowStats);
      rows.push(...currentRow.map(p => ({ ...p, row: rowIndex, rowline: { row: rowIndex, ...lineForRow } })));
      rowIndex++;
      // Khi bắt đầu row mới
      currentRow = [sorted[i]];
      // no global avgHeight to reset
      currentRowStats = createStatsFromPoint(sorted[i]);
    }
  }
  
  // Sắp xếp hàng cuối cùng
  if (currentRow.length > 0) {
    // Fit đường cho hàng cuối và gắn vào từng phần tử của hàng
    const lineForRow = fitLineFromStats(currentRowStats);
    // Thêm thông tin đường cho hàng cuối
    currentRow.sort((a, b) => a.x - b.x);
    rows.push(...currentRow.map(p => ({ ...p, row: rowIndex, rowline: { row: rowIndex, ...lineForRow } })));
  }

  return rows;
}

/**
 * Convenience wrapper: accept original item objects and a function to extract centers
 * and return the original items sorted with `row` and `rowline` attached.
 * This removes the need to map to centers in the controller.
 * @param {Array<Object>} items - Original objects (e.g., detections)
 * @param {number} tolerancePercentage
 */
export function nearestNeighborSortFromItems(items, tolerancePercentage = 0.5) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const centers = items.map((item, i) => ({ ...getDetectionCenter(item), originalIndex: i }));
  const sortedCenters = nearestNeighborSortFromCenter(centers, tolerancePercentage);
  return sortedCenters.map(c => ({ ...items[c.originalIndex], row: c.row, rowline: c.rowline }));
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

/**
 * Fit a 2D line to points using PCA (principal component) to minimize perpendicular distances.
 * Returns line center (meanX, meanY) and direction unit vector (dirX, dirY)
 * @param {Array<{x:number,y:number}>} points
 * @returns {{meanX:number, meanY:number, dirX:number, dirY:number}}
 */
export function fitLinePCA(points) {
  if (!points || points.length === 0) {
    throw new Error('fitLinePCA requires at least 1 point');
  }
  if (points.length === 1) {
    return { meanX: points[0].x, meanY: points[0].y, dirX: 1, dirY: 0 };
  }

  const meanX = points.reduce((s, p) => s + p.x, 0) / points.length;
  const meanY = points.reduce((s, p) => s + p.y, 0) / points.length;

  let Sxx = 0, Sxy = 0, Syy = 0;
  for (const p of points) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    Sxx += dx * dx;
    Sxy += dx * dy;
    Syy += dy * dy;
  }

  // Compute principal direction angle
  const angle = 0.5 * Math.atan2(2 * Sxy, Sxx - Syy);
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);

  // Normalize (should already be unit-length but normalize to be safe)
  const norm = Math.hypot(dirX, dirY) || 1;
  return { meanX, meanY, dirX: dirX / norm, dirY: dirY / norm };
}

/**
 * Perpendicular distance from a point to a parametric line (point p0 + t * v)
 * @param {{x:number,y:number}} p
 * @param {{x:number,y:number}} p0
 * @param {{x:number,y:number}} v - unit direction vector
 * @returns {number}
 */
export function distancePointToLine(p, p0, v) {
  const dx = p.x - p0.x;
  const dy = p.y - p0.y;
  const cross = dx * v.y - dy * v.x; // 2D cross product scalar
  return Math.abs(cross);
}

/**
 * Create incremental stats from a single point
 * stats = { n, sumX, sumY, sumXX, sumYY, sumXY }
 */
export function createStatsFromPoint(p) {
  const x = p.x;
  const y = p.y;
  return { n: 1, sumX: x, sumY: y, sumXX: x * x, sumYY: y * y, sumXY: x * y };
}

/**
 * Add a point to stats in-place (incremental)
 */
export function addPointToStats(stats, p) {
  const x = p.x;
  const y = p.y;
  stats.n += 1;
  stats.sumX += x;
  stats.sumY += y;
  stats.sumXX += x * x;
  stats.sumYY += y * y;
  stats.sumXY += x * y;
}

/**
 * Fit a line (mean + direction) given incremental stats
 */
export function fitLineFromStats(stats) {
  const n = stats.n;
  if (n <= 0) throw new Error('fitLineFromStats requires n > 0');
  const meanX = stats.sumX / n;
  const meanY = stats.sumY / n;
  // central moments
  const Sxx = stats.sumXX - (stats.sumX * stats.sumX) / n;
  const Syy = stats.sumYY - (stats.sumY * stats.sumY) / n;
  const Sxy = stats.sumXY - (stats.sumX * stats.sumY) / n;
  // angle via eigenvector of covariance (PCA)
  const angle = 0.5 * Math.atan2(2 * Sxy, Sxx - Syy);
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const norm = Math.hypot(dirX, dirY) || 1;
  return { meanX, meanY, dirX: dirX / norm, dirY: dirY / norm };
}
