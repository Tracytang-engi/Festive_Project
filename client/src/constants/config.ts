/** App frontend origin for share links. Override via VITE_APP_URL in .env */
export const APP_ORIGIN = import.meta.env.VITE_APP_URL || 'https://www.festickers.com';

/** Maintenance mode flag: when true, show static maintenance page instead of full app. */
export const IS_MAINTENANCE =
  typeof import.meta.env.VITE_MAINTENANCE_MODE === 'string'
    ? import.meta.env.VITE_MAINTENANCE_MODE === 'true'
    : false;

