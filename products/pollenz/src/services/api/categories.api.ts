import apiClient from './client';
import type { ExpenseCategory } from '@/types';

export const categoriesApi = {
  list() {
    return apiClient.get<{ data: ExpenseCategory[] }>('/categories');
  },

  create(data: { name: string; icon?: string; color?: string; is_tax_deductible?: boolean }) {
    return apiClient.post<{ data: ExpenseCategory }>('/categories', data);
  },
};
