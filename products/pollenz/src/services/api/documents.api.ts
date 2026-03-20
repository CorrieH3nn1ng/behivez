import apiClient from './client';

export const documentsApi = {
  downloadUrl(id: string) {
    return `${apiClient.defaults.baseURL}/documents/${id}/download`;
  },

  previewUrl(id: string) {
    return `${apiClient.defaults.baseURL}/documents/${id}/preview`;
  },

  async download(id: string, filename: string) {
    const response = await apiClient.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
