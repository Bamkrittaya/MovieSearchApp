// utils/fetchWithAuth.js

export const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }
  
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  
    // If the token is expired (401 Unauthorized), refresh the token
    if (response.status === 401) {
      console.log('Token expired, refreshing...');
      await refreshToken(); // Call refresh function
  
      // Retry the request with the new token
      const newToken = localStorage.getItem('token');
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    }
  
    return response.json();
  };

const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      console.error('No refresh token found');
      return;
    }
  
    try {
      const res = await fetch('http://4.237.58.241:3000/user/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
        }),
      });
  
      const data = await res.json();
  
      if (res.ok && data.token && data.refreshToken) {
        setToken(data.token, data.refreshToken); // Save the new token
      } else {
        console.error('Failed to refresh token:', data);
        clearToken(); // Clear localStorage and force re-login
      }
    } catch (err) {
      console.error('Error refreshing token:', err);
      clearToken(); // Clear localStorage and force re-login
    }
};

const setToken = (token, refreshToken) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    console.log('Tokens saved:', token, refreshToken); // Log tokens for debugging
};

const clearToken = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    console.log("Tokens cleared");
};
