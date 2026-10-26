// In-Memory IP & Key Rate Limiter
class RateLimiter {
    constructor() {
        this.requests = new Map();
        this.cleanupTimer = setInterval(() => this.cleanup(), 60000);
        if (this.cleanupTimer.unref) this.cleanupTimer.unref();
    }

    check(key, maxRequests = 20, windowMs = 60000) {
        const now = Date.now();
        const record = this.requests.get(key) || { count: 0, resetAt: now + windowMs };

        if (now > record.resetAt) {
            record.count = 1;
            record.resetAt = now + windowMs;
            this.requests.set(key, record);
            return { allowed: true, remaining: maxRequests - 1 };
        }

        if (record.count >= maxRequests) {
            return { allowed: false, remaining: 0, resetInMs: record.resetAt - now };
        }

        record.count++;
        this.requests.set(key, record);
        return { allowed: true, remaining: maxRequests - record.count };
    }

    cleanup() {
        const now = Date.now();
        for (const [key, record] of this.requests.entries()) {
            if (now > record.resetAt) {
                this.requests.delete(key);
            }
        }
    }
}

const limiter = new RateLimiter();

function checkRateLimit(req, res, maxRequests = 30, windowMs = 60000) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${ip}:${req.url}`;
    const result = limiter.check(key, maxRequests, windowMs);

    if (!result.allowed) {
        res.writeHead(429, {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(result.resetInMs / 1000)
        });
        res.end(JSON.stringify({ error: 'Too many requests. Please slow down.' }));
        return false;
    }
    return true;
}

module.exports = {
    limiter,
    checkRateLimit
};
