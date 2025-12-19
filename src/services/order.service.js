import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { orderRepository } from '../repositories/order.repository.js';
import { userActivityService } from './userActivity.service.js';
import { storeAccessService } from './storeAccess.service.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Xử lý tất cả items
const processOrderItems = async (orderItems, fabricMap, storeId) => {
  const processedItems = [];
  // Track tồn kho thực tế khi xử lý từng item (vì có thể cùng 1 fabric với 2 đơn vị khác nhau)
  const currentInventory = new Map(); // key: fabricId, value: { uncutRolls, totalMeters }

  for (const item of orderItems) {
    const fabric = fabricMap.get(item.fabricId);
    if (!fabric) {
      throw new BadRequestError(`Vải ID ${item.fabricId} không tồn tại`);
    }

    let fabricStore;
    
    // Lấy inventory từ cache nếu đã xử lý trước đó, nếu không lấy từ DB
    if (currentInventory.has(item.fabricId)) {
      const cached = currentInventory.get(item.fabricId);
      fabricStore = {
        uncutRolls: cached.uncutRolls,
        totalMeters: cached.totalMeters,
        totalValue: cached.totalValue,
        id: item.fabricId
      };
    } else {
      fabricStore = await orderRepository.getStoreStock(fabric.id, storeId);
    }

    let processed;
    if (item.saleUnit === 'ROLL') {
      // Kiểm tra đủ cuộn
      if (!fabricStore || fabricStore.uncutRolls < item.quantity) {
        throw new BadRequestError(
          `Vải ID ${fabric.id}: Không đủ cuộn trong cửa hàng (còn ${fabricStore?.uncutRolls || 0} cuộn, cần ${item.quantity} cuộn)`
        );
      }

      // Tính giá nhập trung bình mỗi cuộn
      const costPricePerRoll = fabricStore.totalMeters > 0 
        ? (fabricStore.totalValue / fabricStore.totalMeters) * fabric.length
        : 0;

      const pricePerRoll = fabric.sellingPrice ?? fabric.category.sellingPricePerRoll;
      
      processed = {
        fabricId: fabric.id,
        quantity: item.quantity,
        saleUnit: 'ROLL',
        price: pricePerRoll,
        costPrice: costPricePerRoll,
        totalPrice: item.quantity * pricePerRoll,
        stockOperation: {
          type: 'STORE_ROLL',
          rollsToDeduct: item.quantity,
          storeId,
          fabricLength: fabric.length
        }
      };

      // Cập nhật inventory
      const metersPerRoll = fabric.length || 0;
      currentInventory.set(item.fabricId, {
        uncutRolls: fabricStore.uncutRolls - item.quantity,
        totalMeters: fabricStore.totalMeters - (item.quantity * metersPerRoll),
        totalValue: fabricStore.totalValue
      });

    } else if (item.saleUnit === 'METER') {
      // Kiểm tra đủ mét
      const availableMeters = fabricStore?.totalMeters || 0;
      if (availableMeters < item.quantity) {
        throw new BadRequestError(
          `Vải ID ${fabric.id}: Không đủ vải trong cửa hàng (còn ${availableMeters.toFixed(2)} mét, cần ${item.quantity} mét)`
        );
      }

      // Tính giá nhập trung bình mỗi mét
      const costPricePerMeter = fabricStore.totalMeters > 0 
        ? fabricStore.totalValue / fabricStore.totalMeters 
        : 0;

      processed = {
        fabricId: fabric.id,
        quantity: item.quantity,
        saleUnit: 'METER',
        price: fabric.category.sellingPricePerMeter,
        costPrice: costPricePerMeter,
        totalPrice: item.quantity * fabric.category.sellingPricePerMeter,
        stockOperation: {
          type: 'STORE_METER',
          metersToDeduct: item.quantity,
          storeId,
          fabricLength: fabric.length
        }
      };

      // Cập nhật inventory
      currentInventory.set(item.fabricId, {
        uncutRolls: fabricStore.uncutRolls,
        totalMeters: fabricStore.totalMeters - item.quantity,
        totalValue: fabricStore.totalValue
      });

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

      if (stockOperation.type === 'STORE_ROLL') {
        // Trừ cuộn nguyên từ cửa hàng
        await orderRepository.decrementUncutRolls(
          item.fabricId, 
          stockOperation.rollsToDeduct,
          stockOperation.fabricLength,
          stockOperation.storeId, 
          tx
        );
      } else if (stockOperation.type === 'STORE_METER') {
        // Cắt vải từ cửa hàng
        await orderRepository.decrementStoreStock(
          item.fabricId, 
          stockOperation.metersToDeduct, 
          stockOperation.storeId, 
          tx
        );
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
      price: item.price,
      costPrice: item.costPrice
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
  
  // Log activity
  await userActivityService.logActivity(
    userId,
    'ORDER_CREATED',
    'Order',
    order.id,
    `Tạo đơn hàng #${order.id}`
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
      price: item.price,
      costPrice: item.costPrice
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
  
  // Log activity
  await userActivityService.logActivity(
    userId,
    'ORDER_CREATED',
    'Order',
    order.id,
    `Tạo đơn hàng #${order.id} (ghi nợ)`
  );

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
      price: item.price,
      costPrice: item.costPrice
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
  
  // Log activity
  await userActivityService.logActivity(
    userId,
    'ORDER_CREATED',
    'Order',
    order.id,
    `Tạo đơn hàng #${order.id} (vượt hạn mức)`
  );

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

  console.log('🔍 === confirmPayment DEBUG ===');
  console.log('  orderId:', orderId);
  console.log('  order.status:', order.status);
  console. log('  invoice.totalAmount:', invoice.totalAmount);
  console.log('  invoice. creditAmount:', invoice.creditAmount);
  console.log('  invoice.paidAmount:', invoice.paidAmount);
  console.log('  amountToPay:', amountToPay);
  console.log('  shouldUpdateCredit:', shouldUpdateCredit);
  console.log('  order.userId:', order.userId);
  console.log('🔍 === END DEBUG ===');

  const result = await orderRepository.confirmPaymentWithTransaction(
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

  console.log('✅ confirmPayment completed');
  return result;
};

//TẠO ĐƠN HÀNG OFFLINE (Staff)

export const createOfflineOrder = async (orderData, staffId) => {
  const { customerPhone, orderItems, paymentType,paymentMethod = 'DIRECT', notes, storeId } = orderData;

  const staff = await orderRepository.findUserById(staffId);
  if (!staff) {
    throw new NotFoundError('Không tìm thấy nhân viên');
  }
  
  // Kiểm tra quyền quản lý cửa hàng
  await storeAccessService.ensureUserCanManageStore(staffId, storeId);

  const customer = await orderRepository.findUserByPhone(customerPhone);
  if (!customer) {
    throw new NotFoundError(`Không tìm thấy khách hàng với SĐT ${customerPhone}`,'customerPhone');
  }

  const fabricIds = [...new Set(orderItems.map(item => item.fabricId))];
  const fabrics = await orderRepository.getFabricsForOrder(fabricIds);
  const fabricMap = new Map(fabrics.map(f => [f.id, f]));

  const processedItems = await processOrderItems(orderItems, fabricMap, storeId);
  const totalAmount = calculateTotalAmount(processedItems);

  if (paymentType === 'CASH') {
    return await createOfflineCashOrder(customer.id, staffId, processedItems, totalAmount, customerPhone,paymentMethod,storeId, notes);
  } else {
    return await createOfflineCreditOrder(customer, staffId, processedItems, totalAmount, customerPhone,paymentMethod,storeId, notes);
  }
};

// Offline - CASH
const createOfflineCashOrder = async (customerId, staffId, items, totalAmount, customerPhone,paymentMethod, storeId, notes) => {
  const order = await orderRepository.createOrderWithTransaction(
    {
      userId: customerId,
      status: 'PENDING',
      totalAmount,
      isOffline: true,
      createdByStaffId: staffId,
      customerPhone,
      storeId,
      notes: notes || 'Mua tại cửa hàng - Chờ thanh toán'
    },
    items.map(item => ({
      fabricId: item.fabricId,
      quantity: item.quantity,
      saleUnit: item.saleUnit,
      price: item.price,
      costPrice: item.costPrice
    })),
    {
      invoiceStatus: 'UNPAID',
      totalAmount,
      paidAmount: 0,
      creditAmount: 0,
      paymentType: 'CASH',
      paymentDeadline:  new Date(Date.now() + 15 * 60 * 1000),
      notes: 'Thanh toán tại cửa hàng số tiền : ' + totalAmount + 'đ'
    },
    createDeductStockCallback(items),
    false
  );

  return {
    order,
    requiresPayment: true,
    paymentInstructions: {
      invoiceId:  order.invoice.id,
      amount: totalAmount,
      method: paymentMethod, // 'QR' hoặc 'DIRECT'
    },
    message:  paymentMethod === 'QR' 
      ? 'Vui lòng tạo mã QR để thanh toán' 
      : 'Vui lòng xác nhận khách hàng đã thanh toán'
  };
};

// Offline - CREDIT
const createOfflineCreditOrder = async (customer, staffId, items, totalAmount, customerPhone,paymentMethod = 'DIRECT', storeId, notes) => {
  if (!customer.creditRegistration || customer.creditRegistration.status !== 'APPROVED') {
    throw new BadRequestError('Khách hàng không được phép mua nợ');
  }
  const { creditLimit, creditUsed  } = customer.creditRegistration;
  const { creditAmount, excessAmount, requiresPayment } = calculateCreditSplit(totalAmount, creditLimit, creditUsed );

  if (requiresPayment) {
    // Tự động xử lý: khách sẽ thanh toán phần vượt hạn mức ngay
    return await createOfflineCreditOrderWithExcess(customer.id, staffId, items, totalAmount, creditAmount, excessAmount, customerPhone,paymentMethod, storeId, notes);
  } else {
    return await createOfflineFullCreditOrder(customer.id, staffId, items, totalAmount,creditAmount, customerPhone,paymentMethod, storeId,notes);
  }
};

// Offline - CREDIT trong hạn mức
const createOfflineFullCreditOrder = async (customerId, staffId, items, totalAmount, creditAmount, customerPhone,paymentMethod, storeId, notes) => {
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
      price: item.price,
      costPrice: item.costPrice
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
const createOfflineCreditOrderWithExcess = async (customerId, staffId, items, totalAmount, creditAmount, excessAmount, customerPhone,paymentMethod, storeId, notes) => {
  const creditInvoice = await getOrCreateMonthlyCreditInvoice(customerId)

  const order = await orderRepository.createOrderWithTransaction(
    {
      userId: customerId,
      status: 'PENDING',
      totalAmount,
      isOffline: true,
      createdByStaffId: staffId,
      customerPhone,
      storeId,
      notes: notes || `Ghi nợ ${creditAmount.toLocaleString('vi-VN')}đ + Chờ thanh toán ${excessAmount.toLocaleString('vi-VN')}đ`
    },
    items.map(item => ({
      fabricId: item.fabricId,
      quantity: item.quantity,
      saleUnit: item.saleUnit,
      price: item.price,
      costPrice: item.costPrice
    })),
    {
      invoiceStatus: 'UNPAID',
      totalAmount,
      paidAmount: 0,
      creditAmount,
      paymentType: 'CREDIT',
      paymentDeadline: new Date(Date.now() + 15 * 60 * 1000),
      creditInvoiceId: creditInvoice.id,
      notes: `Ghi nợ: ${creditAmount.toLocaleString('vi-VN')}đ | Cần thanh toán: ${excessAmount.toLocaleString('vi-VN')}đ`
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
    requiresPayment: true,
    excessAmount,
    creditInvoiceId: creditInvoice.id,
    paymentInstructions: {
      invoiceId: order.invoice.id,
      amount: excessAmount, // thanh toán phần vượt
      method: paymentMethod,
    },
    message: paymentMethod === 'QR'
      ? `Ghi nợ ${creditAmount.toLocaleString('vi-VN')}đ. Vui lòng tạo mã QR để thanh toán phần vượt ${excessAmount.toLocaleString('vi-VN')}đ`
      : `Ghi nợ ${creditAmount.toLocaleString('vi-VN')}đ. Vui lòng xác nhận khách hàng đã thanh toán ${excessAmount.toLocaleString('vi-VN')}đ`
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

// CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG SANG DELIVERED
export const updateOrderStatusToDelivered = async (orderId) => {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new NotFoundError('Không tìm thấy đơn hàng');
  }

  //Cập nhật trạng thái đơn hàng sang DELIVERED
  const updatedOrder = await orderRepository. updateById(orderId, {
    status: 'DELIVERED'
  });

  return updatedOrder;
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

export const getOrdersByStore = async (storeId, queryOptions) => {
  return await orderRepository.findByStoreIdWithQuery(storeId, queryOptions);
};
