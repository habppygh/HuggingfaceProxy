// 核心逻辑：根路径直接转发到n8n，保留下载脚本功能
import handleHome from './templates/home.html';
import hf_downloader from './scripts/hf_downloader.py';
import { parseRequest, rewriteLocation, isAllowedUpstream, validateBrowserAccess } from './utils.js';

async function handleProxy(request, url) {
  const pathname = url.pathname;
  const proxyOrigin = url.origin;
  const { upstream, path } = parseRequest(pathname);
  
  if (!isAllowedUpstream(upstream)) {
    return new Response(`Upstream not allowed: ${upstream}`, { status: 403 });
  }
  
  const upstreamUrl = new URL(path, `https://${upstream}`);
  upstreamUrl.search = url.search;
  
  const newRequest = new Request(upstreamUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: "manual"
  });
  
  newRequest.headers.set("Host", upstream);
  
  try {
    const response = await fetch(newRequest);
    
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("Location");
      if (location) {
        const newLocation = rewriteLocation(location, proxyOrigin);
        if (newLocation) {
          const newHeaders = new Headers(response.headers);
          newHeaders.set("Location", newLocation);
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          });
        }
      }
    }
    
    return response;
  } catch (e) {
    return new Response(`Proxy Error: ${e.message}`, { status: 502 });
  }
}

async function handleDownloaderScript(hostname) {
  const script = hf_downloader.replace(/\{\{PROXY_DOMAIN\}\}/g, hostname);
  return new Response(script, {
    status: 200,
    headers: {
      "Content-Type": "text/x-python; charset=utf-8",
      "Content-Disposition": 'attachment; filename="hf_downloader.py"',
      "Cache-Control": "no-cache"
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    const pathname = url.pathname;
    const restrictBrowserAccess = env.RESTRICT_BROWSER_ACCESS === "true";
    
    const accessCheck = validateBrowserAccess(request, pathname, restrictBrowserAccess);
    if (accessCheck) {
      return accessCheck;
    }
    
    switch (true) {
      // 保留下载脚本功能，不影响原有工具使用
      case pathname === "/hf_downloader.py":
        return handleDownloaderScript(hostname);
      // 所有其他路径（包括根路径/），全部触发代理转发到n8n
      default:
        return handleProxy(request, url);
    }
  }
};
