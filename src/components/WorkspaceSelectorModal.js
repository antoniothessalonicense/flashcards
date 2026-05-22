import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable, // Usado para o overlay que fecha o menu
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import withObservables from '@nozbe/with-observables';
import { database } from '../../database';
import { createWorkspace } from './dbServices';

const WorkspaceSelectorModal = ({
  visible,
  onClose,
  activeWorkspaceId,
  onSelectWorkspace,
  workspaces,
}) => {
  const insets = useSafeAreaInsets();
  
  // 1. Lógica de Estado - controla qual menu está aberto
  const [menuAbertoId, setMenuAbertoId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const handleSelect = (ws) => {
    onSelectWorkspace(ws);
    onClose();
  };

  // 4. Ações (WatermelonDB)
  const handleEdit = (id) => {
    // TODO: Implementar lógica de edição
    console.log('Editar workspace:', id);
    setMenuAbertoId(null);
  };

  const handleExport = (id) => {
    // TODO: Implementar lógica de exportação de conjuntos
    console.log('Exportar conjuntos do workspace:', id);
    setMenuAbertoId(null);
  };

  const handleDelete = async (id) => {
    setMenuAbertoId(null);
    Alert.alert(
      'Excluir Área de Trabalho',
      'Tem certeza que deseja excluir esta área de trabalho? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: async () => {
          await database.write(async () => {
            const workspace = await database.get('workspaces').find(id);
            await workspace.markAsDeleted();
          });
        }},
      ]
    );
  };

  // Função para alternar menu
  const toggleMenu = (id) => {
    setMenuAbertoId(menuAbertoId === id ? null : id);
  };

  // Função para fechar menu ao clicar fora
  const fecharMenu = () => {
    setMenuAbertoId(null);
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    await createWorkspace(newWorkspaceName.trim());
    setNewWorkspaceName('');
    setCreateModalVisible(false);
  };

  const filteredWorkspaces = workspaces.filter(ws => 
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Renderiza cada Área de Trabalho vinda do Banco de Dados
  const renderItem = ({ item, index }) => {
    const isActive = activeWorkspaceId === item.id;
    const isMenuAberto = menuAbertoId === item.id;
    
    return (
      // O zIndex é necessário para que o menu dropdown sobreponha os itens seguintes da lista
      <View style={{ zIndex: isMenuAberto ? 1 : 0 }}>
        <TouchableOpacity
          style={[styles.itemContainer, isActive && styles.itemActive]}
          onPress={() => handleSelect(item)}
          activeOpacity={0.8}
        >
          <View style={styles.itemRow}>
            <View style={[styles.colorBar, { backgroundColor: item.color || '#3B9EFF' }]} />
            <Text style={[styles.itemText, { flex: 1 }]}>{item.name}</Text>
            
            {/* Ícone de três pontos - abre o menu */}
            <TouchableOpacity 
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              onPress={() => toggleMenu(item.id)}
            >
              <Text style={styles.dotsIcon}>⋮</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* 3. Visual do Menu (Dropdown) - flutuando abaixo do item */}
        {isMenuAberto && (
          <View style={styles.dropdownContainer}>
            {/* 2. Overlay - Pressable transparente para fechar ao clicar fora */}
            <Pressable style={styles.overlayFundo} onPress={fecharMenu} />
            
            <View style={styles.dropdownMenu}>
              {/* Opção: Editar */}
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => handleEdit(item.id)}
              >
                <Text style={styles.dropdownIcon}>✏️</Text>
                <Text style={styles.dropdownText}>Editar</Text>
              </TouchableOpacity>

              {/* Opção: Conjuntos (Exportar) */}
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => handleExport(item.id)}
              >
                <Text style={styles.dropdownIcon}>📥</Text>
                <Text style={styles.dropdownText}>Conjuntos</Text>
              </TouchableOpacity>

              {/* Opção: Excluir */}
              <TouchableOpacity 
                style={[styles.dropdownItem, styles.dropdownItemDelete]}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.dropdownIcon}>🗑️</Text>
                <Text style={[styles.dropdownText, styles.dropdownTextDelete]}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // O primeiro item (Fixo) que reverte a seleção
  const renderHeader = () => {
    const isAllActive = activeWorkspaceId === null;
    return (
      <TouchableOpacity
        style={[styles.itemContainer, isAllActive && styles.itemActive, { marginTop: 8 }]}
        onPress={() => handleSelect(null)}
        activeOpacity={0.8}
      >
        <View style={styles.itemRow}>
          <View style={[styles.colorBar, { backgroundColor: '#888888' }]} />
          <Text style={styles.itemText}>Todos os conjuntos</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        
        {/* Cabeçalho */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <Text style={styles.iconText}>✕</Text>
          </TouchableOpacity>
          {isSearching ? (
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar áreas..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              onBlur={() => { if(!searchQuery) setIsSearching(false); }}
            />
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSearching(!isSearching)}>
            <Text style={styles.iconText}>{isSearching ? '✕' : '🔍'}</Text>
          </TouchableOpacity>
        </View>

        {/* Lista Dinâmica */}
        <FlatList
          data={filteredWorkspaces}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={renderHeader}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />

        {/* FAB (Floating Action Button) */}
        <TouchableOpacity style={styles.fab} onPress={() => setCreateModalVisible(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
        
      </View>

      {/* Modal de criação de Workspace */}
      <Modal visible={isCreateModalVisible} transparent animationType="fade" onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Nova Área de Trabalho</Text>
            <TextInput style={styles.modalInput} placeholder="Nome da área" placeholderTextColor="#666" value={newWorkspaceName} onChangeText={setNewWorkspaceName} autoFocus onSubmitEditing={handleCreateWorkspace} />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}><Text style={styles.modalCancel}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleCreateWorkspace}><View style={styles.modalConfirm}><Text style={styles.modalConfirmText}>Criar</Text></View></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBtn: { padding: 8 },
  iconText: { color: '#FFFFFF', fontSize: 22 },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  listContent: {
    paddingBottom: 100, // Dá espaço para o conteúdo não ficar atrás do FAB
  },
  itemContainer: {
    backgroundColor: '#2A2A2A', // Cinza Escuro
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  itemActive: { backgroundColor: '#00897B' }, // Teal
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingRight: 16 },
  colorBar: { width: 4, height: 24, borderRadius: 2, marginHorizontal: 12 },
  itemText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  dotsIcon: { color: '#888888', fontSize: 20, fontWeight: 'bold' },
  
  // Estilos do Dropdown Menu
  dropdownContainer: {
    position: 'absolute',
    right: 16,
    top: 50,
    zIndex: 1,
  },
  overlayFundo: {
    position: 'absolute',
    top: -200, // Expande para cobrir toda a tela
    left: -1000,
    right: -1000,
    bottom: -200,
    backgroundColor: 'transparent',
  },
  dropdownMenu: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 150,
    // Sombra
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    // Borda sutil
    borderWidth: 1,
    borderColor: '#333333',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dropdownItemDelete: {
    // Borda superior para separar a opção de excluir
    borderTopWidth: 1,
    borderTopColor: '#333333',
    marginTop: 4,
    paddingTop: 14,
  },
  dropdownIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  dropdownText: {
    color: '#E0E0E0',
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownTextDelete: {
    color: '#FF6B6B', // Vermelho para ação de excluir
  },
  
  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#3B9EFF',
    justifyContent: 'center', alignItems: 'center',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  fabText: { color: '#FFFFFF', fontSize: 32, lineHeight: 36 },

  // Estilos do Modal de Criação
  modalOverlay: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#2A2A2A', borderRadius: 16, padding: 24, width: '85%' },
  modalTitle: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, marginBottom: 16 },
  modalInput: { color: '#FFFFFF', backgroundColor: '#1E1E1E', borderRadius: 8, padding: 12, fontSize: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24, alignItems: 'center' },
  modalCancel: { color: '#888888', fontSize: 14, paddingHorizontal: 12 },
  modalConfirm: { backgroundColor: '#3B9EFF', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  modalConfirmText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});

import { withDatabase } from '@hypertill/db/react';

const EnhancedWorkspaceSelectorModal = withObservables(['database'], ({ database }) => ({
  workspaces: database.get('workspaces').query().observe(),
}))(WorkspaceSelectorModal);

export default withDatabase(EnhancedWorkspaceSelectorModal);