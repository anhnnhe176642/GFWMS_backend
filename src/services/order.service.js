import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { orderRepository } from '../repositories/order.repository.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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
const processMeterPurchase = async (fabric, meters, storeId) => {
  //Lấy số mét vải còn trong cửa hàng
  const fabricStore = await orderRepository.getStoreStock(fabric.id, storeId);
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
      metersToExport,
      storeId  
    }
  };
};

// Xử lý tất cả items
const processOrderItems = async (orderItems, fabricMap, storeId) => {
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
      processed = await processMeterPurchase(fabric, item.quantity, storeId);
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
        const storeId = stockOperation.storeId;
        if (stockOperation.needsExport) {
          await orderRepository.decrementFabricStock(item.fabricId, stockOperation.rollsToExport, tx);
          await orderRepository.incrementStoreStock(item.fabricId, stockOperation.metersToExport, storeId, tx);
        }
        await orderRepository.decrementStoreStock(item.fabricId, stockOperation.metersToDeduct,storeId, tx);
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
const calculateCreditSplit = (totalAmount, creditLimit, creditUsed) => {
  const availableCredit = Math.max(0, creditLimit - creditUsed);
  const creditAmount = Math.min(totalAmount, availableCredit);
  const excessAmount = totalAmount - creditAmount;
  
  return {
    creditAmount,
    excessAmount,
    requiresPayment: excessAmount > 0,
    availableCredit
  };
};

//Tạo hoặc lấy Credit Invoice của tháng hiện tại
const getOrCreateMonthlyCreditInvoice = async (userId) => {
  const now = new Date();
  const endOfMonth = new Date(now. getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  // Tìm Credit Invoice của tháng này
  let creditInvoice = await prisma.creditInvoice.findFirst({
    where: {
      credit: {
        userId: userId
      },
      dueDate: endOfMonth,
      status: 'PENDING'
    }
  });
  
  // Nếu chưa có thì tạo mới
  if (!creditInvoice) {
    const creditRegistration = await prisma.creditRegistration.findFirst({
      where: { userId: userId }
    });
    
    if (! creditRegistration) {
      throw new BadRequestError('Không tìm thấy Credit Registration');
    }
    
    creditInvoice = await prisma.creditInvoice.create({
      data: {
        creditId: creditRegistration.id,
        dueDate: endOfMonth,
        totalCreditAmount: 0,
        creditPaidAmount: 0,
        status: 'PENDING'
      }
    });
  }
  
  return creditInvoice;
};

//A. TẠO ĐƠN HÀNG ONLINE (Customer)
export const createOrder = async (orderData, userId) => {
  const { orderItems, notes, paymentType, storeId } = orderData;

  if (!orderItems || orderItems.length === 0) {
    throw new BadRequestError('Đơn hàng phải có ít nhất 1 sản phẩm');
  }
  // Kiểm tra cửa hàng tồn 
  const store = await orderRepository.findStoreById(storeId);
  if (!store) {
    throw new NotFoundError(`Không tìm thấy cửa hàng với ID ${storeId}`);
  }
  
  if (! store.isActive) {
    throw new BadRequestError(`Cửa hàng "${store.name}" hiện không hoạt động`);
  }

  // Lấy fabric
  const fabricIds = [...new Set(orderItems.map(item => item.fabricId))];
  const fabrics = await orderRepository.getFabricsForOrder(fabricIds);
  const fabricMap = new Map(fabrics.map(f => [f.id, f]));

  // Xử lý items
  const processedItems = await processOrderItems(orderItems, fabricMap, storeId);
  const totalAmount = calculateTotalAmount(processedItems);

  if (paymentType === 'CASH') {
    return await createCashOrder(userId, processedItems, totalAmount, notes,storeId);
  } else {
    return await createCreditOrder(userId, processedItems, totalAmount, notes, storeId);
  }
};

// A1. CASH
const createCashOrder = async (userId, items, totalAmount, notes, storeId) => {
  const paymentDeadline = new Date(Date.now() + 15 * 60 * 1000);

  const order = await orderRepository.createOrderWithTransaction(
    {
      userId,
      status: 'PENDING',
      totalAmount,
      storeId,
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
      paymentType: 'CASH',
      paymentDeadline,
      notes: `Vui lòng thanh toán trong 15 phút. Hạn: ${paymentDeadline.toLocaleString('vi-VN')}`
    },
    createDeductStockCallback(items),
    false
  );
  return { 
    order, 
    requiresPayment: true,
    paymentInstructions: {
      invoiceId: order.invoice.id,
      amount: totalAmount,
      method: 'POST',
      url: `/api/v1/invoices/${order.invoice.id}/payment/qr-code`,
      deadline: paymentDeadline
    }
  };
};

// A2. CREDIT
const createCreditOrder = async (userId, items, totalAmount, notes, storeId) => {
  const credit = await checkCreditEligibility(userId);
  const { creditAmount, excessAmount, requiresPayment } = calculateCreditSplit(totalAmount, credit.creditLimit, credit.creditUsed);
  
  if (requiresPayment) {
    return await createCreditOrderWithExcess(userId, items, totalAmount, creditAmount, excessAmount, notes, storeId);
  } else {
    return await createFullCreditOrder(userId, items, totalAmount, creditAmount, notes, storeId);
  }
};

// A2.1: Trong hạn mức
const createFullCreditOrder = async (userId, items, totalAmount, creditAmount, notes, storeId) => {
  const creditInvoice = await getOrCreateMonthlyCreditInvoice(userId);

  const order = await orderRepository.createOrderWithTransaction(
    {
      userId,
      status: 'PROCESSING',
      totalAmount,
      storeId,
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
      paymentType: 'CREDIT',
      paymentDeadline: creditInvoice.dueDate,  // Dùng dueDate của Credit Invoice
      creditInvoiceId: creditInvoice.id,
      notes: `Ghi nợ: ${creditAmount.toLocaleString('vi-VN')}đ.  Thanh toán cuối tháng: ${creditInvoice.dueDate.toLocaleDateString('vi-VN')}`
    },
    createDeductStockCallback(items),
    true // Update credit limit
  );
  await prisma.creditInvoice.update({
    where: { id: creditInvoice.id },
    data: {
      totalCreditAmount: {
        increment: creditAmount
      }
    }
  });

  return { 
    order, 
    requiresPayment: false,
    creditInvoiceId: creditInvoice.id,
    message: `Đơn hàng được ghi nợ ${creditAmount.toLocaleString('vi-VN')}đ. Thanh toán chung cuối tháng. `
  };
};

// A2.2: Vượt hạn mức
const createCreditOrderWithExcess = async (userId, items, totalAmount, creditAmount, excessAmount, notes, storeId) => {
  const paymentDeadline = new Date(Date.now() + 15 * 60 * 1000);
  const creditInvoice = await getOrCreateMonthlyCreditInvoice(userId);

  const order = await orderRepository.createOrderWithTransaction(
    {
      userId,
      status: 'PENDING',
      totalAmount,
      storeId,
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
      paymentType: 'CREDIT',
      paymentDeadline,
      creditInvoiceId: creditInvoice.id, 
      notes: `Ghi nợ: ${creditAmount.toLocaleString('vi-VN')}đ | Cần thanh toán: ${excessAmount.toLocaleString('vi-VN')}đ trong 15 phút`
    },
    createDeductStockCallback(items),
    false
  );
//Cập nhật totalCreditAmount của Credit Invoice
   await prisma.creditInvoice.update({
    where: { id: creditInvoice.id },
    data: {
      totalCreditAmount: {
        increment: creditAmount
      }
    }
  });

  return { 
    order, 
    requiresPayment: true, 
    excessAmount,
    creditInvoiceId: creditInvoice. id,
    paymentInstructions: {
      invoiceId: order.invoice.id,
      amount: excessAmount,  // Chỉ cần thanh toán phần vượt
      method: 'POST',
      url: `/api/v1/invoices/${order.invoice.id}/payment/qr-code`,
      deadline: paymentDeadline
    }
  };
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

  const invoice = order.invoice;
  if (! invoice) {
    throw new BadRequestError('Đơn hàng chưa có hóa đơn');
  }

  if (invoice.paymentDeadline && new Date() > new Date(invoice. paymentDeadline)) {
    throw new BadRequestError('Đơn hàng đã quá hạn thanh toán');
  }

  const amountToPay = invoice.totalAmount - invoice.creditAmount;
  const newInvoiceStatus = invoice.creditAmount > 0 ? 'CREDIT' : 'PAID';
  const shouldUpdateCredit = invoice.creditAmount > 0;

  return await orderRepository.confirmPaymentWithTransaction(
    orderId,
    {
      status: 'PROCESSING',
    },
    {
      invoiceStatus: newInvoiceStatus,
      paidAmount: amountToPay
    },
    shouldUpdateCredit,
    order.userId,
    invoice.creditAmount
  );
};

//TẠO ĐƠN HÀNG OFFLINE (Staff)

export const createOfflineOrder = async (orderData, staffId) => {
  const { customerPhone, orderItems, paymentType, payExcessAmount, notes } = orderData;

  const staff = await orderRepository.findUserById(staffId);
  if (!staff) {
    throw new NotFoundError('Không tìm thấy nhân viên');
  }
  
  if (!staff.storeId) {
    throw new BadRequestError('Nhân viên chưa được phân công cửa hàng');
  }
  
  const storeId = staff.storeId;

  const customer = await orderRepository.findUserByPhone(customerPhone);
  if (!customer) {
    throw new NotFoundError(`Không tìm thấy khách hàng với SĐT ${customerPhone}`);
  }

  const fabricIds = [...new Set(orderItems.map(item => item.fabricId))];
  const fabrics = await orderRepository.getFabricsForOrder(fabricIds);
  const fabricMap = new Map(fabrics.map(f => [f.id, f]));

  const processedItems = await processOrderItems(orderItems, fabricMap, storeId);
  const totalAmount = calculateTotalAmount(processedItems);

  if (paymentType === 'CASH') {
    return await createOfflineCashOrder(customer.id, staffId, processedItems, totalAmount, customerPhone, notes, storeId);
  } else {
    return await createOfflineCreditOrder(customer, staffId, processedItems, totalAmount, customerPhone, payExcessAmount, notes, storeId);
  }
};

// Offline - CASH
const createOfflineCashOrder = async (customerId, staffId, items, totalAmount, customerPhone, notes, storeId) => {
  const order = await orderRepository.createOrderWithTransaction(
    {
      userId: customerId,
      status: 'DELIVERED',
      totalAmount,
      isOffline: true,
      createdByStaffId: staffId,
      customerPhone,
      storeId,
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
      paymentType: 'CASH',
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
const createOfflineCreditOrder = async (customer, staffId, items, totalAmount, customerPhone, payExcessAmount, notes, storeId) => {
  if (!customer.creditRegistration || customer.creditRegistration.status !== 'APPROVED') {
    throw new BadRequestError('Khách hàng không được phép mua nợ');
  }
  const { creditLimit, creditUsed  } = customer.creditRegistration;
  const { creditAmount, excessAmount, requiresPayment } = calculateCreditSplit(totalAmount, creditLimit, creditUsed );

  if (requiresPayment) {
    if (!payExcessAmount) {
      throw new BadRequestError(`Đơn hàng vượt hạn mức ${excessAmount.toLocaleString('vi-VN')}đ. Khách cần thanh toán phần vượt.`);
    }
    return await createOfflineCreditOrderWithExcess(customer.id, staffId, items, totalAmount, creditAmount, excessAmount, customerPhone, notes, storeId);
  } else {
    return await createOfflineFullCreditOrder(customer.id, staffId, items, totalAmount,creditAmount, customerPhone, notes, storeId);
  }
};

// Offline - CREDIT trong hạn mức
const createOfflineFullCreditOrder = async (customerId, staffId, items, totalAmount, creditAmount, customerPhone, notes, storeId) => {
  //                                                                                    
  const creditInvoice = await getOrCreateMonthlyCreditInvoice(customerId);

  const order = await orderRepository. createOrderWithTransaction(
    {
      userId: customerId,
      status: 'DELIVERED',
      totalAmount,
      isOffline: true,
      createdByStaffId: staffId,
      customerPhone,
      storeId,
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
      creditAmount,  
      paymentType: 'CREDIT',
      paymentDeadline: creditInvoice. dueDate,
      creditInvoiceId: creditInvoice. id,
      notes: `Ghi nợ: ${creditAmount.toLocaleString('vi-VN')}đ.  Hạn trả cuối tháng: ${creditInvoice.dueDate.toLocaleDateString('vi-VN')}`
    },
    createDeductStockCallback(items),
    true
  );

  await prisma.creditInvoice. update({
    where: { id: creditInvoice.id },
    data: {
      totalCreditAmount: {
        increment: creditAmount  
      }
    }
  });

  return {
    order,
    creditInvoiceId: creditInvoice.id,
    message: `Tạo đơn hàng thành công. Ghi nợ ${creditAmount.toLocaleString('vi-VN')}đ. `
  };
};

// Offline - CREDIT vượt hạn mức
const createOfflineCreditOrderWithExcess = async (customerId, staffId, items, totalAmount, creditAmount, excessAmount, customerPhone, notes, storeId) => {
  const creditInvoice = await getOrCreateMonthlyCreditInvoice(customerId)

  const order = await orderRepository.createOrderWithTransaction(
    {
      userId: customerId,
      status: 'DELIVERED',
      totalAmount,
      isOffline: true,
      createdByStaffId: staffId,
      customerPhone,
      storeId,
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
      paymentType: 'CREDIT',
      paymentDeadline: creditInvoice. dueDate,
      creditInvoiceId: creditInvoice.id,
      notes: `Ghi nợ: ${creditAmount.toLocaleString('vi-VN')}đ | Đã thanh toán: ${excessAmount.toLocaleString('vi-VN')}đ`
    },
    createDeductStockCallback(items),
    true
  );

  await prisma. creditInvoice.update({
    where: { id: creditInvoice.id },
    data: {
      totalCreditAmount: {
        increment: creditAmount
      }
    }
  });

  return {
    order,
    creditInvoiceId: creditInvoice.id,
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
