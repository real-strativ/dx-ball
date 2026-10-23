import { EFFECT_LABEL } from '../game/constants';
import PowerIcon from './PowerIcon';
import type { EffectType } from '../game/types';

export type HudData = {
  score: number;
  lives: number;
  level: number;
  levelName: string;
  effects: { type: EffectType; seconds: number }[];
};

type Props = HudData & {
  muted: boolean;
  fullscreen: boolean;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onPause: () => void;
};

export default function HUD({ score, lives, level, levelName, effects, muted, fullscreen, onToggleMute, onToggleFullscreen, onPause }: Props) {
  return (
    <div className="hud">
      <div className="hud__row">
        <div className="hud__stat">
          <span className="hud__label">Score</span>
          <span className="hud__value">{score.toLocaleString()}</span>
        </div>
        <div className="hud__stat">
          <span className="hud__label">Level {level}</span>
          <span className="hud__value">{levelName}</span>
        </div>
        <div className="hud__stat">
          <span className="hud__label">Lives</span>
          <span className="hud__lives" aria-label={`${lives} lives`}>
            {Array.from({ length: lives }, (_, i) => (
              <span key={i} className="hud__life" />
            ))}
          </span>
        </div>
        <div className="hud__buttons">
          <button className="btn btn--small" onClick={onToggleMute}>
            {muted ? 'Sound off' : 'Sound on'}
          </button>
          <button className="btn btn--small" onClick={onToggleFullscreen}>
            {fullscreen ? 'Exit full screen' : 'Full screen'}
          </button>
          <button className="btn btn--small" onClick={onPause}>
            Pause
          </button>
        </div>
      </div>
      <div className="hud__effects" aria-live="polite">
        {effects.map((e) => (
          <span key={e.type} className={`effect effect--${e.type}`}>
            <PowerIcon type={e.type} size={14} color={e.type === 'slow' ? '#ffffff' : '#0b0f24'} />
            {EFFECT_LABEL[e.type]} {e.seconds}s
          </span>
        ))}
      </div>
    </div>
  );
}
