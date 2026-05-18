import {httpError} from './response.js';

export async function requireAuth(password, secret) {
    if (!secret) {
        throw httpError('服务端缺少 AUTH_SECRET 配置。', 500);
    }

    const passwordHash = await sha256Bytes(String(password || ''));
    const secretHash = await sha256Bytes(String(secret));

    if (!timingSafeEqual(passwordHash, secretHash)) {
        throw httpError('口令不正确。', 403);
    }
}

async function sha256Bytes(value) {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return new Uint8Array(hash);
}

function timingSafeEqual(left, right) {
    if (left.length !== right.length) {
        return false;
    }

    let diff = 0;
    for (let i = 0; i < left.length; i += 1) {
        diff |= left[i] ^ right[i];
    }
    return diff === 0;
}
