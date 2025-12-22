/**
 * 工具函数
 */

import { ALLOWED_UPSTREAM_DOMAINS, DEFAULT_UPSTREAM, REDIRECT_PREFIX } from './config.js';

/**
 * 判断是否是允许的上游域名
 * @param {string} hostname - 要检查的域名
 * @returns {boolean}
 */
export function isAllowedUpstream(hostname) {
    // 直接匹配已知域名
    if (ALLOWED_UPSTREAM_DOMAINS.includes(hostname)) {
        return true;
    }
    // 允许所有 .hf.co 结尾的 CDN 节点
    if (hostname.endsWith('.hf.co')) {
        return true;
    }
    return false;
}

/**
 * 解析请求路径，提取目标上游和实际路径
 * @param {string} pathname - 请求路径
 * @returns {{ upstream: string, path: string }}
 */
export function parseRequest(pathname) {
    // 检查是否有 redirect_to_ 前缀
    // 格式: /redirect_to_{domain}/path/to/resource
    const prefixPattern = new RegExp(`^/${REDIRECT_PREFIX}([^/]+)(/.*)$`);
    const match = pathname.match(prefixPattern);
    
    if (match) {
        // 有前缀，提取域名和路径
        return {
            upstream: match[1],
            path: match[2]
        };
    }
    
    // 无前缀，使用默认上游
    return {
        upstream: DEFAULT_UPSTREAM,
        path: pathname
    };
}

/**
 * 重写重定向 Location
 * @param {string} location - 原始 Location
 * @param {string} proxyOrigin - 代理服务器的 origin
 * @returns {string | null} - 重写后的 Location，如果不需要重写则返回 null
 */
export function rewriteLocation(location, proxyOrigin) {
    try {
        const locUrl = new URL(location);
        const locHost = locUrl.hostname;
        
        // 检查是否是允许的上游域名
        if (!isAllowedUpstream(locHost)) {
            return null;
        }
        
        // 构造新的重定向 URL
        if (locHost === DEFAULT_UPSTREAM) {
            // 默认上游，直接使用原路径
            return `${proxyOrigin}${locUrl.pathname}${locUrl.search}`;
        } else {
            // 其他上游，添加 redirect_to_ 前缀
            return `${proxyOrigin}/${REDIRECT_PREFIX}${locHost}${locUrl.pathname}${locUrl.search}`;
        }
    } catch (e) {
        console.error("Location parse error:", e);
        return null;
    }
}
