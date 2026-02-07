const isProduction = import.meta.env.MODE === 'production';

export const API_BASE_URL = isProduction
    ? 'https://disaster.goserveph.com/backend'
    : 'http://localhost/gsm/backend';
