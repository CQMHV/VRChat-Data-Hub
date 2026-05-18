import {handleCloudTransfer} from './actions/cloud-transfer.js';
import {handleSignUpload} from './actions/sign-upload.js';
import {requireAuth} from './auth.js';
import {jsonError} from './response.js';

export async function handleApiRequest(request, env) {
    if (request.method !== 'POST') {
        return jsonError('只支持 POST 请求。', 405);
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/?/, '');

    try {
        const formData = await request.formData();
        await requireAuth(formData.get('password'), env.AUTH_SECRET);

        if (path === 'sign-upload') {
            return handleSignUpload({request, env, formData});
        }

        if (path === 'cloud-transfer') {
            return handleCloudTransfer({request, env, formData});
        }

        return jsonError('未知的 API 操作。', 404);
    } catch (error) {
        const status = Number.isInteger(error.status) ? error.status : 500;
        return jsonError(error.message || '服务器处理失败。', status);
    }
}
