import React from 'react';

interface AccentTextProps {
  // The last words are set apart in the accent style.
  text: string;
  className: string;
  as?: 'em' | 'span';
  words?: number;
}

export const AccentText: React.FC<AccentTextProps> = ({
  text,
  className,
  as: Tag = 'span',
  words = 1,
}) => {
  const parts = text.split(' ');
  const split = Math.max(0, parts.length - words);
  const head = parts.slice(0, split).join(' ');
  const tail = parts.slice(split).join(' ');

  return (
    <>
      {head ? `${head} ` : null}
      <Tag className={className}>{tail}</Tag>
    </>
  );
};
