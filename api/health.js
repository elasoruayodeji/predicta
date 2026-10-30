// Vercel serverless function: Health check
export default function handler(req, res) {
  const hasKey = !!process.env.INVESTO_API_KEY;
  
  res.status(200).json({
    ok: true,
    investoConfigured: hasKey,
    serverTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}
