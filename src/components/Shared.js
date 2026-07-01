import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
const TagRegistry = require('../utils/tagRegistry');
export function ProgressBar({ value, color, theme }) {
  const C = theme;
  return (
    <View style={[styles.pbBg, { backgroundColor: C.sep }]}>
      <View style={[styles.pbFill, { width: `${Math.min(value, 100)}%`, backgroundColor: color || C.purple }]} />
    </View>
  );
}

export function Badge({ children, color, theme }) {
  const C = theme;
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={[styles.badgeText, { color: C.white }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pbBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  pbFill: { height: 4, borderRadius: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
});

export function FormattedText({ text, style, numberOfLines }) {
  const [uiStates, setUiStates] = useState({});
  if (!text) return null;

  const parts = TagRegistry.splitByTags(text);
  const elements = [];
  let elementIndex = 0;

  const inlineUIRegex = /<icone(?:\s+size=(\d+))?\s*>([\s\S]*?)<\/icone>|<ui>([\s\S]*?)<\/ui>/ig;

  const renderTextWithInlineUI = (txt) => {
    if (!txt) return null;
    const out = [];
    let last = 0;
    let m;
    while ((m = inlineUIRegex.exec(txt)) !== null) {
      if (m.index > last) {
        out.push(<Text key={`t-${last}-${elementIndex}`}>{txt.substring(last, m.index)}</Text>);
      }
      if (m[2] !== undefined) {
        const size = m[1] ? parseInt(m[1], 10) : 20;
        const iconName = m[2].trim();
        out.push(<Ionicons key={`icon-${elementIndex}`} name={iconName} size={size} />);
      } else if (m[3] !== undefined) {
        const uiType = m[3].trim().toLowerCase();
        const currentId = `ui-${elementIndex}`;
        switch (uiType) {
          case 'checkbox':
            out.push(
              <View key={currentId} style={{ display: 'inline-flex', justifyContent: 'center', marginHorizontal: 4 }}>
                <Checkbox
                  value={!!uiStates[currentId]}
                  onValueChange={(val) => setUiStates(prev => ({ ...prev, [currentId]: val }))}
                />
              </View>
            );
            break;
          case 'switch':
            out.push(
              <View key={currentId} style={{ display: 'inline-flex', justifyContent: 'center', marginHorizontal: 4 }}>
                <Switch
                  value={!!uiStates[currentId]}
                  onValueChange={(val) => setUiStates(prev => ({ ...prev, [currentId]: val }))}
                />
              </View>
            );
            break;
          case 'button':
            out.push(
              <View key={currentId} style={{ display: 'inline-flex', marginHorizontal: 4 }}>
                <Button title="Botão" onPress={() => {}} />
              </View>
            );
            break;
          default:
            out.push(<Text key={currentId}>[Unknown UI: {uiType}]</Text>);
        }
      }
      last = inlineUIRegex.lastIndex;
      elementIndex++;
    }
    if (last < txt.length) out.push(<Text key={`t-${last}-${elementIndex}`}>{txt.substring(last)}</Text>);
    return out;
  };

  parts.forEach((p, idx) => {
    if (p.type === 'text') {
      const rendered = renderTextWithInlineUI(p.text);
      rendered.forEach((r) => elements.push(r));
    } else if (p.type === 'tag') {
      const handler = TagRegistry.getTagHandlers()[p.tag];
      if (handler && typeof handler.render === 'function') {
        const node = handler.render(p.text);
        if (node && node.type === 'text') {
          elements.push(<Text key={`tag-${p.tag}-${idx}`} style={node.props.style}>{node.props.children}</Text>);
        } else if (React.isValidElement(node)) {
          elements.push(React.cloneElement(node, { key: `tag-${p.tag}-${idx}` }));
        } else {
          elements.push(<Text key={`tag-${p.tag}-${idx}`}>{p.text}</Text>);
        }
      } else {
        // fallback: render inner text
        elements.push(<Text key={`tag-${p.tag}-${idx}`}>{p.text}</Text>);
      }
    }
  });

  return <Text style={style} numberOfLines={numberOfLines}>{elements}</Text>;
}