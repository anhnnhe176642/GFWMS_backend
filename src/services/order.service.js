import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { orderRepository } from '../repositories/order.repository.js';


// Xử lý mua theo CUỘN
const processRollPurchase = async (fabric, quantity) => {
  if (fabric.quantityInStock < quantity) {
    throw new BadRequestError(
      `Vải ID ${fabric.id}: Không đủ hàng trong kho (còn ${fabric.quantityInStock} cuộn, cần ${quantity} cuộn)`
    );
  }

  const pricePerRoll = fabric.sellingPrice ?? fabric.category.sellingPricePerRoll;
  return {
    fabricId: fabric.id,
    quantity,
    saleUnit: 'ROLL',
    price: pricePerRoll,
    totalPrice: quantity * pricePerRoll,
    stockOperation: {
      type: 'WAREHOUSE',
      rollsToDeduct: quantity
    }
  };
};

// Xử lý mua theo MÉT
const processMeterPurchase = async (fabric, meters) => {
  //Lấy số mét vải còn trong cửa hàng
  const fabricStore = await orderRepository.getStoreStock(fabric.id);
  const availableMeters = fabricStore?.quantity || 0;
  // tính số mét 
  const shortage = meters - availableMeters;

  let needsExport = false;
  let rollsToExport = 0;
  let metersToExport = 0;

  //Nếu cửa hàng thiếu, tính số cuộn cần xuất từ kho
  if (shortage > 0) {
    needsExport = true;
    rollsToExport = Math.ceil(shortage / fabric.length);
    metersToExport = rollsToExport * fabric.length;

    // Kiểm tra kho có đủ cuộn để xuất không
    if (fabric.quantityInStock < rollsToExport) {
      throw new BadRequestError(
        `Vải ID ${fabric.id}: Không đủ hàng trong kho để xuất (cần ${rollsToExport} cuộn, còn ${fabric.quantityInStock} cuộn)`
      );
    }
  }

  return {
    fabricId: fabric.id,
    quantity: meters,
    saleUnit: 'METER',
    price: fabric.category.sellingPricePerMeter,
    totalPrice: meters * fabric.category.sellingPricePerMeter,
    stockOperation: {
      type: 'STORE',
      metersToDeduct: meters,
      needsExport,
      rollsToExport,
      metersToExport
    }
  };
};

// Xử lý tất cả items
const processOrderItems = async (orderItems, fabricMap) => {
  const processedItems = [];

  for (const item of orderItems) {
    const fabric = fabricMap.get(item.fabricId);
    if (!fabric) {
      throw new BadRequestError(`Vải ID ${item.fabricId} không tồn tại`);
    }

    let processed;
    if (item.saleUnit === 'ROLL') {
      processed = await processRollPurchase(fabric, item.quantity);
    } else if (item.saleUnit === 'METER') {
      processed = await processMeterPurchase(fabric, item.quantity);
    } else {
      throw new BadRequestError('Đơn vị bán phải là ROLL hoặc METER');
    }

    processedItems.push(processed);
  }

  return processedItems;
};

// Tính tổng tiền
const calculateTotalAmount = (processedItems) => {
  return processedItems.reduce((sum, item) => sum + item.totalPrice, 0);
};

// Tạo callback trừ tồn kho 
const createDeductStockCallback = (items) => {
  return async (tx) => {
    for (const item of items) {
      const { stockOperation } = item;

      if (item.saleUnit === 'ROLL') {
        await orderRepository.decrementFabricStock(item.fabricId, stockOperation.rollsToDeduct, tx);
      } else if (item.saleUnit === 'METER') {
        if (stockOperation.needsExport) {
          await orderRepository.decrementFabricStock(item.fabricId, stockOperation.rollsToExport, tx);
          await orderRepository.incrementStoreStock(item.fabricId, stockOperation.metersToExport, tx);
        }
        await orderRepository.decrementStoreStock(item.fabricId, stockOperation.metersToDeduct, tx);
      }
    }
  };
};

// Check credit eligibility
const checkCreditEligibility = async (userId) => {
  const credit = await orderRepository.getCreditRegistration(userId);
  if (!credit || credit.status !== 'APPROVED') {
    throw new BadRequestError('Tài khoản không được phép mua nợ');
  }
  return credit;
};

// Tính credit split
const calculateCreditSplit = (totalAmount, creditLimit) => {
  if (totalAmount <= creditLimit) {
    return {
      creditAmount: totalAmount,
      excessAmount: 0,
      requiresPayment: false
    };
  }
  return {
    creditAmount: creditLimit,
    excessAmount: totalAmount - creditLimit,
    requiresPayment: true
  };
};

//A. TẠO ĐƠN HÀNG ONLINE (Customer)

export const createOrder = async (orderData, userId) => {
  const { orderItems, notes, paymentType } = orderData;

  if (!orderItems || orderItems.length === 0) {
    throw new BadRequestError('Đơn hàng phải có ít nhất 1 sản phẩm');
  }

  // Lấy fabric
  const fabricIds = [...new Set(orderItems.map(item => item.fabricId))];
  const fabrics = await orderRepository.getFabricsForOrder(fabricIds);
  const fabricMap = new Map(fabrics.map(f => [f.id, f]));

  // Xử lý items
  const processedItems = await processOrderItems(orderItems, fabricMap);
  const totalAmount = calculateTotalAmount(processedItems);

  if (paymentType === 'CASH') {
    return await createCashOrder(userId, processedItems, totalAmount, notes);
  } else {
    return await createCreditOrder(userId, processedItems, totalAmount, notes);
  }
};

// A1. CASH
const createCashOrder = async (userId, items, totalAmount, notes) => {
  const paymentDeadline = new Date(Date.now() + 15 * 60 * 1000);

  const order = await orderRepository.createOrderWithTransaction(
    {
      userId,
      paymentType: 'CASH',
      status: 'PENDING',
      totalAmount,
      paidAmount: 0,
      creditAmount: 0,
      paymentDeadline,
      notes
    },
    items.map(item => ({
      fabricId: item.fabricId,
      quantity: item.quantity,
      saleUnit: item.saleUnit,
      price: item.price
    })),
    {
      invoiceStatus: 'UNPAID',
      totalAmount,
      paidAmount: 0,
      creditAmount: 0,
      dueDate: paymentDeadline,
      notes: `Vui lòng thanh toán trong 15 phút. Hạn: ${paymentDeadline.toLocaleString('vi-VN')}`
    },
    createDeductStockCallback(items),
    false
  );

  return { order, requiresPayment: true };
};

// A2. CREDIT
const createCreditOrder = async (userId, items, totalAmount, notes) => {
  const credit = await checkCreditEligibility(userId);
  const { creditAmount, excessAmount, requiresPayment } = calculateCreditSplit(totalAmount, credit.creditLimit);
  
  if (requiresPayment) {
    return await createCreditOrderWithExcess(userId, items, totalAmount, creditAmount, excessAmount, notes);
  } else {
    return await createFullCreditOrder(userId, items, totalAmount, creditAmount, notes);
  }
};

// A2.1: Trong hạn mức
const createFullCreditOrder = async (userId, items, totalAmount, creditAmount, notes) => {
  const creditDueDate = new Date();
  creditDueDate.setDate(creditDueDate.getDate() + 15);

  const order = await orderRepository.createOrderWithTransaction(
    {
      userId,
      paymentType: 'CREDIT',
      status: 'PROCESSING',
      totalAmount,
      paidAmount: 0,
      creditAmount,
      notes: notes || 'Đơn ghi nợ - Tự động duyệt'
    },
    items.map(item => ({
      fabricId: item.fabricId,
      quantity: item.quantity,
      saleUnit: item.saleUnit,
      price: item.price
    })),
    {
      invoiceStatus: 'CREDIT',
      totalAmount,
      paidAmount: 0,
      creditAmount,
      dueDate: creditDueDate,
      notes: `Ghi nợ: ${creditAmount.toLocaleString('vi-VN')}đ. Hạn trả: ${creditDueDate.toLocaleDateString('vi-VN')}`
    },
    createDeductStockCallback(items),
    true // Update credit limit
  );

  return { order, requiresPayment: false };
};

// A2.2: Vượt hạn mức
const createCreditOrderWithExcess = async (userId, items, totalAmount, creditAmount, excessAmount, notes) => {
  const paymentDeadline = new Date(Date.now() + 15 * 60 * 1000);

  const order = await orderRepository.createOrderWithTransaction(
    {
      userId,
      paymentType: 'CREDIT',
      status: 'PENDING',
      totalAmount,
      paidAmount: 0,
      creditAmount,
      paymentDeadline,
      notes: notes || `Ghi nợ ${creditAmount.toLocaleString('vi-VN')}đ + Cần thanh toán ${excessAmount.toLocaleString('vi-VN')}đ`
    },
    items.map(item => ({
      fabricId: item.fabricId,
      quantity: item.quantity,
      saleUnit: item.saleUnit,
      price: item.price
    })),
    {
      invoiceStatus: 'UNPAID',
      totalAmount,
      paidAmount: 0,
      creditAmount,
      dueDate: paymentDeadline,
      notes: `Ghi nợ: ${creditAmount.toLocaleString('vi-VN')}đ | Cần thanh toán: ${excessAmount.toLocaleString('vi-VN')}đ trong 15 phút`
    },
    createDeductStockCallback(items),
    false
  );

  return { order, requiresPayment: true, excessAmount };
};


export const simulatePayment = async (orderId, success = true) => {
  if (!success) {
    return { success: false, message: 'Giả lập thanh toán thất bại' };
  }
  return await confirmPayment(orderId);
};

// XÁC NHẬN THANH TOÁN
export const confirmPayment = async (orderId) => {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new NotFoundError('Không tìm thấy đơn hàng');
  }

  if (order.status !== 'PENDING') {
    throw new BadRequestError('Chỉ có thể xác nhận thanh toán cho đơn hàng PENDING');
  }

  if (order.paymentDeadline && new Date() > new Date(order.paymentDeadline)) {
    throw new BadRequestError('Đơn hàng đã quá hạn thanh toán');
  }

  const amountToPay = order.totalAmount - order.creditAmount;
  const newInvoiceStatus = order.creditAmount > 0 ? 'CREDIT' : 'PAID';
  const shouldUpdateCredit = order.creditAmount > 0;

  return await orderRepository.confirmPaymentWithTransaction(
    orderId,
    {
      status: 'PROCESSING',
      paidAmount: amountToPay
    },
    {
      invoiceStatus: newInvoiceStatus,
      paidAmount: amountToPay
    },
    shouldUpdateCredit,
    order.userId,
    order.creditAmount
  );
};

//TẠO ĐƠN HÀNG OFFLINE (Staff)

export const createOfflineOrder = async (orderData, staffId) => {
  const { customerPhone, orderItems, paymentType, payExcessAmount, notes } = orderData;

  const customer = await orderRepository.findUserByPhone(customerPhone);
  if (!customer) {
    throw new NotFoundError(`Không tìm thấy khách hàng với SĐT ${customerPhone}`);
  }

  const fabricIds = [...new Set(orderItems.map(item => item.fabricId))];
  const fabrics = await orderRepository.getFabricsForOrder(fabricIds);
  const fabricMap = new Map(fabrics.map(f => [f.id, f]));

  const processedItems = await processOrderItems(orderItems, fabricMap);
  const totalAmount = calculateTotalAmount(processedItems);

  if (paymentType === 'CASH') {
    return await createOfflineCashOrder(customer.id, staffId, processedItems, totalAmount, customerPhone, notes);
  } else {
    return await createOfflineCreditOrder(customer, staffId, processedItems, totalAmount, customerPhone, payExcessAmount, notes);
  }
};

// Offline - CASH
const createOfflineCashOrder = async (customerId, staffId, items, totalAmount, customerPhone, notes) => {
  const order = await orderRepository.createOrderWithTransaction(
    {
      userId: customerId,
      paymentType: 'CASH',
      status: 'DELIVERED',
      totalAmount,
      paidAmount: totalAmount,
      creditAmount: 0,
      isOffline: true,
      createdByStaffId: staffId,
      customerPhone,
      notes: notes || 'Mua tại cửa hàng - Trả tiền ngay'
    },
    items.map(item => ({
      fabricId: item.fabricId,
      quantity: item.quantity,
      saleUnit: item.saleUnit,
      price: item.price
    })),
    {
      invoiceStatus: 'PAID',
      totalAmount,
      paidAmount: totalAmount,
      creditAmount: 0,
      dueDate: new Date(),
      notes: 'Đã thanh toán tại cửa hàng'
    },
    createDeductStockCallback(items),
    false
  );

  return {
    order,
    message: 'Tạo đơn hàng thành công. Đã giao hàng cho khách.'
  };
};

// Offline - CREDIT
const createOfflineCreditOrder = async (customer, staffId, items, totalAmount, customerPhone, payExcessAmount, notes) => {
  if (!customer.creditRegistration || customer.creditRegistration.status !== 'APPROVED') {
    throw new BadRequestError('Khách hàng không được phép mua nợ');
  }

  const { creditLimit } = customer.creditRegistration;
  const { creditAmount, excessAmount, requiresPayment } = calculateCreditSplit(totalAmount, creditLimit);

  if (requiresPayment) {
    if (!payExcessAmount) {
      throw new BadRequestError(`Đơn hàng vượt hạn mức ${excessAmount.toLocaleString('vi-VN')}đ. Khách cần thanh toán phần vượt.`);
    }
    return await createOfflineCreditOrderWithExcess(customer.id, staffId, items, totalAmount, creditAmount, excessAmount, customerPhone, notes);
  } else {
    return await createOfflineFullCreditOrder(customer.id, staffId, items, totalAmount, customerPhone, notes);
  }
};

// Offline - CREDIT trong hạn mức
const createOfflineFullCreditOrder = async (customerId, staffId, items, totalAmount, customerPhone, notes) => {
  const creditDueDate = new Date();
  creditDueDate.setDate(creditDueDate.getDate() + 15);

  const order = await orderRepository.createOrderWithTransaction(
    {
      userId: customerId,
      paymentType: 'CREDIT',
      status: 'DELIVERED',
      totalAmount,
      paidAmount: 0,
      creditAmount: totalAmount,
      isOffline: true,
      createdByStaffId: staffId,
      customerPhone,
      notes: notes || 'Mua tại cửa hàng - Ghi nợ'
    },
    items.map(item => ({
      fabricId: item.fabricId,
      quantity: item.quantity,
      saleUnit: item.saleUnit,
      price: item.price
    })),
    {
      invoiceStatus: 'CREDIT',
      totalAmount,
      paidAmount: 0,
      creditAmount: totalAmount,
      dueDate: creditDueDate,
      notes: `Ghi nợ: ${totalAmount.toLocaleString('vi-VN')}đ. Hạn trả: ${creditDueDate.toLocaleDateString('vi-VN')}`
    },
    createDeductStockCallback(items),
    true
  );

  return {
    order,
    message: `Tạo đơn hàng thành công. Ghi nợ ${totalAmount.toLocaleString('vi-VN')}đ.`
  };
};

// Offline - CREDIT vượt hạn mức
const createOfflineCreditOrderWithExcess = async (customerId, staffId, items, totalAmount, creditAmount, excessAmount, customerPhone, notes) => {
  const creditDueDate = new Date();
  creditDueDate.setDate(creditDueDate.getDate() + 15);

  const order = await orderRepository.createOrderWithTransaction(
    {
      userId: customerId,
      paymentType: 'CREDIT',
      status: 'DELIVERED',
      totalAmount,
      paidAmount: excessAmount,
      creditAmount,
      isOffline: true,
      createdByStaffId: staffId,
      customerPhone,
      notes: notes || `Ghi nợ ${creditAmount.toLocaleString('vi-VN')}đ + Đã thanh toán ${excessAmount.toLocaleString('vi-VN')}đ`
    },
    items.map(item => ({
      fabricId: item.fabricId,
      quantity: item.quantity,
      saleUnit: item.saleUnit,
      price: item.price
    })),
    {
      invoiceStatus: 'CREDIT',
      totalAmount,
      paidAmount: excessAmount,
      creditAmount,
      dueDate: creditDueDate,
      notes: `Ghi nợ: ${creditAmount.toLocaleString('vi-VN')}đ | Đã thanh toán: ${excessAmount.toLocaleString('vi-VN')}đ`
    },
    createDeductStockCallback(items),
    true
  );

  return {
    order,
    message: `Tạo đơn hàng thành công. Ghi nợ ${creditAmount.toLocaleString('vi-VN')}đ + Đã thanh toán ${excessAmount.toLocaleString('vi-VN')}đ.`
  };
};

// KIỂM TRA CREDIT KHÁCH HÀNG

export const checkCustomerCredit = async (phone) => {
  const customer = await orderRepository.findUserByPhone(phone);
  
  if (!customer) {
    throw new NotFoundError('Không tìm thấy khách hàng với số điện thoại này');
  }
  
  if (!customer.creditRegistration) {
    return {
      customer,
      canCredit: false,
      reason: 'Khách hàng chưa đăng ký tín dụng'
    };
  }
  
  if (customer.creditRegistration.status !== 'APPROVED') {
    return {
      customer,
      canCredit: false,
      reason: 'Tài khoản tín dụng chưa được duyệt'
    };
  }
  
  return {
    customer,
    canCredit: true,
    creditLimit: customer.creditRegistration.creditLimit
  };
};


export const getAllOrders = async (queryOptions) => {
  return await orderRepository.findWithAdvancedQuery(queryOptions);
};

export const getMyOrders = async (userId, queryOptions) => {
  return await orderRepository.findByUserIdWithQuery(userId, queryOptions);
};

export const getOrderById = async (orderId, userId, role) => {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new NotFoundError('Không tìm thấy đơn hàng');
  }

  if (role === 'CUSTOMER' && order.userId !== userId) {
    throw new BadRequestError('Bạn không có quyền xem đơn hàng này');
  }

  return order;
};
