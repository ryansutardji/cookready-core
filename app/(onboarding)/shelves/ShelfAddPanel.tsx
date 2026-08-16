import { View } from 'react-native';
import { SingleIngredientBar } from '../SingleIngredientBar';
import { ShelfBundleSection } from './ShelfBundleSection';
import type { MeterSlot } from './ShelfConfig';

type Props = {
  slot: MeterSlot;
  onAdded: () => void;
};

// Shared reusable core: search bar + bundle section for a given shelf's
// categories. No header, no footer, no progress bar — free of any
// shelf-navigation concerns so it can be reused (e.g. the recap screen's
// "Add" modal) without dragging shelf-sequencing UI along with it.
export function ShelfAddPanel({ slot, onAdded }: Props) {
  return (
    <View style={{ gap: 12 }}>
      <SingleIngredientBar
        categories={slot.categories}
        placeholder={`Search a ${slot.searchLabel}…`}
        lockedCategory={slot.categories[0]}
        onAdded={onAdded}
      />
      <ShelfBundleSection categories={slot.categories} onAdded={onAdded} />
    </View>
  );
}
