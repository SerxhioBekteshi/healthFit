import React from 'react';
import { fieldInputClass } from '@/components/common/FormField';
import { t } from '@/i18n';
import type { Client, MemberCard } from '@gym/shared/types';

interface DevScanSimulatorProps {
  clients: Client[];
  cards: MemberCard[];
  onSimulate: (code: string) => void;
}

// Stand-in for a physical card reader during development: a real reader just types a card's
// number into the focused field, so this picks a member and sends what their reader would send.
// Only rendered when `import.meta.env.DEV`; never ships to gym admins.
export const DevScanSimulator: React.FC<DevScanSimulatorProps> = ({
  clients,
  cards,
  onSimulate,
}) => {
  const activeClients = clients
    .filter((client) => client.isActive)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <div className="mt-3 rounded-lg border border-dashed border-warn/40 bg-warn/5 p-3">
      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-warn">
        {t('Dev only: simulate a reader')}
      </p>
      <select
        aria-label={t('Simulate a tap')}
        value=""
        className={`${fieldInputClass} mt-2`}
        onChange={(event) => {
          const clientId = event.target.value;
          if (!clientId) return;
          const card = cards.find(
            (item) => item.isActive && item.clientId === clientId
          );
          onSimulate(card?.number ?? clientId);
          event.target.value = '';
        }}
      >
        <option value="">{t('Pick a member to simulate their tap...')}</option>
        {activeClients.map((client) => {
          const hasCard = cards.some(
            (card) => card.isActive && card.clientId === client.id
          );
          return (
            <option key={client.id} value={client.id}>
              {hasCard
                ? t('{{name}} (has a card)', { name: client.fullName })
                : t('{{name}} (no card, uses their QR code)', {
                    name: client.fullName,
                  })}
            </option>
          );
        })}
      </select>
    </div>
  );
};
