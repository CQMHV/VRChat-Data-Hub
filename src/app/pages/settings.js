export const settingsPage = {
    title: '设置',
    body: `
        <p class="page-body">这里先作为部署检查清单，后续可以接入管理配置。</p>
        <div class="card">
            <h2 class="card__title">Cloudflare 绑定</h2>
            <ul>
                <li><code>AUTH_SECRET</code>：上传口令。</li>
                <li><code>R2_ACCOUNT_ID</code>、<code>R2_BUCKET_NAME</code>：R2 账户和桶名。</li>
                <li><code>R2_ACCESS_KEY_ID</code>、<code>R2_SECRET_ACCESS_KEY</code>：R2 S3 API 凭据。</li>
                <li><code>PUBLIC_DOMAIN</code>：公开访问域名。</li>
                <li><code>MY_KV</code>：当前用于简单限频的 KV 命名空间。</li>
            </ul>
        </div>
    `
};
