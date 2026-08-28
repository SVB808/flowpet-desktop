import { mascotById } from '../lib/mascots';
import type { CSSProperties } from 'react';
import type { MascotId, PetState } from '../lib/types';

const props: Record<MascotId, string> = {
  otter: '●',
  fennec: '▤',
  raccoon: '✦',
  red_panda: '❧',
  penguin: '✓',
  capybara: '⌇',
};

function propFor(mascot: MascotId, state: PetState) {
  if (state === 'focused' || state === 'deep_focus') return props[mascot];
  if (state === 'nudging') return '!';
  if (state === 'recovering') return '↗';
  if (state === 'celebrating') return '✦';
  if (state === 'break' || state === 'sleeping') return 'z';
  return '';
}

function earStyle(mascot: MascotId): CSSProperties {
  // The body sits at z-index 3. Small ears were previously rendered behind it,
  // which made round-eared companions look earless in previews and the pet window.
  switch (mascot) {
    case 'otter':
      return { zIndex: 4, width: '14%', height: '14%', top: '29%', borderRadius: '50%' };
    case 'raccoon':
      return { zIndex: 4, width: '18%', height: '19%', top: '22%', borderRadius: '58% 58% 38% 38%' };
    case 'red_panda':
      return { zIndex: 4, width: '20%', height: '21%', top: '20%', borderRadius: '62% 62% 34% 34%' };
    case 'capybara':
      return { zIndex: 4, width: '14%', height: '14%', top: '28%', borderRadius: '50%' };
    default:
      return { zIndex: 4 };
  }
}

export function Mascot({
  mascot,
  state,
  name,
  size = 'large',
  speaking = false,
}: {
  mascot: MascotId;
  state: PetState;
  name?: string;
  size?: 'tiny' | 'small' | 'large';
  speaking?: boolean;
}) {
  const definition = mascotById(mascot);
  const label = name?.trim() || definition.name;
  const ears = earStyle(mascot);

  return (
    <div
      className={`mascot mascot--${definition.cssClass} mascot--${state} mascot--${size} ${speaking ? 'mascot--speaking' : ''}`}
      role="img"
      aria-label={`${label} is ${state.replace('_', ' ')}`}
    >
      <span className="mascot__aura" />
      <span className="mascot__shadow" />
      <span className="mascot__tail" />
      <span className="mascot__ear mascot__ear--left" style={ears} />
      <span className="mascot__ear mascot__ear--right" style={ears} />
      <span className="mascot__body">
        <span className="mascot__belly" />
        <span className="mascot__face">
          <span className="mascot__patch mascot__patch--left" />
          <span className="mascot__patch mascot__patch--right" />
          <span className="mascot__eye mascot__eye--left" />
          <span className="mascot__eye mascot__eye--right" />
          <span className="mascot__nose" />
          <span className="mascot__mouth" />
          <span className="mascot__beak" />
        </span>
        <span className="mascot__paw mascot__paw--left" />
        <span className="mascot__paw mascot__paw--right" />
      </span>
      <span className="mascot__prop">{propFor(mascot, state)}</span>
      <span className="mascot__spark">✦</span>
    </div>
  );
}
