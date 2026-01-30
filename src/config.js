/**
 * 配置文件
 */

// 允许的上游域名列表 (用于验证重定向目标)
export const ALLOWED_UPSTREAM_DOMAINS = [
    'habppygh-n8n.hf.space', // 新增：你的 n8n 域名
    'huggingface.co', // 保留原域名，不影响兼容
    // .hf.co 结尾的域名都是允许的 CDN 节点
];

// 默认上游域名（修改为你的 n8n 地址）
export const DEFAULT_UPSTREAM = 'habppygh-n8n.hf.space';

// 重定向前缀
export const REDIRECT_PREFIX = 'redirect_to_';
