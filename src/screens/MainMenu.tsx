import BrickTitle from '../components/BrickTitle';
import PowerIcon from '../components/PowerIcon';
import { POWERUP_STYLE } from '../game/constants';
import { LEVELS } from '../game/levels';
import type { PowerUpType } from '../game/types';
import { TOP_SCORES, type ScoreEntry } from '../utils/leaderboard';

type Props = {
  topScores: ScoreEntry[] | null;
  playerName: string;
  onNameChange: (name: string) => void;
  unlocked: number;
  onPlay: () => void;
  onContinue: () => void;
  onLevels: () => void;
};

export default function MainMenu({ topScores, playerName, onNameChange, unlocked, onPlay, onContinue, onLevels }: Props) {
  const hasName = playerName.trim().length > 0;

  return (
    <section className="panel menu">
      <BrickTitle text="Brick Blaster" />
      <p className="menu__tagline">Break every brick. Catch the good capsules. Dodge the bad ones.</p>

      <form
        className="menu__actions"
        onSubmit={(e) => {
          e.preventDefault();
          if (hasName) onPlay();
        }}
      >
        <label className="menu__name">
          <span>Your name</span>
          <input
            type="text"
            value={playerName}
            onChange={(e) => onNameChange(e.target.value)}
            maxLength={16}
            placeholder="Enter your name"
            autoComplete="nickname"
            autoFocus={!hasName}
          />
        </label>
        <button type="submit" className="btn btn--primary" disabled={!hasName} autoFocus={hasName}>
          New game
        </button>
        {unlocked > 1 && (
          <button type="button" className="btn" onClick={onContinue} disabled={!hasName}>
            Continue from level {unlocked}
          </button>
        )}
        <button type="button" className="btn" onClick={onLevels} disabled={!hasName}>
          Choose level
        </button>
      </form>

      <div className="leaderboard">
        <h2 className="leaderboard__title">Top {TOP_SCORES} scorers</h2>
        {topScores === null ? (
          <p className="leaderboard__empty">Leaderboard unavailable right now.</p>
        ) : topScores.length === 0 ? (
          <p className="leaderboard__empty">No scores yet. Be the first!</p>
        ) : (
          <ol className="leaderboard__list">
            {topScores.map((entry, i) => (
              <li key={i} className="leaderboard__row">
                <span className="leaderboard__rank">{i + 1}</span>
                <span className="leaderboard__name">{entry.name}</span>
                <span className="leaderboard__score">{entry.score.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <dl className="menu__stats">
        <div>
          <dt>Levels unlocked</dt>
          <dd>
            {unlocked} of {LEVELS.length}
          </dd>
        </div>
      </dl>

      <ul className="legend" aria-label="Power-ups">
        {(Object.keys(POWERUP_STYLE) as PowerUpType[]).map((type) => (
          <li key={type} className="legend__item">
            <span className="legend__capsule" style={{ background: POWERUP_STYLE[type].color }}>
              <PowerIcon type={type} size={16} />
            </span>
            {POWERUP_STYLE[type].label}
          </li>
        ))}
      </ul>

      <p className="menu__controls">
        Move with the mouse, touch or arrow keys. Click or press Space to launch and fire. P pauses, F goes full screen.
      </p>
    </section>
  );
}
