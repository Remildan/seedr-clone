/**
 * Authentication utility functions
 * Handles token storage and retrieval from localStorage
 */

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

/**
 * Save authentication token to localStorage
 */
export const saveToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

/**
 * Get authentication token from localStorage
 */
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY)
  }
  return null
}

/**
 * Remove authentication token from localStorage
 */
export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
}

/**
 * Save user data to localStorage
 */
export const saveUser = (user: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

/**
 * Get user data from localStorage
 */
export const getUser = (): any | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem(USER_KEY)
    return userStr ? JSON.parse(userStr) : null
  }
  return null
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return getToken() !== null
}

/**
 * Logout user (clear all auth data)
 */
export const logout = () => {
  removeToken()
  // Disconnect socket if connected
  if (typeof window !== 'undefined') {
    const { disconnectSocket } = require('./socket')
    disconnectSocket()
  }
}

