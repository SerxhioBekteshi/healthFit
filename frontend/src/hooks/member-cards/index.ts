import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memberCardsService } from '@/services/member-cards';
import type { IssueCardValues } from '@gym/shared/validation/member-cards';

const cardsQueryKey = ['member-cards'] as const;

export const useMemberCards = () => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: cardsQueryKey });

  const cardsQuery = useQuery({
    queryKey: cardsQueryKey,
    queryFn: memberCardsService.list,
  });

  const issueCard = useMutation({
    meta: { success: 'Card issued.' },
    mutationFn: (input: IssueCardValues) => memberCardsService.issue(input),
    onSuccess: invalidate,
  });

  const setCardActive = useMutation({
    meta: { success: 'Card updated.' },
    mutationFn: ({ cardId, isActive }: { cardId: string; isActive: boolean }) =>
      memberCardsService.setActive(cardId, isActive),
    onSuccess: invalidate,
  });

  return {
    cards: cardsQuery.data ?? [],
    isLoading: cardsQuery.isLoading,
    error: cardsQuery.error,
    issueCard,
    setCardActive,
  };
};
