import { render } from '@testing-library/react-native';
import { ShelfProgressBar } from '../ShelfProgressBar';
import { SHELVES } from '../ShelfConfig';

const UNFILLED = '#EAE0D2';
const FILLED = '#D2691E';
const MUTED = '#C8B8A2';

const EMPTY_COUNTS: Record<string, number> = {
  protein: 0, vegetable: 0, grain: 0, spice: 0, oil: 0,
};

// The progress row renders one View per SHELVES entry, in order, each with a
// style array of [{ height: 6, ... }, { backgroundColor: color }]. Walk the
// rendered tree and pull out just those color values, in DOM order.
function segmentColors(tree: ReturnType<ReturnType<typeof render>['toJSON']>): string[] {
  const colors: string[] = [];
  function walk(node: any) {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node.type === 'View' && Array.isArray(node.props?.style)) {
      const [base, colorStyle] = node.props.style;
      if (base?.height === 6 && colorStyle?.backgroundColor) {
        colors.push(colorStyle.backgroundColor);
      }
    }
    if (node.children) walk(node.children);
  }
  walk(tree);
  return colors;
}

describe('ShelfProgressBar', () => {
  it('renders exactly one segment per shelf', () => {
    const { toJSON } = render(<ShelfProgressBar currentIndex={0} meterCounts={EMPTY_COUNTS} />);

    expect(segmentColors(toJSON())).toHaveLength(SHELVES.length);
  });

  it('renders all segments unfilled when currentIndex is -1 (nothing reached yet)', () => {
    const { toJSON } = render(<ShelfProgressBar currentIndex={-1} meterCounts={EMPTY_COUNTS} />);

    expect(segmentColors(toJSON())).toEqual([UNFILLED, UNFILLED, UNFILLED, UNFILLED, UNFILLED]);
  });

  it('always fills the current shelf, even when its own contents are still unmet', () => {
    // You just arrived on this shelf — it hasn't had a chance to be filled
    // yet, so it must never render muted just for being empty right now.
    const { toJSON } = render(<ShelfProgressBar currentIndex={2} meterCounts={EMPTY_COUNTS} />);

    expect(segmentColors(toJSON())).toEqual([MUTED, MUTED, FILLED, UNFILLED, UNFILLED]);
  });

  it('derives a past shelf\'s color purely from whether its contents meet its minCount, not from any button that was tapped', () => {
    // SHELVES order: protein(min 1), vegetable(min 1), grain(min 1), spice(min 5), oil(min 1).
    const counts = { protein: 2, vegetable: 0, grain: 1, spice: 0, oil: 0 };
    const { toJSON } = render(<ShelfProgressBar currentIndex={3} meterCounts={counts} />);

    expect(segmentColors(toJSON())).toEqual([
      FILLED, // protein: 2 >= 1, met
      MUTED, // vegetable: 0 < 1, unmet
      FILLED, // grain: 1 >= 1, met
      FILLED, // spice: current index — always filled regardless of its own count
      UNFILLED, // oil: not reached yet
    ]);
  });

  it('mutes every past shelf when none of them meet their minCount', () => {
    const { toJSON } = render(
      <ShelfProgressBar currentIndex={SHELVES.length - 1} meterCounts={EMPTY_COUNTS} />
    );

    expect(segmentColors(toJSON())).toEqual([MUTED, MUTED, MUTED, MUTED, FILLED]);
  });

  it('fills every past shelf when all of them meet their minCount', () => {
    const counts = { protein: 1, vegetable: 1, grain: 1, spice: 5, oil: 1 };
    const { toJSON } = render(
      <ShelfProgressBar currentIndex={SHELVES.length - 1} meterCounts={counts} />
    );

    expect(segmentColors(toJSON())).toEqual([FILLED, FILLED, FILLED, FILLED, FILLED]);
  });
});
