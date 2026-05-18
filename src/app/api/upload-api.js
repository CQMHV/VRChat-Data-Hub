export async function requestCloudTransfer({password, url}) {
    const formData = new FormData();
    formData.append('password', password);
    formData.append('url', url);

    const response = await fetch('/api/cloud-transfer', {
        method: 'POST',
        body: formData
    });
    return readApiResponse(response);
}

export async function requestUploadSignature({password, file}) {
    const formData = new FormData();
    formData.append('password', password);
    formData.append('filename', file.name);
    formData.append('filetype', file.type || 'application/octet-stream');
    formData.append('filesize', String(file.size));

    const response = await fetch('/api/sign-upload', {
        method: 'POST',
        body: formData
    });
    return readApiResponse(response);
}

export function uploadFileToSignedUrl({file, signedUrl, onProgress}) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                onProgress?.(event.loaded, event.total);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
                return;
            }
            reject(new Error(`上传失败，R2 返回 ${xhr.status}`));
        };

        xhr.onerror = () => reject(new Error('上传连接失败'));
        xhr.send(file);
    });
}

async function readApiResponse(response) {
    const data = await response.json().catch(() => ({
        success: false,
        msg: '接口返回了无法解析的数据'
    }));

    if (!response.ok || !data.success) {
        throw new Error(data.msg || `请求失败，状态码 ${response.status}`);
    }

    return data;
}
