import { BRICK_ROW_COLORS, COLORS } from '../game/constants';
import { LEVELS } from '../game/levels';

type Props = {
  unlocked: number;
  bestByLevel: Record<number, number>;
  onPick: (level: number) => void;
  onBack: () => void;
};

// Tiny preview of a level's brick layout.
function Preview({ grid }: { grid: string[] }) {
  return (
    <div className="preview" aria-hidden="true">
      {grid.map((row, r) =>
        row.split('').map((ch, c) => (
          <span
            key={`${r}-${c}`}
            style={{
              background:
                ch === '.' ? 'transparent' : ch === 'S' ? COLORS.steel : ch === 'P' ? '#ffffff' : BRICK_ROW_COLORS[r % BRICK_ROW_COLORS.length],
            }}
          />
        )),
      )}
    </div>
  );
}

export default function LevelSelect({ unlocked, bestByLevel, onPick, onBack }: Props) {
  return (
    <section className="panel levels">
      <div className="levels__head">
        <h2>Choose a level</h2>
        <button className="btn btn--small" onClick={onBack}>
          Back
        </button>
      </div>
      <ul className="levels__grid">
        {LEVELS.map((lvl, i) => {
          const n = i + 1;
          const locked = n > unlocked;
          return (
            <li key={lvl.name}>
              <button className="level-card" disabled={locked} onClick={() => onPick(n)}>
                <Preview grid={lvl.grid} />
                <span className="level-card__name">
                  {n}. {lvl.name}
                </span>
                <span className="level-card__meta">
                  {locked ? 'Locked' : bestByLevel[n] ? `Best ${bestByLevel[n].toLocaleString()}` : 'Not cleared yet'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
