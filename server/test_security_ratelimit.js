const { authLimiter, apiLimiter, securityHeaders } = require('./middleware/rateLimiter');

const testSecurityMiddleware = () => {
  console.log('===============================================================');
  console.log('🔒 TESTING PRODUCTION SECURITY & RATE LIMITING MIDDLEWARE');
  console.log('===============================================================');

  // Mock Express Req & Res
  const mockReq = {
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    baseUrl: '/api/auth',
    path: '/login',
    originalUrl: '/api/auth/login',
  };

  const headersSet = {};
  const mockRes = {
    setHeader: (key, val) => {
      headersSet[key] = val;
    },
    status: (code) => ({
      json: (data) => console.log(`[Rate Limit Exceeded Test] Status ${code}:`, data),
    }),
  };

  // 1. Test Security Headers
  securityHeaders(mockReq, mockRes, () => {});
  console.log('✅ Security Headers Test:');
  console.log('   X-Content-Type-Options :', headersSet['X-Content-Type-Options']);
  console.log('   X-Frame-Options        :', headersSet['X-Frame-Options']);
  console.log('   X-XSS-Protection       :', headersSet['X-XSS-Protection']);

  // 2. Test Auth Limiter
  let passCount = 0;
  for (let i = 1; i <= 12; i++) {
    authLimiter(mockReq, mockRes, () => {
      passCount++;
    });
  }

  console.log(`\n✅ Rate Limiter Counter Test: Passed ${passCount}/10 allowed attempts.`);
  console.log('   X-RateLimit-Limit     :', headersSet['X-RateLimit-Limit']);
  console.log('   X-RateLimit-Remaining :', headersSet['X-RateLimit-Remaining']);

  if (headersSet['X-RateLimit-Limit'] === 10 && passCount === 10) {
    console.log('\n===============================================================');
    console.log('🎉 PRODUCTION SECURITY & RATE LIMITING TEST PASSED 100%!');
    console.log('===============================================================');
  } else {
    console.error('❌ Test failed.');
  }
};

testSecurityMiddleware();
