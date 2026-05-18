import {MAX_SIZE} from '../constants.js';
import {generateFileInfo, inferRemoteFileName} from '../file-info.js';
import {consumeRateLimit} from '../rate-limit.js';
import {httpError, jsonOk} from '../response.js';
import {AwsClient} from '../storage/aws-client.js';
import {assertR2Env, createPublicUrl, createR2ObjectUrl} from '../storage/r2-url.js';

const REMOTE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function handleCloudTransfer({request, env, formData}) {
    assertR2Env(env);

    const fileUrl = String(formData.get('url') || '').trim();
    if (!fileUrl) {
        throw httpError('缺少远程文件链接。', 400);
    }

    const parsedUrl = parseRemoteUrl(fileUrl);
    const rateLimit = await consumeRateLimit({env, request});
    const remoteRes = await fetchRemoteFile(parsedUrl.toString());
    const contentLength = remoteRes.headers.get('content-length');
    if (contentLength && Number.parseInt(contentLength, 10) > MAX_SIZE) {
        throw httpError('远程文件超过 2 GB，无法转存。', 400);
    }

    const finalFileName = inferRemoteFileName(fileUrl, remoteRes);
    const {finalKey} = generateFileInfo(finalFileName);
    const contentType = remoteRes.headers.get('content-type') || 'application/octet-stream';
    const client = new AwsClient({
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY
    });
    const signedPutUrl = await client.sign('PUT', createR2ObjectUrl(env, finalKey), {
        'Content-Type': contentType
    });
    const uploadRes = await fetch(signedPutUrl, {
        method: 'PUT',
        body: remoteRes.body,
        headers: {
            'Content-Type': contentType
        }
    });

    if (!uploadRes.ok) {
        throw httpError(`R2 写入失败，状态码 ${uploadRes.status}。`, 502);
    }

    return jsonOk({
        publicUrl: createPublicUrl(env, finalKey),
        ...rateLimit
    });
}

function parseRemoteUrl(fileUrl) {
    let url;
    try {
        url = new URL(fileUrl);
    } catch {
        throw httpError('远程链接格式无效。', 400);
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw httpError('远程链接只允许 http 或 https。', 400);
    }

    return url;
}

async function fetchRemoteFile(fileUrl) {
    let response;
    try {
        response = await fetch(fileUrl, {
            method: 'GET',
            headers: {
                'User-Agent': REMOTE_USER_AGENT,
                Referer: 'https://photos.google.com/'
            },
            redirect: 'follow'
        });
    } catch (error) {
        throw httpError(`远程连接失败：${error.message}`, 502);
    }

    if (!response.ok) {
        throw httpError(`远程抓取失败，状态码 ${response.status}。`, 502);
    }

    return response;
}
