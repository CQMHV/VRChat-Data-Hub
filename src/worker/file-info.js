const FOLDER_BY_EXTENSION = new Map([
    ['mp4', 'videos/'],
    ['webm', 'videos/'],
    ['mkv', 'videos/'],
    ['mov', 'videos/'],
    ['avi', 'videos/'],
    ['png', 'images/'],
    ['jpg', 'images/'],
    ['jpeg', 'images/'],
    ['gif', 'images/'],
    ['webp', 'images/'],
    ['mp3', 'audio/'],
    ['wav', 'audio/'],
    ['flac', 'audio/'],
    ['zip', 'archives/'],
    ['7z', 'archives/'],
    ['rar', 'archives/'],
    ['unitypackage', 'archives/']
]);

export function generateFileInfo(rawFileName) {
    const cleanName = String(rawFileName || 'downloaded_file.bin').split('?')[0];
    const parts = cleanName.split('.');
    const ext = parts.length > 1 ? parts.pop().toLowerCase() : 'bin';
    const baseName = parts.join('.') || 'file';
    const folder = FOLDER_BY_EXTENSION.get(ext) || 'others/';
    const safeBaseName = encodeURIComponent(baseName.replace(/\s+/g, '-').replace(/[()+'!*]/g, '_'));

    return {
        ext,
        finalKey: `${folder}${safeBaseName}.${ext}`
    };
}

export function inferRemoteFileName(fileUrl, response) {
    const disposition = response.headers.get('content-disposition');
    const dispositionName = getDispositionFileName(disposition);
    if (dispositionName) {
        return dispositionName;
    }

    try {
        const url = new URL(fileUrl);
        const pathName = url.pathname.split('/').pop();
        if (pathName && pathName.length < 120 && pathName.includes('.')) {
            return decodeURIComponent(pathName);
        }
    } catch {
        return `unknown_${Date.now()}.bin`;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('video')) {
        return `remote_video_${Date.now()}.mp4`;
    }
    if (contentType.includes('image')) {
        return `remote_image_${Date.now()}.jpg`;
    }
    return `remote_file_${Date.now()}.bin`;
}

function getDispositionFileName(disposition) {
    if (!disposition) {
        return null;
    }

    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        return decodeURIComponent(utf8Match[1].trim());
    }

    const match = disposition.match(/filename=['"]?([^'";]+)['"]?/i);
    if (match?.[1]) {
        return decodeURIComponent(match[1].trim());
    }

    return null;
}
