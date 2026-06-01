import React, { useState } from 'react';
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

export default function CreateDeckModal({ visible, onClose, onCreated }) {
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
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Novo Conjunto</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nome do conjunto (ex: Inglês Básico)"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
            autoFocus
          />
          
          <TextInput
            style={[styles.input, { marginTop: 12 }]}
            placeholder="Descrição opcional"
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
          />

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.btnCancel}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleCreateSet} disabled={isSubmitting || !name.trim()}>
              <View style={[styles.btnConfirm, (!name.trim() || isSubmitting) && styles.btnDisabled]}>
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.btnConfirmText}>Criar</Text>
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
  overlay: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#2A2A2A', borderRadius: 16, padding: 24, width: '85%' },
  modalTitle: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18, marginBottom: 16 },
  input: { color: '#FFFFFF', backgroundColor: '#1E1E1E', borderRadius: 8, padding: 12, fontSize: 15 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 24, gap: 16 },
  btnCancel: { color: '#888888', fontSize: 15, paddingHorizontal: 8 },
  btnConfirm: { backgroundColor: '#3B9EFF', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },
  btnDisabled: { backgroundColor: '#555555' },
  btnConfirmText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
});