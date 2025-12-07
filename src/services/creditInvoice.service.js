import * as creditInvoiceRepository from '../repositories/creditInvoice.repository.js';
import { NotFoundError} from '../utils/errors.js';

export const getMyCreditInvoices = async (userId, queryOptions) => {
  return await creditInvoiceRepository.findByUserId(userId, queryOptions);
};

export const getAllCreditInvoices = async (queryOptions) => {
  return await creditInvoiceRepository.findAll(queryOptions);
};

export const getCreditInvoiceDetail = async (creditInvoiceId) => {
  const creditInvoice = await creditInvoiceRepository.findById(creditInvoiceId);
  
  if (!creditInvoice) {
    throw new NotFoundError('Không tìm thấy Credit Invoice');
  }
  return creditInvoice;
};