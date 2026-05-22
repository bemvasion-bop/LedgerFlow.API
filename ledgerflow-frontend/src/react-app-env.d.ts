/// <reference types="react-scripts" />

/**
 * Environment variables type definitions for Create React App
 */
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    REACT_APP_API_URL?: string;
    REACT_APP_API_BASE_URL?: string;
  }
}
