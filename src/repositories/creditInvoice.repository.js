import { PrismaClient } from '@prisma/client';
import { buildWhereClause, buildPagination, buildSort, formatPaginatedResponse } from '../utils/query-builder.js';

const prisma = new PrismaClient();


const creditInvoiceSelectOptions = {
  id: true,
  creditId: true,
  dueDate: true,
  totalCreditAmount: true,
  creditPaidAmount: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  credit: {
    select: {
      id: true,
      userId: true,
      creditLimit: true,
      status: true,
      user: {
        select: {
          id: true,
          fullname: true,
          email: true,
          phone: true
        }
      }
    }
  },
  invoice: {
    select: {
      id: true,
      invoiceDate: true,
      invoiceStatus: true,
      totalAmount: true,
      creditAmount: true,
      paidAmount: true,
      orderId: true,
      order: {
        select: {
          id: true,
          orderDate: true,
          status: true,
          totalAmount: true,
          notes: true
        }
      }
    }
  },
  payment: {
    select: {
      id: true,
      status: true,
      amount: true,
      paymentDate: true,
      paymentMethod: true,
      transactionId: true
    }
  }
};


// ADMIN/STAFF Lấy tất cả Credit Invoice
export const findAll = async (queryOptions = {}) => {
  const { 
    page = 1, 
    limit = 10, 
    search = '',
    sortBy = 'createdAt', 
    order = 'desc',
    filters = {}
  } = queryOptions;
  
  const searchableFields = [];
  const where = buildWhereClause(
    { search, ...filters },
    searchableFields
  );
  
  if (search) {
    where. credit = {
      user: {
        OR: [
          { fullname: { contains: search}},
          { email: { contains: search}},
          { phone: { contains: search } }
        ]
      }
    };
  }
  
  const { skip, take } = buildPagination(page, limit);
  const orderBy = buildSort(sortBy, order);
  
  const [creditInvoices, total] = await Promise.all([
    prisma.creditInvoice. findMany({
      where,
      skip,
      take,
      select: creditInvoiceSelectOptions,
      orderBy
    }),
    prisma.creditInvoice.count({ where })
  ]);
  
  return formatPaginatedResponse(creditInvoices, total, page, take);
};


// Lấy Credit Invoice theo userId 
export const findByUserId = async (userId, queryOptions = {}) => {
  const { 
    page = 1, 
    limit = 10, 
    search = '',
    sortBy = 'dueDate', 
    order = 'desc',
    filters = {}
  } = queryOptions;
  
  const searchableFields = [];
  const where = buildWhereClause(
    { search, ... filters },
    searchableFields
  );
  
  where.credit = { userId };
  
  const { skip, take } = buildPagination(page, limit);
  
  const orderBy = buildSort(sortBy, order);
  
  const [creditInvoices, total] = await Promise.all([
    prisma.creditInvoice.findMany({
      where,
      skip,
      take,
      select: creditInvoiceSelectOptions,
      orderBy
    }),
    prisma.creditInvoice.count({ where })
  ]);
  
  return formatPaginatedResponse(creditInvoices, total, page, take);
};

export const findById = async (id) => {
  return await prisma.creditInvoice.findUnique({
    where: { id: parseInt(id) },
    select: creditInvoiceSelectOptions
  });
};
