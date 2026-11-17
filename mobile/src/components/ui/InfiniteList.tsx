import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import type { Edge } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles, type Theme } from '@/theme';
import { EmptyState, ErrorState } from './EmptyState';
import { LoadingView } from './LoadingView';
import { ScreenContainer } from './Screen';

// The part of a paged React Query result the list needs.
export interface PagedQuery {
  isPending: boolean;
  isRefetching: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
  refetch: () => Promise<unknown>;
}

interface InfiniteListProps<TItem> {
  data: TItem[] | undefined;
  query: PagedQuery;
  keyExtractor: (item: TItem) => string;
  renderItem: (item: TItem) => React.ReactElement;
  emptyTitle: string;
  emptyMessage?: string;
  // Shown above the first row, for example the balance.
  header?: React.ReactNode;
  edges?: Edge[];
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    content: { padding: theme.spacing.lg, flexGrow: 1 },
    separator: { height: theme.spacing.sm },
    header: { marginBottom: theme.spacing.lg },
    footer: { paddingVertical: theme.spacing.lg },
  });

// A long, cursor-paged list: the next page loads as the member scrolls to the end.
export const InfiniteList = <TItem,>({
  data,
  query,
  keyExtractor,
  renderItem,
  emptyTitle,
  emptyMessage,
  header,
  edges = ['bottom'],
}: InfiniteListProps<TItem>): React.ReactElement => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  if (data === undefined) {
    return (
      <ScreenContainer edges={edges}>
        {query.isPending ? (
          <LoadingView fill />
        ) : (
          <ErrorState
            message={query.error?.message ?? t('Please try again.')}
            onRetry={() => void query.refetch()}
          />
        )}
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={edges}>
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => renderItem(item)}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          header ? <View style={styles.header}>{header}</View> : undefined
        }
        ListEmptyComponent={
          <EmptyState title={emptyTitle} message={emptyMessage} />
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : undefined
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => void query.refetch()}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      />
    </ScreenContainer>
  );
};
