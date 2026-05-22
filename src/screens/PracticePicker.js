import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Badge } from '../components/Shared';
import { AppContext } from '../context/AppContext';

const MODOS = [
  { icon: '🔤', label: 'Revisão Básica', desc: 'Revisão básica de flashcards.', pro: false },
  { icon: '🚀', label: 'Selecione a Definição', desc: 'Selecione a definição correta', pro: false },
  { icon: '📋', label: 'Combine Cartões', desc: 'Faça combinações entre duas listas', pro: false },
  { icon: '✏️', label: 'Escrevendo a Revisão', desc: 'Revise escrevendo', pro: false },
  { icon: '🎙️', label: 'Revisão de áudio', desc: 'Revise através do áudio', pro: false },
  { icon: '🎨', label: 'Revisão de desenho', desc: 'Pratique desenhando a resposta', pro: true },
  { icon: '🧠', label: 'Jogo da memória', desc: 'Revelar e combinar cartões', pro: true },
];

export default function PracticePicker() {
  const { theme, styles } = useContext(AppContext);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  
  const { deckId } = route.params || {};

  const onClose = () => navigation.goBack();
  const onSelect = (modo) => {
    navigation.navigate('Review', { deckId, studyMode: 'practice', practiceMode: modo.label });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.hBtn}>
            <Text style={styles.hIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.hTitle, { flex: 1 }]}>Prática</Text>
          <TouchableOpacity style={styles.hBtn}>
            <Text style={styles.hIcon}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.hBtn}>
            <Text style={styles.hIcon}>⋮</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {MODOS.map((modo, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.modoItem, modo.pro && { opacity: 0.7 }]}
              disabled={modo.pro}
              onPress={() => !modo.pro && onSelect(modo)}
            >
              <View style={styles.modoIconWrap}>
                <Text style={{ fontSize: 22 }}>{modo.icon}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.modoLabel}>{modo.label}</Text>
                  {modo.pro && (
                    <View style={{ marginLeft: 8 }}>
                      <Badge color="#FF9800" theme={theme}>PRO</Badge>
                    </View>
                  )}
                </View>
                <Text style={styles.modoDesc}>{modo.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
    </View>
  );
}
