const TagRegistry = require('./tagRegistry');

let speaker = null;
try {
  // try expo-speech
  // eslint-disable-next-line global-require
  speaker = require('expo-speech');
} catch (e) {
  try {
    // eslint-disable-next-line global-require
    speaker = require('react-native-tts');
  } catch (e2) {
    speaker = null;
  }
}

function _speak(text, opts = {}) {
  if (!speaker || !text) return Promise.resolve();
  try {
    if (typeof speaker.speak === 'function') {
      // expo-speech or react-native-tts
      if (opts.language && speaker.setDefaultLanguage) {
        speaker.setDefaultLanguage(opts.language);
      }
      speaker.speak(text, opts);
      return Promise.resolve();
    }
  } catch (err) {
    return Promise.resolve();
  }
  return Promise.resolve();
}

async function playMixedTTS(text = '', options = {}) {
  const parts = TagRegistry.splitByTags(text || '');
  for (const p of parts) {
    if (p.type === 'text') {
      // fala com idioma padrão
      // eslint-disable-next-line no-await-in-loop
      await _speak(p.text, { language: options.defaultLang, voice: options.voice || options.preferredVoices?.[options.defaultLang] });
    } else if (p.type === 'tag') {
      const handler = TagRegistry.getTagHandlers()[p.tag];
      const behavior = handler?.ttsBehavior || 'speak';
      if (behavior === 'ignore') continue;
      if (behavior === 'langSwitch') {
        const lang = handler.defaultLang || options.defaultLang || 'en-US';
        const voice = options.preferredVoices?.[lang];
        // eslint-disable-next-line no-await-in-loop
        await _speak(p.text, { language: lang, voice });
      } else {
        // eslint-disable-next-line no-await-in-loop
        await _speak(p.text, { language: options.defaultLang, voice: options.voice || options.preferredVoices?.[options.defaultLang] });
      }
    }
  }
}

module.exports = {
  playMixedTTS,
  _speak,
};
