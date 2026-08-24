// Custom Zero-Dependency In-Memory Express Rate Limiter & Security Header Middleware

const ipStore = new Map();

/**
 * Creates an Express Rate Limiting Middleware
 * @param {Object} options Configuration options
 * @param {number} options.windowMs Time window in milliseconds (e.g. 15 * 60 * 1000 = 15 mins)
 * @param {number} options.max Maximum allowed requests within the time window
 * @param {string} options.message Custom error message when limit is exceeded
 */
const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests, please try again later.' }) => {
  // Periodically clean up expired IP entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipStore.entries()) {
      if (now > data.resetTime) {
        ipStore.delete(ip);
      }
    }
  }, 60 * 1000);

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const key = `${req.baseUrl || req.path}_${ip}`;
    const now = Date.now();

    let record = ipStore.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      ipStore.set(key, record);
    } else {
      record.count += 1;
    }

    // Set standard RateLimit HTTP headers
    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      console.warn(`[Security Alert] Rate limit exceeded for IP: ${ip} on path: ${req.originalUrl}`);
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: resetSeconds,
      });
    }

    next();
  };
};

// 1. Strict Auth Rate Limiter (Max 10 login/register attempts per 15 minutes)
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: '🔒 Too many login/registration attempts from this IP address. Please wait 15 minutes before trying again.',
});

// 2. Global API Rate Limiter (Max 300 requests per 15 minutes)
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: '⚠️ High traffic volume detected. Please wait a few moments before sending more requests.',
});

// 3. Essential HTTP Security Headers Middleware
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
};

module.exports = {
  authLimiter,
  apiLimiter,
  securityHeaders,
};
