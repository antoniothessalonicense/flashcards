import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import db from '../../db';
import { sets } from '../../db/schema';
import type { InferModel } from 'drizzle-orm';
import { lte, asc } from 'drizzle-orm';

type SetRow = InferModel<typeof sets, 'select'>;

const LiveSetsList: React.FC = () => {
  const now = Date.now();

  // useLiveQuery atualiza a UI automaticamente quando os dados mudam no DB
  const { data: overdueSets } = useLiveQuery(
    db.select().from(sets).where(lte(sets.next_review_date, now)).orderBy(asc(sets.next_review_date))
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conjuntos Atrasados</Text>
      <FlatList
        data={overdueSets || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemSubtitle}>Próxima revisão: {new Date(item.next_review_date).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={() => <Text style={styles.empty}>Nenhum conjunto atrasado</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  item: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
  itemTitle: { fontSize: 16, fontWeight: '600' },
  itemSubtitle: { fontSize: 12, color: '#666', marginTop: 4 },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
});

export default LiveSetsList;
