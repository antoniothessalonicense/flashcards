import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Badge } from './Shared';

export const MENU_ITEMS = [
  { icon: '🏠', label: 'Início', id: 'list' },
  { icon: '📚', label: 'Meus Conjuntos', id: 'list' },
  { icon: '⏱️', label: 'Cronômetro', id: 'stopwatch_config' },
  { icon: '📊', label: 'Estatísticas', id: 'statistics' },
  { icon: '🔔', label: 'Notificações', id: 'notifications' },
  { icon: '📥', label: 'Importar', id: 'import' },
  { icon: '🗣️', label: 'Configurar Vozes', id: 'voices' },
  { icon: '☁️', label: 'Backup no Google Docs', id: 'backup_docs' },
  null,
  { icon: '⚙️', label: 'Configurações', id: 'settings' },
  { icon: 'Aa', label: 'Tamanho do Texto', id: 'text_size' },
  { icon: '🌙', label: 'Alternar para o Tema Noturno', special: true },
  { icon: '❓', label: 'Ajuda', id: 'help' },
  { icon: '📧', label: 'Contato', id: 'contact' },
];

export default function MenuScreen({ visible, onClose, onMenuItemPress, isDark, toggleTheme, theme }) {
  const C = theme;
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.menuContainer, { backgroundColor: C.card }]}>
          <LinearGradient colors={['#009688', '#4CAF50', '#607D8B']} style={styles.menuHeader}>
            <View style={styles.avatar}><Text style={[styles.avatarText, { color: C.white }]}>A</Text></View>
            <View style={{ marginTop: 6 }}><Badge color={C.blue} theme={theme}>PRO</Badge></View>
            <Text style={[styles.menuName, { color: C.white }]}>Antonio Thessalonicense M Monteiro</Text>
            <Text style={styles.menuEmail}>antoniomartinsbr@gmail.com</Text>
          </LinearGradient>
          <ScrollView>
            {MENU_ITEMS.map((item, i) =>
              item === null ? (
                <View key={`sep${i}`} style={[styles.menuSep, { backgroundColor: C.sep }]} />
              ) : (
                <TouchableOpacity
                  key={i} style={styles.menuItem}
                  onPress={() => item.special ? toggleTheme() : onMenuItemPress(item.id)}
                >
                  <Text style={styles.menuItemIcon}>{item.icon}</Text>
                  <Text style={[styles.menuItemText, { color: C.white }, item.special && { color: C.blue }]}>
                    {item.special ? (isDark ? 'Alternar para o Tema Claro' : 'Alternar para o Tema Noturno') : item.label}
                  </Text>
                </TouchableOpacity>
              )
            )}
            <Text style={[styles.menuVersion, { color: C.gray }]}>Versão: 1.0</Text>
          </ScrollView>
        </View>
        <TouchableOpacity style={styles.menuOverRight} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({ modalOverlay: { flex: 1, flexDirection: 'row' }, menuContainer: { width: '78%', height: '100%' }, menuOverRight: { flex: 1, backgroundColor: '#00000066' }, menuHeader: { padding: 20, paddingTop: 44 }, avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FF9800', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }, avatarText: { fontSize: 22, fontWeight: 'bold' }, menuName: { fontWeight: 'bold', fontSize: 16, marginTop: 6 }, menuEmail: { color: '#ffffffaa', fontSize: 12, marginTop: 2 }, menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }, menuItemIcon: { width: 22, fontSize: 16 }, menuItemText: { fontSize: 14, marginLeft: 12 }, menuSep: { height: 1, marginVertical: 4 }, menuVersion: { fontSize: 12, textAlign: 'center', padding: 16 } });