export function sanitizeHtml(input: string) {
  // Remove scripts
  let out = input.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
  // Remove event handlers like onClick
  out = out.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
  // Nofollow + noopener + noreferrer and disable javascript: links
  out = out.replace(/<a\s+([^>]*href\s*=\s*["'])([^"']+)(["'][^>]*)>/gi, (_, pre, href, post) => {
    let safe = href
    if (/^\s*javascript:/i.test(href)) {
      safe = "#"
    }
    // ensure rel attr
    if (!/rel\s*=/i.test(post)) {
      post = ` rel="nofollow noopener noreferrer"${post}`
    }
    return `<a ${pre}${safe}${post}>`
  })
  return out
}
