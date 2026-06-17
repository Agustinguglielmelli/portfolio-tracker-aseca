import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { companiesApi } from '@/services/api';
import { colors, spacing, radii } from '@/utils/theme';

interface CompanySearchResult {
    cik: string;
    name: string;
    ticker: string;
}

export default function CompanySearchScreen() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CompanySearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const router = useRouter();

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const data = await companiesApi.search(query);
            setResults(data);
            setHasSearched(true);
        } catch (error) {
            console.error('Error buscando empresas', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: CompanySearchResult }) => (
        <TouchableOpacity
            style={styles.resultItem}
            onPress={() => router.push(`/companies/${item.ticker}`)}
        >
            <View style={styles.resultInfo}>
                <Text style={styles.companyName}>{item.name}</Text>
                <Text style={styles.companyCik}>CIK: {item.cik}</Text>
            </View>
            <View style={styles.tickerBadge}>
                <Text style={styles.tickerText}>{item.ticker || 'N/A'}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Buscar empresa</Text>

            <View style={styles.searchRow}>
                <TextInput
                    style={styles.input}
                    placeholder="Nombre o ticker (ej. AAPL)"
                    placeholderTextColor={colors.textMuted}
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearch}
                />
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.searchButtonText}>Buscar</Text>
                    )}
                </TouchableOpacity>
            </View>

            {hasSearched && results.length === 0 && !loading && (
                <Text style={styles.emptyText}>No se encontraron resultados para "{query}".</Text>
            )}

            <FlatList
                data={results}
                keyExtractor={(item) => item.cik}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
    title: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.lg },
    searchRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    input: { flex: 1, backgroundColor: colors.input, borderColor: colors.inputBorder, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing.md, color: colors.textInput, height: 48 },
    searchButton: { backgroundColor: colors.primary, borderRadius: radii.md, paddingHorizontal: spacing.lg, justifyContent: 'center', alignItems: 'center', height: 48 },
    searchButtonText: { color: '#fff', fontWeight: 'bold' },
    emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
    listContainer: { paddingBottom: spacing.xxl },
    resultItem: { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: radii.md, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    resultInfo: { flex: 1, paddingRight: spacing.sm },
    companyName: { color: colors.textPrimary, fontWeight: '600', fontSize: 16 },
    companyCik: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
    tickerBadge: { backgroundColor: 'rgba(37, 99, 235, 0.15)', borderColor: 'rgba(37, 99, 235, 0.3)', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.xl },
    tickerText: { color: '#93c5fd', fontWeight: 'bold', fontSize: 13 }
});