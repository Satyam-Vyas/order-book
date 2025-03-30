import { jwtDecode } from "jwt-decode"
import axios from "axios";

type UserData = {
  id: string
  name: string
  email: string
  balance: number
  exp: number
}

interface RegisterResponse {
  success: boolean;
  message: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Format error response from API
 */
export function formatErrorResponse(error: any): RegisterResponse {

  if (error.response && error.response.data && typeof error.response.data === "object") {
    const errorDetails = error.response.data;
    const message = Object.entries(errorDetails)
      .map(([field, messages]) => {
        const formattedMessages = Array.isArray(messages)
          ? messages.join(", ")
          : typeof messages === "string"
          ? messages
          : JSON.stringify(messages);
        return `${field}: ${formattedMessages}`;
      })
      .join("; ");
    return { success: false, message };
  }

  const message = typeof error.response?.data === "string" 
    ? error.response.data 
    : error.message || "An unexpected error occurred";
  return { success: false, message };
}

/**
 * Register a new user
 */
export async function registerUser(username: string, email: string, password: string): Promise<RegisterResponse> {
  try {
    if (!API_BASE_URL) {
      throw new Error("API_BASE_URL is not set");
    }

    const response = await axios.post(`${API_BASE_URL}/signup/`, {
      username,
      email,
      password,
    }, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { access, refresh } = response.data;
    saveTokens(access, refresh); // Save tokens to localStorage

    return { success: true, message: "User registered successfully" };
  } catch (error: any) {
    return formatErrorResponse(error);
  }
}

function saveTokens(access: string, refresh: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  }
}

function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token");
  }
  return null;
}

function getRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("refresh_token");
  }
  return null;
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const decoded = jwtDecode<UserData>(refreshToken);
    const currentTime = Math.floor(Date.now() / 1000);

    if (decoded.exp < currentTime) {
      return false;
    }

    const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
      refresh: refreshToken,
    }, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { access } = response.data;
    saveTokens(access, refreshToken);
    return true;
  } catch (error) {
    console.log("Failed to refresh access token:", error);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return false;
  }
}

/**
 * Login a user
 */
export async function loginUser(email: string, password: string): Promise<RegisterResponse> {
  try {
    if (!API_BASE_URL) {
      throw new Error("API_BASE_URL is not set");
    }

    const response = await axios.post(`${API_BASE_URL}/login/`, {
      email,
      password,
    }, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { access, refresh } = response.data;
    saveTokens(access, refresh); 

    return { success: true, message: "Login successful" };
  } catch (error: any) {
    return formatErrorResponse(error);
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const token = getAccessToken();

  if (!token) {
    return false;
  }

  try {
    const decoded = jwtDecode<UserData>(token);
    const currentTime = Math.floor(Date.now() / 1000); 

    if (decoded.exp < currentTime) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        return false;
      }
      return true;
    }

    return true;
  } catch (error) {
    console.log("Invalid access token:", error);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return false;
  }
}

export async function getCurrentUser(): Promise<UserData | null> {
  const token = getAccessToken();

  if (!token) {
    return null;
  }

  try {
    const decoded = jwtDecode<UserData>(token);
    const currentTime = Date.now() / 1000;

    if (decoded.exp < currentTime) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        return null;
      }
      return getCurrentUser(); 
    }

    return decoded;
  } catch (error) {
    console.log("Invalid access token:", error);
    return null;
  }
}