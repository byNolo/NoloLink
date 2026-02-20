import '@testing-library/jest-dom';

// Mock import.meta.env defaults
Object.defineProperty(import.meta, 'env', {
    value: {
        VITE_API_URL: 'http://localhost:3071',
        VITE_SHORT_LINK_DOMAIN: 'http://localhost:3071',
        MODE: 'test',
        DEV: true,
        PROD: false,
        SSR: false,
    },
    writable: true,
});
