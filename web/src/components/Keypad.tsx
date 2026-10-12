interface Props {
  onKey: (key: string) => void;
  hasInput: boolean;
}

const ROWS: { key: string; label: string; aria?: string }[][] = [
  [{ key: '7', label: '7' }, { key: '8', label: '8' }, { key: '9', label: '9' }],
  [{ key: '4', label: '4' }, { key: '5', label: '5' }, { key: '6', label: '6' }],
  [{ key: '1', label: '1' }, { key: '2', label: '2' }, { key: '3', label: '3' }],
  [{ key: 'neg', label: '±', aria: 'Toggle minus sign' }, { key: '0', label: '0' }, { key: '.', label: '.', aria: 'Decimal point' }],
];

const keyClass =
  'btn min-h-11 compact:min-h-[38px] short:min-h-9 select-none text-xl font-medium tabular active:bg-accent-soft';

export function Keypad({ onKey, hasInput }: Props) {
  return (
    <div className="grid grid-cols-3 gap-1.5 compact:gap-1" role="group" aria-label="Number keypad">
      {ROWS.flat().map((k) => (
        <button key={k.key} type="button" className={keyClass} aria-label={k.aria} onClick={() => onKey(k.key)}>
          {k.label}
        </button>
      ))}
      <button type="button" className={`${keyClass} text-base`} aria-label="Delete last digit" onClick={() => onKey('back')}>
        ⌫
      </button>
      <button type="button" className="btn btn-primary col-span-2 min-h-11 compact:min-h-[38px] short:min-h-9 select-none text-base" onClick={() => onKey('enter')}>
        {hasInput ? 'Submit' : 'Skip'}
      </button>
    </div>
  );
}
