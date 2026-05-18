export function createR2ObjectUrl(env, objectKey) {
    return `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${objectKey}`;
}

export function createPublicUrl(env, objectKey) {
    return `${String(env.PUBLIC_DOMAIN || '').replace(/\/$/, '')}/${objectKey}`;
}

export function assertR2Env(env) {
    const required = [
        'R2_ACCOUNT_ID',
        'R2_BUCKET_NAME',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'PUBLIC_DOMAIN'
    ];
    const missing = required.filter((key) => !env[key]);
    if (missing.length > 0) {
        throw new Error(`服务端缺少 R2 配置：${missing.join(', ')}`);
    }
}
