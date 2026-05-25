import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView
} from 'react-native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import db from '../../db';
import { cicloConfigs } from '../../db/schema';
import { saveCycleConfig } from '../../dbServices.drizzle';

const ConfiguracaoCicloScreen: React.FC = () => {
  const { data: config } = useLiveQuery(
    db.select().from(cicloConfigs).limit(1)
  );

  const DEFAULTS = {
    limiteDiarioTotal: 0,
    limiteAtivo: false,
    cardsPorConjuntoObrigatorio: 40,
    qtdConjuntosAtrasados: 5,
    cardsPorConjuntoAtrasado: 20,
    cardsErrosAnteriores: 20,
    cardsImportantes: 20,
    qtdConjuntosFixosPorCiclo: 1,
    cardsPorConjuntoFixo: 20,
  };

  const [limiteDiarioTotal, setLimiteDiarioTotal] = useState(DEFAULTS.limiteDiarioTotal);
  const [limiteAtivo, setLimiteAtivo] = useState(DEFAULTS.limiteAtivo);
  const [cardsPorConjuntoObrigatorio, setCardsPorConjuntoObrigatorio] = useState(DEFAULTS.cardsPorConjuntoObrigatorio);
  const [qtdConjuntosAtrasados, setQtdConjuntosAtrasados] = useState(DEFAULTS.qtdConjuntosAtrasados);
  const [cardsPorConjuntoAtrasado, setCardsPorConjuntoAtrasado] = useState(DEFAULTS.cardsPorConjuntoAtrasado);
  const [cardsErrosAnteriores, setCardsErrosAnteriores] = useState(DEFAULTS.cardsErrosAnteriores);
  const [cardsImportantes, setCardsImportantes] = useState(DEFAULTS.cardsImportantes);
  const [qtdConjuntosFixosPorCiclo, setQtdConjuntosFixosPorCiclo] = useState(DEFAULTS.qtdConjuntosFixosPorCiclo);
  const [cardsPorConjuntoFixo, setCardsPorConjuntoFixo] = useState(DEFAULTS.cardsPorConjuntoFixo);

  useEffect(() => {
    if (config) {
      setLimiteDiarioTotal(config?.[0]?.limiteDiarioTotal ?? DEFAULTS.limiteDiarioTotal);
      setLimiteAtivo(Boolean(config?.[0]?.limiteAtivo));
      setCardsPorConjuntoObrigatorio(config?.[0]?.cardsPorConjuntoObrigatorio ?? DEFAULTS.cardsPorConjuntoObrigatorio);
      setQtdConjuntosAtrasados(config?.[0]?.qtdConjuntosAtrasados ?? DEFAULTS.qtdConjuntosAtrasados);
      setCardsPorConjuntoAtrasado(config?.[0]?.cardsPorConjuntoAtrasado ?? DEFAULTS.cardsPorConjuntoAtrasado);
      setCardsErrosAnteriores(config?.[0]?.cardsErrosAnteriores ?? DEFAULTS.cardsErrosAnteriores);
      setCardsImportantes(config?.[0]?.cardsImportantes ?? DEFAULTS.cardsImportantes);
      setQtdConjuntosFixosPorCiclo(config?.[0]?.qtdConjuntosFixosPorCiclo ?? DEFAULTS.qtdConjuntosFixosPorCiclo);
      setCardsPorConjuntoFixo(config?.[0]?.cardsPorConjuntoFixo ?? DEFAULTS.cardsPorConjuntoFixo);
    }
  }, [config]);

  const restaurarPadroes = () => {
    setLimiteDiarioTotal(DEFAULTS.limiteDiarioTotal);
    setLimiteAtivo(DEFAULTS.limiteAtivo);
    setCardsPorConjuntoObrigatorio(DEFAULTS.cardsPorConjuntoObrigatorio);
    setQtdConjuntosAtrasados(DEFAULTS.qtdConjuntosAtrasados);
    setCardsPorConjuntoAtrasado(DEFAULTS.cardsPorConjuntoAtrasado);
    setCardsErrosAnteriores(DEFAULTS.cardsErrosAnteriores);
    setCardsImportantes(DEFAULTS.cardsImportantes);
    setQtdConjuntosFixosPorCiclo(DEFAULTS.qtdConjuntosFixosPorCiclo);
    setCardsPorConjuntoFixo(DEFAULTS.cardsPorConjuntoFixo);
  };

  const salvarConfiguracoes = async () => {
    try {
      await saveCycleConfig({
        limiteDiarioTotal,
        limiteAtivo: limiteAtivo ? 1 : 0,
        cardsPorConjuntoObrigatorio,
        qtdConjuntosAtrasados,
        cardsPorConjuntoAtrasado,
        cardsErrosAnteriores,
        cardsImportantes,
        qtdConjuntosFixosPorCiclo,
        cardsPorConjuntoFixo,
      });
      Alert.alert('Sucesso', 'Configurações salvas com sucesso!');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações. Verifique o banco de dados.');
    }
  };

  const Counter = ({ value, setter }: { value: number, setter: React.Dispatch<React.SetStateAction<number>> }) => (
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
              value={limiteDiarioTotal.toString()}
              onChangeText={(text) => setLimiteDiarioTotal(Number(text) || 0)}
            />
            <Switch 
              value={limiteAtivo} 
              onValueChange={setLimiteAtivo} 
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
              <Counter value={qtdConjuntosAtrasados} setter={setQtdConjuntosAtrasados} />
            </View>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Cards por Conjunto</Text>
              <Counter value={cardsPorConjuntoAtrasado} setter={setCardsPorConjuntoAtrasado} />
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
              value={cardsPorConjuntoObrigatorio.toString()}
              onChangeText={(text) => setCardsPorConjuntoObrigatorio(Number(text) || 0)}
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
              value={cardsErrosAnteriores.toString()}
              onChangeText={(text) => setCardsErrosAnteriores(Number(text) || 0)}
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
              value={cardsImportantes.toString()}
              onChangeText={(text) => setCardsImportantes(Number(text) || 0)}
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
            <TouchableOpacity style={styles.selectButton}>
              <Text style={styles.selectButtonText}>SELECIONAR CONJUNTOS</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.linkText}>Ver Todos/Adicionar</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.cardRow, {marginTop: 16}]}>
            <Text style={styles.columnLabelLarge}>QUANTIDADE DE CONJUNTOS FIXOS POR CICLO</Text>
            <Counter value={qtdConjuntosFixosPorCiclo} setter={setQtdConjuntosFixosPorCiclo} />
          </View>
          
          <View style={[styles.cardRow, {marginTop: 16}]}>
            <Text style={styles.columnLabelLarge}>CARDS POR CONJUNTO FIXO</Text>
            <Counter value={cardsPorConjuntoFixo} setter={setCardsPorConjuntoFixo} />
          </View>
        </View>

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={salvarConfiguracoes}>
          <Text style={styles.saveButtonText}>SALVAR CONFIGURAÇÕES</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.restoreButton} onPress={restaurarPadroes}>
          <Text style={styles.restoreButtonText}>Restaurar Padrões</Text>
        </TouchableOpacity>
      </View>
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
});

export default ConfiguracaoCicloScreen;
