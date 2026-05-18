import {LIMIT_COUNT, LIMIT_WINDOW_SECONDS} from './constants.js';
import {httpError} from './response.js';

export async function consumeRateLimit({env, request}) {
    if (!env.MY_KV) {
        throw httpError('服务端缺少 MY_KV 绑定。', 500);
    }

    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    const kvKey = `rate_${clientIp}`;
    const now = Date.now();
    let record = await env.MY_KV.get(kvKey, {type: 'json'});

    if (!record || record.expireAt <= now) {
        record = {
            count: 0,
            expireAt: now + LIMIT_WINDOW_SECONDS * 1000
        };
    }

    if (record.count >= LIMIT_COUNT) {
        const waitMin = Math.max(1, Math.ceil((record.expireAt - now) / 60000));
        throw httpError(`本时段上传次数已用完，请 ${waitMin} 分钟后再试。`, 429);
    }

    record.count += 1;
    const remainingTtl = Math.max(60, Math.round((record.expireAt - now) / 1000));
    await env.MY_KV.put(kvKey, JSON.stringify(record), {expirationTtl: remainingTtl});

    return {
        limit: LIMIT_COUNT,
        remaining: LIMIT_COUNT - record.count
    };
}
