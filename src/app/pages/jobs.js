export const jobsPage = {
    title: '任务中心',
    body: `
        <p class="page-body">任务中心会承载后续的云端转存队列、批量导入和后台处理状态。</p>
        <div class="card">
            <h2 class="card__title">规划状态</h2>
            <ul>
                <li><code>queued</code>：任务已提交，等待执行。</li>
                <li><code>fetching</code>：正在读取远端文件。</li>
                <li><code>uploading</code>：正在写入 R2。</li>
                <li><code>done</code> / <code>failed</code>：完成或失败。</li>
            </ul>
        </div>
    `
};
