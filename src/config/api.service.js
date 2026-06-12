/**
 * API Service Example
 * 
 * This file demonstrates how to use the api.config.js in your API calls
 * Replace this with your actual API service implementation
 */

import apiConfig from './api.config';

/**
 * Generic fetch wrapper with error handling
 * @param {string} endpoint - The API endpoint (e.g., '/users', '/cards')
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<object>} The API response
 */
export const apiFetch = async (endpoint, options = {}) => {
  const url = apiConfig.getEndpoint(endpoint);

  const config = {
    headers: {
      ...apiConfig.getDefaultHeaders(),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // Handle non-2xx responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API Error: ${response.status} - ${errorData.message || response.statusText}`
      );
    }

    // Return parsed JSON response
    return await response.json();
  } catch (error) {
    console.error(`❌ API Request Failed [${endpoint}]:`, error.message);
    throw error;
  }
};

/**
 * GET request helper
 */
export const apiGet = (endpoint, options = {}) => {
  return apiFetch(endpoint, { ...options, method: 'GET' });
};

/**
 * POST request helper
 */
export const apiPost = (endpoint, body, options = {}) => {
  return apiFetch(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
};

/**
 * PUT request helper
 */
export const apiPut = (endpoint, body, options = {}) => {
  return apiFetch(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });
};

/**
 * DELETE request helper
 */
export const apiDelete = (endpoint, options = {}) => {
  return apiFetch(endpoint, { ...options, method: 'DELETE' });
};

/**
 * USAGE EXAMPLES:
 * 
 * // GET request
 * const users = await apiGet('/users');
 * 
 * // POST request
 * const newCard = await apiPost('/cards', {
 *   front: 'Hello',
 *   back: 'World'
 * });
 * 
 * // PUT request
 * const updated = await apiPut(`/cards/${cardId}`, {
 *   front: 'Updated'
 * });
 * 
 * // DELETE request
 * await apiDelete(`/cards/${cardId}`);
 * 
 * // With custom headers
 * const data = await apiGet('/protected', {
 *   headers: { 'Authorization': 'Bearer token' }
 * });
 */

export default {
  apiFetch,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  config: apiConfig,
};
