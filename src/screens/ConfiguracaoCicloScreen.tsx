import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import db from '../../db';
import { sets } from '../../db/schema';
import { useCicloConfigStore, CICLO_DEFAULTS } from '../store/useCicloConfigStore';
import { saveCycleConfig, getCycleConfig, buildCycleCards } from '../../dbServices.drizzle';

const ConfiguracaoCicloScreen: React.FC = () => {
  const navigation = useNavigation();

  // ── Estado global (Zustand) ──
  const config = useCicloConfigStore();

  // ── Estado do Modal de resumo ──
  const [modalVisible, setModalVisible] = useState(false);
  const [setsModalVisible, setSetsModalVisible] = useState(false);
  const [cicloResumo, setCicloResumo] = useState<{ atrasados: number; obrigatorios: number; erros: number; importantes: number; fixos: number; total: number } | null>(null);
  const [cicloCardIds, setCicloCardIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Sets do DB ──
  const { data: allSetsData } = useLiveQuery(db.select().from(sets));
  const allSets = allSetsData || [];

  const toggleSetSelection = (setId: string) => {
    const current = config.conjuntosFixosSelecionados || [];
    if (current.includes(setId)) {
      config.updateConfig({ conjuntosFixosSelecionados: current.filter(id => id !== setId) });
    } else {
      config.updateConfig({ conjuntosFixosSelecionados: [...current, setId] });
    }
  };

  // ── Hidrata do banco na montagem ──
  useEffect(() => {
    const loadFromDB = async () => {
      try {
        const row = await getCycleConfig();
        if (row) config.hydrateFromDB(row);
      } catch (e) {
        console.error('Erro ao carregar config do ciclo:', e);
      }
    };
    loadFromDB();
  }, []);

  // ── Ações ──
  const restaurarPadroes = () => {
    config.resetToDefaults();
  };

  const salvarConfiguracoes = async () => {
    try {
      await saveCycleConfig({
        limiteDiarioTotal: config.limiteDiarioTotal,
        limiteAtivo: config.limiteAtivo ? 1 : 0,
        cardsPorConjuntoObrigatorio: config.cardsPorConjuntoObrigatorio,
        qtdConjuntosAtrasados: config.qtdConjuntosAtrasados,
        cardsPorConjuntoAtrasado: config.cardsPorConjuntoAtrasado,
        cardsErrosAnteriores: config.cardsErrosAnteriores,
        cardsImportantes: config.cardsImportantes,
        qtdConjuntosFixosPorCiclo: config.qtdConjuntosFixosPorCiclo,
        cardsPorConjuntoFixo: config.cardsPorConjuntoFixo,
        conjuntosFixosSelecionados: config.conjuntosFixosSelecionados,
      });

      Alert.alert('Sucesso', 'Configurações salvas com sucesso!');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações. Verifique o banco de dados.');
    }
  };

  // ── Monta o ciclo real consultando o banco ──
  const handleSalvarConfiguracoes = async () => {
    setLoading(true);
    try {
      // Salva as configs no banco primeiro
      await saveCycleConfig({
        limiteDiarioTotal: config.limiteDiarioTotal,
        limiteAtivo: config.limiteAtivo ? 1 : 0,
        cardsPorConjuntoObrigatorio: config.cardsPorConjuntoObrigatorio,
        qtdConjuntosAtrasados: config.qtdConjuntosAtrasados,
        cardsPorConjuntoAtrasado: config.cardsPorConjuntoAtrasado,
        cardsErrosAnteriores: config.cardsErrosAnteriores,
        cardsImportantes: config.cardsImportantes,
        qtdConjuntosFixosPorCiclo: config.qtdConjuntosFixosPorCiclo,
        cardsPorConjuntoFixo: config.cardsPorConjuntoFixo,
        conjuntosFixosSelecionados: config.conjuntosFixosSelecionados,
      });

      // Monta o ciclo real
      const ciclo = await buildCycleCards({
        qtdConjuntosAtrasados: config.qtdConjuntosAtrasados,
        cardsPorConjuntoAtrasado: config.cardsPorConjuntoAtrasado,
        cardsPorConjuntoObrigatorio: config.cardsPorConjuntoObrigatorio,
        cardsErrosAnteriores: config.cardsErrosAnteriores,
        cardsImportantes: config.cardsImportantes,
        qtdConjuntosFixosPorCiclo: config.qtdConjuntosFixosPorCiclo,
        cardsPorConjuntoFixo: config.cardsPorConjuntoFixo,
        conjuntosFixosSelecionados: config.conjuntosFixosSelecionados,
        limiteAtivo: config.limiteAtivo,
        limiteDiarioTotal: config.limiteDiarioTotal,
      });

      setCicloResumo(ciclo.resumo);
      setCicloCardIds(ciclo.cards.map((c: any) => c.id));
      setModalVisible(true);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível montar o ciclo de estudo.');
    } finally {
      setLoading(false);
    }
  };

  const handleEstudarAgora = () => {
    setModalVisible(false);
    if (cicloCardIds.length === 0) {
      Alert.alert('Ciclo Vazio', 'Nenhum card foi selecionado para este ciclo.');
      return;
    }
    navigation.navigate('Review' as never, { cycleCardIds: cicloCardIds } as never);
  };

  const Counter = ({ value, setter }: { value: number, setter: (val: number) => void }) => (
    <View style={styles.counterContainer}>
      <TouchableOpacity style={styles.counterBtn} onPress={() => setter(Math.max(0, value - 1))}>
        <Text style={styles.counterBtnText}>-</Text>
      </TouchableOpacity>
      <TextInput 
        style={styles.counterInput} 
        value={value.toString()} 
        onChangeText={(text) => setter(Number(text) || 0)}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.counterBtn} onPress={() => setter(value + 1)}>
        <Text style={styles.counterBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.screenTitle}>Configurações do Ciclo de Estudo</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Limite Diário */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.icon}>🗓️</Text>
              <Text style={styles.cardTitle}>LIMITE DIÁRIO TOTAL DE CARDS</Text>
            </View>
          </View>
          <View style={styles.cardRow}>
            <TextInput
              style={styles.inputLarge}
              keyboardType="numeric"
              value={config.limiteDiarioTotal.toString()}
              onChangeText={(text) => config.updateConfig({ limiteDiarioTotal: Number(text) || 0 })}
            />
            <Switch 
              value={config.limiteAtivo} 
              onValueChange={(val) => config.updateConfig({ limiteAtivo: val })} 
              trackColor={{ false: '#E0E0E0', true: '#B0BEC5' }} 
              thumbColor={'#FFFFFF'}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>REGRAS DO CICLO</Text>

        {/* Conjuntos Atrasados */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.icon}>🗓️</Text>
              <Text style={styles.cardTitle}>CONJUNTOS ATRASADOS</Text>
            </View>
            <Text style={styles.icon}>🕒</Text>
          </View>
          <View style={styles.twoColumnRow}>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Quantidade de Conjuntos</Text>
              <Counter 
                value={config.qtdConjuntosAtrasados} 
                setter={(val) => config.updateConfig({ qtdConjuntosAtrasados: val })} 
              />
            </View>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Cards por Conjunto</Text>
              <Counter 
                value={config.cardsPorConjuntoAtrasado} 
                setter={(val) => config.updateConfig({ cardsPorConjuntoAtrasado: val })} 
              />
            </View>
          </View>
        </View>

        {/* Revisão Obrigatória */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.icon}>📋</Text>
              <Text style={styles.cardTitle}>REVISÃO OBRIGATÓRIA (PROGRESSÃO KUMON)</Text>
            </View>
            <Text style={styles.icon}>🎯</Text>
          </View>
          <Text style={styles.subtext}>Prioridade: Menor Índice (Ex: Conjunto 1 {'>'} Conjunto 2)</Text>
          
          <View style={styles.cardRow}>
            <View style={{flex: 1, marginRight: 16}}>
               <Text style={[styles.columnLabel, {textAlign: 'left'}]}>Cards por Conjunto Obrigatório</Text>
               <View style={styles.fakeSliderContainer}>
                 <View style={styles.fakeSliderTrack} />
                 <View style={styles.fakeSliderThumb} />
               </View>
            </View>
            <TextInput
              style={styles.inputSmall}
              keyboardType="numeric"
              value={config.cardsPorConjuntoObrigatorio.toString()}
              onChangeText={(text) => config.updateConfig({ cardsPorConjuntoObrigatorio: Number(text) || 0 })}
            />
          </View>
        </View>

        {/* Erros Anteriores */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.icon}>❌</Text>
              <Text style={styles.cardTitle}>ERROS ANTERIORES (GERAL)</Text>
            </View>
            <TextInput
              style={styles.inputSmall}
              keyboardType="numeric"
              value={config.cardsErrosAnteriores.toString()}
              onChangeText={(text) => config.updateConfig({ cardsErrosAnteriores: Number(text) || 0 })}
            />
          </View>
        </View>

        {/* Cards Importantes */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.icon}>❤️</Text>
              <Text style={styles.cardTitle}>CARDS IMPORTANTES</Text>
            </View>
            <TextInput
              style={styles.inputSmall}
              keyboardType="numeric"
              value={config.cardsImportantes.toString()}
              onChangeText={(text) => config.updateConfig({ cardsImportantes: Number(text) || 0 })}
            />
          </View>
        </View>

        {/* Conjuntos Fixos */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.icon}>📚</Text>
              <Text style={styles.cardTitle}>CONJUNTOS FIXOS (MAIS ATRASADOS PRIORIZADOS)</Text>
            </View>
            <Text style={styles.icon}>🛠️</Text>
          </View>
          <Text style={styles.subtext}>Sempre selecione os conjuntos fixos mais atrasados</Text>
          
          <View style={styles.cardRow}>
            <TouchableOpacity style={styles.selectButton} onPress={() => setSetsModalVisible(true)}>
              <Text style={styles.selectButtonText}>SELECIONAR CONJUNTOS</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSetsModalVisible(true)}>
              <Text style={styles.linkText}>
                {(config.conjuntosFixosSelecionados && config.conjuntosFixosSelecionados.length > 0) 
                  ? `${config.conjuntosFixosSelecionados.length} Selecionados` 
                  : 'Ver Todos/Adicionar'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.cardRow, {marginTop: 16}]}>
            <Text style={styles.columnLabelLarge}>QUANTIDADE DE CONJUNTOS FIXOS POR CICLO</Text>
            <Counter 
              value={config.qtdConjuntosFixosPorCiclo} 
              setter={(val) => config.updateConfig({ qtdConjuntosFixosPorCiclo: val })} 
            />
          </View>
          
          <View style={[styles.cardRow, {marginTop: 16}]}>
            <Text style={styles.columnLabelLarge}>CARDS POR CONJUNTO FIXO</Text>
            <Counter 
              value={config.cardsPorConjuntoFixo} 
              setter={(val) => config.updateConfig({ cardsPorConjuntoFixo: val })} 
            />
          </View>
        </View>

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSalvarConfiguracoes} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>SALVAR CONFIGURAÇÕES</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.restoreButton} onPress={restaurarPadroes}>
          <Text style={styles.restoreButtonText}>Restaurar Padrões</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Flutuante de Resumo do Ciclo */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>📊 Ciclo de Estudo Montado</Text>
            
            {cicloResumo && (
              <View style={styles.modalContent}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalIcon}>🕒</Text>
                  <Text style={styles.modalLabel}>Conjuntos Atrasados</Text>
                  <Text style={styles.modalValue}>{cicloResumo.atrasados} cards</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalIcon}>🎯</Text>
                  <Text style={styles.modalLabel}>Revisão Obrigatória</Text>
                  <Text style={styles.modalValue}>{cicloResumo.obrigatorios} cards</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalIcon}>❌</Text>
                  <Text style={styles.modalLabel}>Erros Anteriores</Text>
                  <Text style={styles.modalValue}>{cicloResumo.erros} cards</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalIcon}>❤️</Text>
                  <Text style={styles.modalLabel}>Cards Importantes</Text>
                  <Text style={styles.modalValue}>{cicloResumo.importantes} cards</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalIcon}>📚</Text>
                  <Text style={styles.modalLabel}>Conjuntos Fixos</Text>
                  <Text style={styles.modalValue}>{cicloResumo.fixos} cards</Text>
                </View>

                <View style={styles.modalDivider} />

                <View style={styles.modalTotalRow}>
                  <Text style={styles.modalTotalLabel}>📦 Total do Ciclo</Text>
                  <Text style={styles.modalTotalValue}>{cicloResumo.total} cards</Text>
                </View>

                {config.limiteAtivo && (
                  <Text style={styles.modalLimiteText}>
                    🚫 Limite diário ativo: {config.limiteDiarioTotal} cards
                  </Text>
                )}
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalStudyButton} onPress={handleEstudarAgora}>
                <Text style={styles.modalStudyButtonText}>ESTUDAR AGORA</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Seleção de Conjuntos */}
      <Modal visible={setsModalVisible} transparent animationType="slide" onRequestClose={() => setSetsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Selecionar Conjuntos Fixos</Text>
            <ScrollView style={{ width: '100%' }}>
              {allSets.map(set => {
                const isSelected = (config.conjuntosFixosSelecionados || []).includes(set.id);
                return (
                  <TouchableOpacity 
                    key={set.id} 
                    style={styles.setSelectRow}
                    onPress={() => toggleSetSelection(set.id)}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Text style={styles.checkboxCheck}>✓</Text>}
                    </View>
                    <Text style={styles.setSelectTitle}>{set.title}</Text>
                  </TouchableOpacity>
                );
              })}
              {allSets.length === 0 && (
                <Text style={styles.noSetsText}>Nenhum conjunto encontrado.</Text>
              )}
            </ScrollView>
            <TouchableOpacity style={[styles.modalCloseButton, { marginTop: 16 }]} onPress={() => setSetsModalVisible(false)}>
              <Text style={styles.modalCloseButtonText}>Concluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#000',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 140, 
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
    marginTop: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    flexShrink: 1,
  },
  subtext: {
    fontSize: 11,
    color: '#666',
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLarge: {
    borderWidth: 1,
    borderColor: '#D1D9E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
    width: 100,
  },
  inputSmall: {
    borderWidth: 1,
    borderColor: '#D1D9E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 16,
    color: '#333',
    width: 60,
    textAlign: 'center',
  },
  twoColumnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  columnLabel: {
    fontSize: 12,
    color: '#000',
    marginBottom: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  columnLabelLarge: {
    fontSize: 12,
    color: '#000',
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterBtn: {
    backgroundColor: '#8DE8C7',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  counterBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  counterInput: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 48,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#D1D9E0',
    borderRadius: 4,
    marginHorizontal: 8,
    height: 32,
    paddingVertical: 0,
    color: '#000',
  },
  fakeSliderContainer: {
    marginTop: 12,
    height: 20,
    justifyContent: 'center',
  },
  fakeSliderTrack: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    width: '100%',
  },
  fakeSliderThumb: {
    position: 'absolute',
    left: '40%',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4DA8DA',
  },
  selectButton: {
    backgroundColor: '#E1F5FE',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  selectButtonText: {
    color: '#0277BD',
    fontWeight: 'bold',
    fontSize: 12,
  },
  linkText: {
    color: '#5C85A8',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F0F4F8',
    padding: 16,
    paddingBottom: 32,
  },
  saveButton: {
    backgroundColor: '#648CB4',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  restoreButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalContent: {
    marginBottom: 20,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 24,
  },
  modalLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  modalValue: {
    fontSize: 14,
    color: '#648CB4',
    fontWeight: 'bold',
  },
  modalDivider: {
    height: 2,
    backgroundColor: '#648CB4',
    marginVertical: 12,
    borderRadius: 1,
  },
  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modalLimiteText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  modalActions: {
    gap: 10,
  },
  modalStudyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalStudyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  setSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D9E0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxCheck: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  setSelectTitle: {
    fontSize: 16,
    color: '#333',
    flexShrink: 1,
  },
  noSetsText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    fontSize: 14,
  },
});

export default ConfiguracaoCicloScreen;
