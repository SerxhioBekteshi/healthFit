import React from 'react';
import { Switch as HeadlessSwitch } from '@headlessui/react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  // Names the switch for screen readers; the visible text sits next to it.
  label: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
}) => (
  <HeadlessSwitch
    checked={checked}
    onChange={onChange}
    disabled={disabled}
    aria-label={label}
    className="group relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-white/15 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-signal"
  >
    <span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-white shadow transition-transform duration-200 group-data-[checked]:translate-x-6" />
  </HeadlessSwitch>
);
