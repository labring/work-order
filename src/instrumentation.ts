export const register = async () => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initConfig } = await import('@/services/backend/config');
    initConfig();
  }
};
