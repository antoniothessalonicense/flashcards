import React, { useContext, useState } from 'react';
import {
  Alert,
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import db from '../../db';
import { sets } from '../../db/schema';
import { AppContext } from '../context/AppContext';

export default function CreateDeckModal({ visible, onClose, onCreated }) {
  const { theme } = useContext(AppContext);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSet = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Nome obrigatório', 'Por favor, informe um nome para o conjunto antes de salvar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      
      await db.insert(sets).values({
        id: newId,
        title: trimmedName,
        description: description.trim(),
        frontLanguage: 'pt-BR',
        backLanguage: 'en-US',
        next_review_date: 0,
        totalReviews: 0
      });

      Alert.alert('Conjunto criado', 'Seu novo conjunto foi salvo com sucesso.');
      setName('');
      setDescription('');
      onClose();
      if (typeof onCreated === 'function') {
        onCreated();
      }
    } catch (error) {
      console.error('Erro ao criar conjunto:', error);
      Alert.alert('Erro', 'Não foi possível criar o conjunto. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Novo Conjunto</Text>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.bg, color: theme.textPrimary, borderColor: theme.border }]}
            placeholder="Nome do conjunto (ex: Inglês Básico)"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
            autoFocus
          />
          
          <TextInput
            style={[styles.input, { marginTop: 12, backgroundColor: theme.bg, color: theme.textPrimary, borderColor: theme.border }]}
            placeholder="Descrição opcional"
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={setDescription}
          />

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
              <Text style={[styles.btnCancel, { color: theme.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleCreateSet} disabled={isSubmitting || !name.trim()}>
              <View style={[styles.btnConfirm, { backgroundColor: theme.appBar }, (!name.trim() || isSubmitting) && { backgroundColor: theme.border }]}>
                {isSubmitting ? (
                  <ActivityIndicator color={theme.appBarText} size="small" />
                ) : (
                  <Text style={[styles.btnConfirmText, { color: theme.appBarText }]}>Criar</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBox: { borderWidth: 1, borderRadius: 14, padding: 24, width: '85%' },
  modalTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15, minHeight: 44 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 24, gap: 16 },
  btnCancel: { fontSize: 15, paddingHorizontal: 8, minHeight: 44, textAlignVertical: 'center' },
  btnConfirm: { borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, justifyContent: 'center', alignItems: 'center', minHeight: 44 },
  btnDisabled: { opacity: 0.55 },
  btnConfirmText: { fontWeight: 'bold', fontSize: 15 },
});