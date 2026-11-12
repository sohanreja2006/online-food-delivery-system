import React, { useState } from 'react';
import { Minus, Plus, Sparkles, X } from 'lucide-react';
import {
  BeverageItem,
  ComboMeal,
  DishItem,
  ItemCustomization,
  MenuItem,
  SpiceLevel,
} from '../models/MenuItem';
import { FoodArtwork, VegIndicator } from './FoodArtwork';
import { formatCurrency, ItemTypeBadge } from './uiBadges';

interface CustomizeModalProps {
  item: MenuItem;
  restaurantName: string;
  accentColor: string;
  onClose: () => void;
  onConfirmAdd: (quantity: number, customization: ItemCustomization) => void;
}

export const CustomizeModal: React.FC<CustomizeModalProps> = ({
  item,
  restaurantName,
  accentColor,
  onClose,
  onConfirmAdd,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [spiceOverride, setSpiceOverride] = useState<SpiceLevel>(
    item instanceof DishItem ? item.spiceLevel : 'Medium',
  );
  const [extraCheese, setExtraCheese] = useState(false);
  const [beverageSize, setBeverageSize] = useState<'Regular' | 'Large'>('Regular');
  const [iced, setIced] = useState(item instanceof BeverageItem ? item.supportsIced : true);
  const [upsizeCombo, setUpsizeCombo] = useState(false);
  const [notes, setNotes] = useState('');

  const customization: ItemCustomization = {
    ...(item instanceof DishItem ? { spiceOverride, extraCheese } : {}),
    ...(item instanceof BeverageItem ? { beverageSize, iced } : {}),
    ...(item instanceof ComboMeal ? { upsizeCombo } : {}),
    notes,
  };

  const unitPrice = item.calculateUnitPrice(customization);
  const lineTotal = unitPrice * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E7DFD3] shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-[#E7DFD3] bg-[#FAF7F2]">
          <div className="flex items-center gap-3.5">
            <FoodArtwork
              kind={item.illustration}
              itemName={item.name}
              itemId={item.id}
              accentColor={accentColor}
              className="w-20 h-20 rounded-2xl shadow-xs border border-[#E7DFD3] shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <VegIndicator isVeg={item.isVegetarian} />
                <ItemTypeBadge type={item.getItemType()} />
                <span className="text-xs text-stone-500">{restaurantName}</span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 leading-snug">{item.name}</h3>
              <p className="text-xs text-stone-500 mt-0.5">{item.getDetailsBadge()}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
          <p className="text-sm text-stone-600 leading-relaxed">{item.description}</p>

          {item instanceof DishItem && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                  Spice Preference
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Mild', 'Medium', 'Hot'] as SpiceLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSpiceOverride(level)}
                      className={`py-2 px-3 rounded-xl text-sm font-medium border transition ${
                        spiceOverride === level
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-700 border-[#E7DFD3] hover:border-stone-400'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#E7DFD3] hover:border-stone-400 cursor-pointer transition">
                <div>
                  <div className="text-sm font-semibold text-stone-900">Extra Cheese / Chef Topping</div>
                  <div className="text-xs text-stone-500">Polymorphic DishItem add-on</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-stone-800">+₹45</span>
                  <input
                    type="checkbox"
                    checked={extraCheese}
                    onChange={(e) => setExtraCheese(e.target.checked)}
                    className="w-4 h-4 accent-[#D94E28]"
                  />
                </div>
              </label>
            </div>
          )}

          {item instanceof BeverageItem && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                  Cup Size (Polymorphic Price Scaling)
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['Regular', 'Large'] as const).map((size) => {
                    const priceForSize = item.calculateUnitPrice({ beverageSize: size, iced });
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setBeverageSize(size)}
                        className={`p-3 rounded-xl text-left border transition ${
                          beverageSize === size
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-white text-stone-700 border-[#E7DFD3] hover:border-stone-400'
                        }`}
                      >
                        <div className="text-sm font-semibold">{size}</div>
                        <div
                          className={`text-xs mt-0.5 ${
                            beverageSize === size ? 'text-stone-300' : 'text-stone-500'
                          }`}
                        >
                          {size === 'Large' ? `${Math.round(item.volumeMl * 1.4)}ml` : `${item.volumeMl}ml`} •{' '}
                          {formatCurrency(priceForSize)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {item.supportsIced && (
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#E7DFD3] cursor-pointer">
                  <div>
                    <div className="text-sm font-semibold text-stone-900">Serve Chilled / With Ice</div>
                    <div className="text-xs text-stone-500">Uncheck for light ice / room temp</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={iced}
                    onChange={(e) => setIced(e.target.checked)}
                    className="w-4 h-4 accent-[#D94E28]"
                  />
                </label>
              )}
            </div>
          )}

          {item instanceof ComboMeal && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E7DFD3]">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D94E28] mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Included in Bundle ({item.discountPercent}% Off Base)
                </div>
                <ul className="text-sm text-stone-700 list-disc list-inside space-y-0.5">
                  {item.includedItems.map((sub) => (
                    <li key={sub}>{sub}</li>
                  ))}
                </ul>
              </div>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#E7DFD3] cursor-pointer">
                <div>
                  <div className="text-sm font-semibold text-stone-900">Upsize Sides &amp; Beverage</div>
                  <div className="text-xs text-stone-500">Upgrade drink &amp; side portion</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-stone-800">+₹60</span>
                  <input
                    type="checkbox"
                    checked={upsizeCombo}
                    onChange={(e) => setUpsizeCombo(e.target.checked)}
                    className="w-4 h-4 accent-[#D94E28]"
                  />
                </div>
              </label>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              Kitchen Instructions (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Less oil, extra napkins, no onions..."
              className="w-full rounded-xl border border-[#E7DFD3] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D94E28]/30 focus:border-[#D94E28]"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 bg-stone-50 rounded-xl px-3.5 py-2.5 border border-stone-200/70">
            <span>Polymorphic packaging fee ({item.getItemType()}):</span>
            <span className="font-mono-code font-medium text-stone-700">
              {formatCurrency(item.getPackagingFee())}/unit
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-5 border-t border-[#E7DFD3] bg-[#FAF7F2]">
          <div className="inline-flex items-center rounded-xl border border-[#E7DFD3] bg-white">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-2.5 text-stone-700 hover:bg-stone-100 rounded-l-xl"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-mono-code font-semibold text-sm">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="p-2.5 text-stone-700 hover:bg-stone-100 rounded-r-xl"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onConfirmAdd(quantity, customization)}
            className="flex-1 py-3 px-5 rounded-xl bg-[#D94E28] hover:bg-[#B63B19] text-white font-semibold text-sm shadow-sm transition cursor-pointer"
          >
            Add to Cart • {formatCurrency(lineTotal)}
          </button>
        </div>
      </div>
    </div>
  );
};

