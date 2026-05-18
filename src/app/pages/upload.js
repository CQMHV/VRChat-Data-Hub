import {requestCloudTransfer, requestUploadSignature, uploadFileToSignedUrl} from '../api/upload-api.js';

const MAX_SIZE = 2 * 1024 * 1024 * 1024;

export const uploadPage = {
    title: '上传中心',
    body: `
        <p class="page-body">上传中心保留原有的本地签名上传和云端转存能力，接口已经拆到 Cloudflare API 层。</p>
        <div class="upload-grid">
            <section class="card upload-panel" aria-labelledby="local-upload-title">
                <h2 class="card__title" id="local-upload-title">本地上传</h2>
                <p class="page-body">先获取 R2 预签名 URL，再由浏览器直接上传文件。</p>
                <md-outlined-text-field class="upload-field" id="local-password" type="password" label="上传口令"></md-outlined-text-field>
                <label class="file-picker" for="local-file">
                    <span class="material-symbols-outlined" aria-hidden="true">upload_file</span>
                    <span id="local-file-label">选择文件或拖放到这里</span>
                    <input id="local-file" type="file" />
                </label>
                <p class="upload-hint">单个文件最大 2 GB。</p>
                <md-linear-progress class="upload-progress" id="local-progress" value="0"></md-linear-progress>
                <p class="upload-status" id="local-status">等待选择文件。</p>
                <div class="card__actions">
                    <md-filled-tonal-button id="local-submit">开始上传</md-filled-tonal-button>
                </div>
            </section>
            <section class="card upload-panel" aria-labelledby="cloud-transfer-title">
                <h2 class="card__title" id="cloud-transfer-title">云端转存</h2>
                <p class="page-body">Worker 从远端链接读取文件流，并写入 R2。</p>
                <md-outlined-text-field class="upload-field" id="cloud-password" type="password" label="上传口令"></md-outlined-text-field>
                <md-outlined-text-field class="upload-field" id="cloud-url" label="远程文件链接"></md-outlined-text-field>
                <p class="upload-hint">当前基础实现会在请求内完成转存，后续会升级为异步任务。</p>
                <md-linear-progress class="upload-progress" id="cloud-progress" value="0"></md-linear-progress>
                <p class="upload-status" id="cloud-status">等待填写链接。</p>
                <div class="card__actions">
                    <md-filled-tonal-button id="cloud-submit">开始转存</md-filled-tonal-button>
                </div>
            </section>
        </div>
        <section class="card card--emphasis result-panel" id="upload-result" hidden>
            <h2 class="card__title">处理完成</h2>
            <p id="result-summary">文件已经写入 R2。</p>
            <div class="result-links">
                <md-outlined-text-field class="upload-field" id="result-original" label="原链接" readonly></md-outlined-text-field>
                <md-outlined-text-field class="upload-field" id="result-encoded" label="兼容链接" readonly></md-outlined-text-field>
            </div>
            <p class="upload-status" id="result-limit"></p>
            <div class="card__actions">
                <md-filled-tonal-button id="copy-original">复制原链接</md-filled-tonal-button>
                <md-filled-tonal-button id="copy-encoded">复制兼容链接</md-filled-tonal-button>
            </div>
        </section>
    `,
    init() {
        const localPassword = document.getElementById('local-password');
        const localFile = document.getElementById('local-file');
        const localFileLabel = document.getElementById('local-file-label');
        const localSubmit = document.getElementById('local-submit');
        const localProgress = document.getElementById('local-progress');
        const localStatus = document.getElementById('local-status');
        const cloudPassword = document.getElementById('cloud-password');
        const cloudUrl = document.getElementById('cloud-url');
        const cloudSubmit = document.getElementById('cloud-submit');
        const cloudProgress = document.getElementById('cloud-progress');
        const cloudStatus = document.getElementById('cloud-status');
        const resultPanel = document.getElementById('upload-result');
        const resultOriginal = document.getElementById('result-original');
        const resultEncoded = document.getElementById('result-encoded');
        const resultLimit = document.getElementById('result-limit');

        localFile.addEventListener('change', () => {
            const file = localFile.files[0];
            localFileLabel.textContent = file ? `${file.name} (${formatSize(file.size)})` : '选择文件或拖放到这里';
            localStatus.textContent = file && file.size > MAX_SIZE ? '文件超过 2 GB，无法上传。' : '已选择文件。';
        });

        localSubmit.addEventListener('click', async () => {
            const file = localFile.files[0];
            if (!localPassword.value || !file) {
                setStatus(localStatus, '请先填写口令并选择文件。', true);
                return;
            }
            if (file.size > MAX_SIZE) {
                setStatus(localStatus, '文件超过 2 GB，无法上传。', true);
                return;
            }

            setBusy([localSubmit, cloudSubmit], true);
            setProgress(localProgress, 0);
            setStatus(localStatus, '正在申请上传签名...');

            try {
                const signData = await requestUploadSignature({password: localPassword.value, file});
                setStatus(localStatus, '正在上传到 R2...');
                await uploadFileToSignedUrl({
                    file,
                    signedUrl: signData.signedUrl,
                    onProgress: (loaded, total) => {
                        setProgress(localProgress, loaded / total);
                        setStatus(localStatus, `${formatSize(loaded)} / ${formatSize(total)}`);
                    }
                });
                showResult({data: signData, resultPanel, resultOriginal, resultEncoded, resultLimit});
                setStatus(localStatus, '上传完成。');
            } catch (error) {
                setStatus(localStatus, error.message, true);
            } finally {
                setBusy([localSubmit, cloudSubmit], false);
            }
        });

        cloudSubmit.addEventListener('click', async () => {
            if (!cloudPassword.value || !cloudUrl.value) {
                setStatus(cloudStatus, '请先填写口令和远程链接。', true);
                return;
            }
            if (!/^https?:\/\//i.test(cloudUrl.value)) {
                setStatus(cloudStatus, '链接必须以 http:// 或 https:// 开头。', true);
                return;
            }

            setBusy([localSubmit, cloudSubmit], true);
            cloudProgress.indeterminate = true;
            setStatus(cloudStatus, '正在云端转存...');

            try {
                const data = await requestCloudTransfer({password: cloudPassword.value, url: cloudUrl.value});
                showResult({data, resultPanel, resultOriginal, resultEncoded, resultLimit});
                setStatus(cloudStatus, '转存完成。');
            } catch (error) {
                setStatus(cloudStatus, error.message, true);
            } finally {
                cloudProgress.indeterminate = false;
                setProgress(cloudProgress, 0);
                setBusy([localSubmit, cloudSubmit], false);
            }
        });

        document.getElementById('copy-original').addEventListener('click', () => copyField(resultOriginal));
        document.getElementById('copy-encoded').addEventListener('click', () => copyField(resultEncoded));
    }
};

function formatSize(bytes) {
    if (!bytes) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function setBusy(buttons, busy) {
    buttons.forEach((button) => {
        button.disabled = busy;
    });
}

function setProgress(progress, value) {
    progress.value = Math.max(0, Math.min(1, value));
}

function setStatus(element, message, isError = false) {
    element.textContent = message;
    element.dataset.status = isError ? 'error' : 'normal';
}

function showResult({data, resultPanel, resultOriginal, resultEncoded, resultLimit}) {
    const encodedUrl = data.publicUrl;
    const originalUrl = decodeURIComponent(encodedUrl);
    resultEncoded.value = encodedUrl;
    resultOriginal.value = originalUrl;
    resultLimit.textContent = `本时段剩余额度：${data.remaining} / ${data.limit}`;
    resultPanel.hidden = false;
}

async function copyField(field) {
    await navigator.clipboard.writeText(field.value);
}
