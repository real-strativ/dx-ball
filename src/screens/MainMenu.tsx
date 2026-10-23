import BrickTitle from '../components/BrickTitle';
import PowerIcon from '../components/PowerIcon';
import { POWERUP_STYLE } from '../game/constants';
import { LEVELS } from '../game/levels';
import type { PowerUpType } from '../game/types';

type Props = {
  highScore: number;
  unlocked: number;
  onPlay: () => void;
  onContinue: () => void;
  onLevels: () => void;
};

export default function MainMenu({ highScore, unlocked, onPlay, onContinue, onLevels }: Props) {
  return (
    <section className="panel menu">
      <BrickTitle text="Brick Blaster" />
      <p className="menu__tagline">Break every brick. Catch the good capsules. Dodge the bad ones.</p>

      <div className="menu__actions">
        <button className="btn btn--primary" onClick={onPlay} autoFocus>
          New game
        </button>
        {unlocked > 1 && (
          <button className="btn" onClick={onContinue}>
            Continue from level {unlocked}
          </button>
        )}
        <button className="btn" onClick={onLevels}>
          Choose level
        </button>
      </div>

      <dl className="menu__stats">
        <div>
          <dt>High score</dt>
          <dd>{highScore.toLocaleString()}</dd>
        </div>
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
