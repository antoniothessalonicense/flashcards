import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function AppBar({ title, theme, leftIcon = 'menu-outline', rightIcon, onLeftPress, onRightPress, actions = [], showMore, onMorePress }) {
  return (
    <View style={{ minHeight: 86, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, backgroundColor: '#1c2f4d', paddingTop: 8, paddingBottom: 12 }}>
      <TouchableOpacity onPress={onLeftPress} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
        <Ionicons name={leftIcon} size={30} color="#f5f7fb" />
      </TouchableOpacity>
      <Text numberOfLines={1} style={{ flex: 1, color: '#f5f7fb', fontSize: 30, fontWeight: '700', letterSpacing: -0.6 }}>
        {title}
      </Text>
      {rightIcon ? (
        <TouchableOpacity onPress={onRightPress} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={rightIcon} size={28} color="#f5f7fb" />
        </TouchableOpacity>
      ) : null}
      {actions.map((action) => (
        <TouchableOpacity key={action.id} onPress={action.onPress} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={action.icon} size={21} color="#f5f7fb" />
        </TouchableOpacity>
      ))}
      {showMore ? (
        <TouchableOpacity onPress={onMorePress} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="ellipsis-vertical" size={20} color="#f5f7fb" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function Card({ children, theme, style }) {
  return (
    <View style={[{ backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 14, padding: 16 }, style]}>
      {children}
    </View>
  );
}

function ActionButton({ label, icon, onPress, theme, variant = 'primary', style }) {
  const filled = variant === 'primary';
  const foreground = filled ? '#f5f7fb' : '#2d3d5e';
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={[{
        minHeight: 54,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 18,
        borderRadius: 16,
        borderWidth: filled ? 0 : 1,
        borderColor: '#cfdbea',
        backgroundColor: filled ? '#233a5d' : '#f4f7fb',
      }, style]}
    >
      {icon ? <Ionicons name={icon} size={20} color={foreground} /> : null}
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ color: foreground, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function PrimaryButton(props) {
  return <ActionButton {...props} variant="primary" />;
}

export function OutlineButton(props) {
  return <ActionButton {...props} variant="outline" />;
}

export function SegmentedActions({ items, selected, theme }) {
  return (
    <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: '#d9e2ee', borderRadius: 14, overflow: 'hidden', backgroundColor: '#f5f7fb' }}>
      {items.map((item, index) => {
        const active = selected === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            accessibilityRole="button"
            onPress={item.onPress}
            style={{
              minHeight: 58,
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingHorizontal: 6,
              backgroundColor: active ? '#dfeaf7' : '#f5f7fb',
              borderRightWidth: index < items.length - 1 ? 1 : 0,
              borderRightColor: '#d9e2ee',
              borderRadius: active ? 12 : 0,
            }}
          >
            <Ionicons name={item.icon} size={18} color={active ? '#2f4d72' : '#5d7290'} />
            <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: active ? '#2f4d72' : '#5d7290', fontSize: 14, fontWeight: active ? '700' : '600' }}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function Chip({ label, icon, onPress, theme, style }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={[{
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surface,
      }, style]}
    >
      {icon ? <Ionicons name={icon} size={16} color={theme.textSecondary} /> : null}
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ flexShrink: 1, color: theme.textPrimary, fontSize: 13, fontWeight: '500' }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function KpiCard({ label, value, theme, style, rightAction }) {
  return (
    <View style={[{ flex: 1, minWidth: 0, minHeight: 110, justifyContent: 'center', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, backgroundColor: '#f3f6fb', borderColor: '#dfeaf3', borderWidth: 1, borderRadius: 14 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 2, marginBottom: 6 }}>
        <Text numberOfLines={1} style={{ flex: 1, color: '#526a8c', fontSize: 17, fontWeight: '500' }}>{label}</Text>
        {rightAction}
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: '#20314f', fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: -1.2 }}>{value}</Text>
    </View>
  );
}

export function TableHeader({ columns, theme, style }) {
  return (
    <View style={[{ minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, backgroundColor: '#edf3fa', borderTopLeftRadius: 12, borderTopRightRadius: 12 }, style]}>
      {columns.map((column) => (
        <Text key={column.label} numberOfLines={1} style={{ flex: column.flex ?? 1, width: column.width, color: '#4d6382', fontSize: 12, fontWeight: '700', textAlign: column.align || 'left' }}>
          {column.label}
        </Text>
      ))}
    </View>
  );
}

export function TableRow({ children, onPress, theme, style }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={[{ minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border }, style]}
    >
      {children}
    </TouchableOpacity>
  );
}
