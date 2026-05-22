/**
 * API Configuration
 * Centralized API base URL configuration
 */

// Get API base URL from environment variable or use default
// Note: Create React App uses process.env, not import.meta.env
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5256';

// API endpoint base (for axios requests)
export const API_ENDPOINT = `${API_BASE_URL}/api`;

/**
 * Construct full URL for uploaded files
 * Handles both absolute and relative URLs
 */
export const getFileUrl = (filePath: string | undefined): string => {
  if (!filePath) return '';
  
  // If already absolute URL, return as-is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // If relative path, prepend API base URL
  // Ensure no double slashes
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${API_BASE_URL}${cleanPath}`;
};

/**
 * Construct receipt URL specifically
 */
export const getReceiptUrl = (fileUrl: string | undefined): string => {
  return getFileUrl(fileUrl);
};
