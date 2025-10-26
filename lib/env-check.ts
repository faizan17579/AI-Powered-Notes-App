// Environment variables check
// This file helps verify that all required environment variables are set

export const checkEnvironmentVariables = () => {
  const requiredVars = {
    MONGODB_URI: process.env.MONGODB_URI,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  return {
    isValid: missingVars.length === 0,
    missingVars,
    hasMongoDB: !!process.env.MONGODB_URI,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
  };
};

export default checkEnvironmentVariables;
