// Registro central de tags para parsing e renderização
const tags = {};

function registerTag(name, handler) {
  tags[name] = handler;
}

function getTagHandlers() {
  return { ...tags };
}

function findTags(text = '') {
  const matches = [];
  if (!text) return matches;
  Object.keys(tags).forEach((tag) => {
    const { parse } = tags[tag] || {};
    if (!parse) return;
    let m;
    while ((m = parse.exec(text)) !== null) {
      matches.push({
        tag,
        content: m[1] ?? '',
        start: m.index,
        end: m.index + m[0].length,
        fullMatch: m[0],
      });
    }
    // reset lastIndex para regex global
    if (parse && parse.lastIndex) parse.lastIndex = 0;
  });
  return matches.sort((a, b) => a.start - b.start);
}

function splitByTags(text = '') {
  const matches = findTags(text);
  if (!matches.length) return [{ type: 'text', text }];
  const parts = [];
  let cursor = 0;
  matches.forEach((m) => {
    if (m.start > cursor) parts.push({ type: 'text', text: text.slice(cursor, m.start) });
    parts.push({ type: 'tag', tag: m.tag, text: m.content, raw: m.fullMatch });
    cursor = m.end;
  });
  if (cursor < text.length) parts.push({ type: 'text', text: text.slice(cursor) });
  return parts;
}

module.exports = {
  registerTag,
  getTagHandlers,
  findTags,
  splitByTags,
};
