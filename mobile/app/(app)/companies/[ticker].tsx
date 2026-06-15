import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { companiesApi } from '@/services/api';
import { colors, spacing, radii } from '@/utils/theme';

const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'N/A';
    if (val > 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val > 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
};

export default function CompanyDetailScreen() {
    const { ticker } = useLocalSearchParams<{ ticker: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [metrics, setMetrics] = useState<any>(null);
    const [filings, setFilings] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [metricsData, filingsData] = await Promise.all([
                    companiesApi.getMetrics(ticker),
                    companiesApi.getFilings(ticker),
                    // companiesApi.getHistorical(ticker) -> Listo para cuando agregues gráficos
                ]);
                setMetrics(metricsData);
                setFilings(filingsData);
            } catch (err) {
                setError('No se pudo cargar la información financiera.');
            } finally {
                setLoading(false);
            }
        };
        if (ticker) fetchData();
    }, [ticker]);

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Cargando datos de {ticker}...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.centered]}>
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>{ticker}</Text>
                <Text style={styles.subtitle}>Datos financieros</Text>
            </View>

            <Text style={styles.sectionTitle}>MÉTRICAS ACTUALES</Text>
            <View style={styles.metricsGrid}>
                <MetricCard title="Revenue" value={formatCurrency(metrics?.revenue)} />
                <MetricCard title="Net Income" value={formatCurrency(metrics?.netIncome)} />
                <MetricCard title="EPS" value={formatCurrency(metrics?.eps)} />
                <MetricCard title="Total Assets" value={formatCurrency(metrics?.totalAssets)} />
            </View>

            <Text style={styles.sectionTitle}>EVOLUCIÓN HISTÓRICA</Text>
            <View style={styles.chartPlaceholder}>
                <Text style={styles.placeholderText}>
                    Los gráficos estarán disponibles próximamente.
                </Text>
            </View>

            <Text style={styles.sectionTitle}>FILINGS RECIENTES (10-K / 10-Q)</Text>
            <View style={styles.filingsContainer}>
                {filings.length > 0 ? (
                    filings.map((filing, index) => (
                        <View key={filing.accessionNumber} style={[styles.filingRow, index !== filings.length - 1 && styles.filingBorder]}>
                            <View style={styles.filingLeft}>
                                <View style={[styles.typeBadge, filing.type === '10-K' ? styles.badge10K : styles.badge10Q]}>
                                    <Text style={[styles.typeText, filing.type === '10-K' ? styles.text10K : styles.text10Q]}>{filing.type}</Text>
                                </View>
                                <Text style={styles.accessionText} numberOfLines={1} ellipsizeMode="middle">{filing.accessionNumber}</Text>
                            </View>
                            <Text style={styles.dateText}>{filing.date}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.placeholderText}>No hay filings recientes.</Text>
                )}
            </View>
        </ScrollView>
    );
}

const MetricCard = ({ title, value }: { title: string; value: string | number }) => (
    <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={styles.metricValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    centered: { justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    loadingText: { color: colors.textSecondary, marginTop: spacing.md },
    errorBox: { backgroundColor: colors.errorBg, borderColor: colors.errorBorder, borderWidth: 1, padding: spacing.lg, borderRadius: radii.md },
    errorText: { color: colors.errorText, textAlign: 'center' },
    header: { marginBottom: spacing.xl },
    title: { fontSize: 32, fontWeight: 'bold', color: colors.textPrimary },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', color: colors.textSecondary, marginBottom: spacing.md, tracking: 1 },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.xl },
    metricCard: { width: '48%', backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.sm },
    metricTitle: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: spacing.xs },
    metricValue: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
    chartPlaceholder: { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: radii.md, height: 150, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl },
    placeholderText: { color: colors.textMuted, fontSize: 13 },
    filingsContainer: { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: radii.md, overflow: 'hidden' },
    filingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
    filingBorder: { borderBottomColor: colors.cardBorder, borderBottomWidth: 1 },
    filingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: spacing.sm },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.xl, marginRight: spacing.sm },
    badge10K: { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)', borderWidth: 1 },
    badge10Q: { backgroundColor: 'rgba(6, 182, 212, 0.15)', borderColor: 'rgba(6, 182, 212, 0.3)', borderWidth: 1 },
    typeText: { fontSize: 11, fontWeight: 'bold' },
    text10K: { color: '#93c5fd' },
    text10Q: { color: '#67e8f9' },
    accessionText: { color: colors.textSecondary, fontSize: 13, flex: 1 },
    dateText: { color: colors.textSecondary, fontSize: 13 }
});