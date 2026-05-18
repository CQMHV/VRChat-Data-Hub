const ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '\u0060': '&#x60;'
};

// Use only for HTML text nodes and quoted attribute values.
// Do not use for JavaScript, CSS, URL protocols, or inline event handlers.
export function escapeHtml(str) {
    if (!str) return str;
    return String(str).replace(/[&<>"'\u0060\/]/g, (s) => ESCAPE_MAP[s]);
}
