// Save the token and refresh token to localStorage
export function setToken(token, refreshToken) {
    if (!token || !refreshToken) {
      console.error("setToken error: Both token and refreshToken must be provided.");
      return;
    }
  
    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);
    console.log("Tokens saved:", token, refreshToken); // Log tokens for debugging

  }
  
  // Retrieve the bearer token from localStorage
  export function getToken() {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("getToken : No token found in localStorage.");
    }
    return token;
  }
  
  // Retrieve the refresh token from localStorage
  export function getRefreshToken() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      console.error("getRefreshToken error: No refresh token found in localStorage.");
    }
    return refreshToken;
  }
  
  // Clear both the token and refresh token from localStorage
  export function clearToken() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  }
  