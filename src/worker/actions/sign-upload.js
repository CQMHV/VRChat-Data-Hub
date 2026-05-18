import {MAX_SIZE} from '../constants.js';
import {generateFileInfo} from '../file-info.js';
import {consumeRateLimit} from '../rate-limit.js';
import {httpError, jsonOk} from '../response.js';
import {AwsClient} from '../storage/aws-client.js';
import {assertR2Env, createPublicUrl, createR2ObjectUrl} from '../storage/r2-url.js';

export async function handleSignUpload({request, env, formData}) {
    assertR2Env(env);

    const fileName = formData.get('filename');
    const fileType = formData.get('filetype') || 'application/octet-stream';
    const fileSize = Number.parseInt(formData.get('filesize') || '0', 10);

    if (!fileName) {
        throw httpError('缺少文件名。', 400);
    }
    if (!Number.isFinite(fileSize) || fileSize < 0) {
        throw httpError('文件大小无效。', 400);
    }
    if (fileSize > MAX_SIZE) {
        throw httpError('文件超过 2 GB，无法上传。', 400);
    }

    const rateLimit = await consumeRateLimit({env, request});
    const client = new AwsClient({
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY
    });
    const {finalKey} = generateFileInfo(fileName);
    const signedUrl = await client.sign('PUT', createR2ObjectUrl(env, finalKey), {
        'Content-Type': String(fileType)
    });

    return jsonOk({
        signedUrl,
        publicUrl: createPublicUrl(env, finalKey),
        ...rateLimit
    });
}
