const TagRegistry = require('./tagRegistry');

// Tag: <en> ... </en> => fala em inglês
TagRegistry.registerTag('en', {
  parse: /<en>([\s\S]*?)<\/en>/ig,
  ttsBehavior: 'langSwitch',
  defaultLang: 'en-US',
  render: (content) => ({ type: 'text', props: { style: { fontStyle: 'italic' }, children: content } }),
});

// Tag: <mudo> ... </mudo> => ignorar no TTS
TagRegistry.registerTag('mudo', {
  parse: /<mudo>([\s\S]*?)<\/mudo>/ig,
  ttsBehavior: 'ignore',
  render: (content) => ({ type: 'text', props: { children: content } }),
});

module.exports = TagRegistry;
