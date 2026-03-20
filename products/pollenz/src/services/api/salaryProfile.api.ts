import apiClient from './client';
import type { SalaryProfile, Payslip } from '@/types';

export const salaryProfileApi = {
  get() {
    return apiClient.get<{ data: SalaryProfile }>('/salary-profile');
  },

  update(data: Partial<SalaryProfile>) {
    return apiClient.put<{ data: SalaryProfile }>('/salary-profile', data);
  },

  extractPayslip(file: File) {
    const formData = new FormData();
    formData.append('payslip', file);
    return apiClient.post<{ data: Payslip; profile: SalaryProfile; message: string }>(
      '/salary-profile/extract',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  listPayslips() {
    return apiClient.get<{ data: Payslip[]; summary: { total_gross: number; total_net: number; total_paye: number; count: number } }>(
      '/payslips',
    );
  },

  deletePayslip(id: string) {
    return apiClient.delete(`/payslips/${id}`);
  },
};
