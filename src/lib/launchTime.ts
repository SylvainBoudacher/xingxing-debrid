// Captured at first import (from main.tsx, evaluated eagerly at process start),
// so anything timed off "app launch" stays accurate regardless of how long
// splash/network loading delays later, lazy-loaded components.
export const APP_LAUNCH_TS = Date.now();
