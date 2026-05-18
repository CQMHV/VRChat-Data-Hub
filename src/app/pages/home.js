export const homePage = {
    title: '首页',
    body: `
        <p class="page-body"><code>VRChat Data Hub</code> 是面向 VRChat 资源上传、转存和后续文件管理的数据中心。</p>
        <div class="card card--emphasis">
            <h2 class="card__title">当前阶段</h2>
            <p>基础实现先保留原 Worker 的核心能力：本地文件签名上传、远程链接云端转存、R2 公开链接生成和简单限频。</p>
            <div class="card__actions" aria-label="快速入口">
                <md-filled-tonal-button type="link" href="/upload">进入上传中心</md-filled-tonal-button>
                <md-filled-tonal-button type="link" href="/files">查看文件库规划</md-filled-tonal-button>
            </div>
        </div>
        <div class="card">
            <h2 class="card__title">架构方向</h2>
            <ul>
                <li><strong>前端</strong>：沿用 <code>VRChatAvatarLearn-Website</code> 的 Vite、MD3、主题控制和应用壳。</li>
                <li><strong>API</strong>：使用 Cloudflare Pages Functions 承载上传签名和云端转存接口。</li>
                <li><strong>存储</strong>：当前对接 R2 与 KV，后续扩展 D1 文件索引、Queues 任务队列和 Durable Object 限频。</li>
            </ul>
        </div>
        <div class="card">
            <h2 class="card__title">下一步功能</h2>
            <ul>
                <li>文件库：记录对象 key、原始文件名、公开链接、文件类型和上传时间。</li>
                <li>任务中心：把云端转存改为异步任务，支持状态查询和失败重试。</li>
                <li>设置页：集中展示环境变量、绑定和部署前检查清单。</li>
            </ul>
        </div>
    `
};
