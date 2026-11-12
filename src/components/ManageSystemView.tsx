import React, { useEffect, useState } from 'react';
import { Check, PlusCircle, Power, Settings2, UserCheck } from 'lucide-react';
import { FoodDeliverySystem } from '../models/FoodDeliverySystem';
import { MenuItemType, SpiceLevel } from '../models/MenuItem';
import { FoodArtwork, VegIndicator } from './FoodArtwork';
import { formatCurrency, ItemTypeBadge } from './uiBadges';

interface ManageSystemViewProps {
  system: FoodDeliverySystem;
  onSystemMutated: (successMessage?: string) => void;
  onSyncAuthMetadata?: (details: {
    fullName: string;
    phone: string;
    address: string;
    landmark: string;
  }) => void;
  onRecordError: (error: unknown) => string;
}

export const ManageSystemView: React.FC<ManageSystemViewProps> = ({
  system,
  onSystemMutated,
  onSyncAuthMetadata,
  onRecordError,
}) => {
  const restaurants = system.getAllRestaurants();
  const [selectedRestId, setSelectedRestId] = useState(restaurants[0]?.id ?? '');

  // Customer profile state
  const [custName, setCustName] = useState(system.customer.name);
  const [custPhone, setCustPhone] = useState(system.customer.phone);
  const [custEmail, setCustEmail] = useState(system.customer.email);
  const [custAddress, setCustAddress] = useState(system.customer.address);
  const [custLandmark, setCustLandmark] = useState(system.customer.landmark);

  useEffect(() => {
    setCustName(system.customer.name);
    setCustPhone(system.customer.phone);
    setCustEmail(system.customer.email);
    setCustAddress(system.customer.address);
    setCustLandmark(system.customer.landmark);
  }, [
    system.customer.name,
    system.customer.phone,
    system.customer.email,
    system.customer.address,
    system.customer.landmark,
  ]);

  // Add menu item form
  const [itemType, setItemType] = useState<MenuItemType>('Dish');
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('229');
  const [itemCategory, setItemCategory] = useState('Chef Specials');
  const [itemPrep, setItemPrep] = useState('15');
  const [itemVeg, setItemVeg] = useState(true);
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel>('Medium');
  const [volumeMl, setVolumeMl] = useState('320');
  const [comboIncludes, setComboIncludes] = useState('Signature Main, Crispy Side, Cooler');

  const activeRestaurant = restaurants.find((r) => r.id === selectedRestId) ?? restaurants[0];

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      system.customer.updateDetails({
        name: custName,
        phone: custPhone,
        email: custEmail,
        address: custAddress,
        landmark: custLandmark,
      });
      onSyncAuthMetadata?.({
        fullName: custName,
        phone: custPhone,
        address: custAddress,
        landmark: custLandmark,
      });
      onSystemMutated('Customer details updated via encapsulated Customer setters.');
    } catch (err) {
      onRecordError(err);
    }
  };

  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRestaurant) {
      return;
    }
    try {
      system.addNewMenuItem({
        restaurantId: activeRestaurant.id,
        itemType,
        name: itemName,
        description: itemDesc,
        basePrice: Number(itemPrice),
        category: itemCategory,
        isVegetarian: itemVeg,
        prepMinutes: Number(itemPrep),
        spiceLevel,
        volumeMl: Number(volumeMl),
        includedItems: comboIncludes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        discountPercent: 15,
      });
      setItemName('');
      setItemDesc('');
      onSystemMutated(`Added new ${itemType} "${itemName}" to ${activeRestaurant.name}'s Menu.`);
    } catch (err) {
      onRecordError(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Details Manager */}
        <section className="lg:col-span-5 rounded-3xl bg-white border border-[#E7DFD3] p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#D94E28]" />
              <div>
                <h2 className="text-lg font-bold text-stone-900">Customer Profile Manager</h2>
                <p className="text-xs text-stone-500">
                  Encapsulated <span className="font-mono-code">Customer</span> entity •{' '}
                  {system.customer.loyaltyPoints} pts
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveCustomer} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Full Name</label>
              <input
                type="text"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                className="w-full rounded-xl border border-[#E7DFD3] px-3.5 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Phone</label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full rounded-xl border border-[#E7DFD3] px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Email</label>
                <input
                  type="text"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#E7DFD3] px-3.5 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Default Delivery Address
              </label>
              <input
                type="text"
                value={custAddress}
                onChange={(e) => setCustAddress(e.target.value)}
                className="w-full rounded-xl border border-[#E7DFD3] px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Landmark</label>
              <input
                type="text"
                value={custLandmark}
                onChange={(e) => setCustLandmark(e.target.value)}
                className="w-full rounded-xl border border-[#E7DFD3] px-3.5 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-[#D94E28] text-white text-sm font-semibold transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Save Customer Details
            </button>
          </form>
        </section>

        {/* Add New MenuItem Subclass */}
        <section className="lg:col-span-7 rounded-3xl bg-white border border-[#E7DFD3] p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#D94E28]" />
              <div>
                <h2 className="text-lg font-bold text-stone-900">Add Menu Item to Restaurant</h2>
                <p className="text-xs text-stone-500">
                  Instantiate <span className="font-mono-code">DishItem</span>,{' '}
                  <span className="font-mono-code">BeverageItem</span>, or{' '}
                  <span className="font-mono-code">ComboMeal</span> dynamically
                </p>
              </div>
            </div>

            <select
              value={selectedRestId}
              onChange={(e) => setSelectedRestId(e.target.value)}
              className="rounded-xl border border-[#E7DFD3] bg-[#FAF7F2] px-3 py-2 text-xs font-semibold text-stone-800"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleAddMenuItem} className="space-y-3.5">
            <div className="grid grid-cols-3 gap-2">
              {(['Dish', 'Beverage', 'Combo'] as MenuItemType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setItemType(type)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    itemType === type
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-700 border-[#E7DFD3]'
                  }`}
                >
                  {type} Subclass
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Item Name</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g., Kashmiri Rogan Josh"
                  className="w-full rounded-xl border border-[#E7DFD3] px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Category</label>
                <input
                  type="text"
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="w-full rounded-xl border border-[#E7DFD3] px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Description</label>
              <input
                type="text"
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
                placeholder="Describe ingredients and flavor profile..."
                className="w-full rounded-xl border border-[#E7DFD3] px-3.5 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  className="w-full rounded-xl border border-[#E7DFD3] px-3 py-2 text-sm font-mono-code"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Prep (min)</label>
                <input
                  type="number"
                  value={itemPrep}
                  onChange={(e) => setItemPrep(e.target.value)}
                  className="w-full rounded-xl border border-[#E7DFD3] px-3 py-2 text-sm font-mono-code"
                />
              </div>

              {itemType === 'Dish' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Spice</label>
                  <select
                    value={spiceLevel}
                    onChange={(e) => setSpiceLevel(e.target.value as SpiceLevel)}
                    className="w-full rounded-xl border border-[#E7DFD3] px-3 py-2 text-sm bg-white"
                  >
                    <option value="Mild">Mild</option>
                    <option value="Medium">Medium</option>
                    <option value="Hot">Hot</option>
                  </select>
                </div>
              )}

              {itemType === 'Beverage' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Volume (ml)</label>
                  <input
                    type="number"
                    value={volumeMl}
                    onChange={(e) => setVolumeMl(e.target.value)}
                    className="w-full rounded-xl border border-[#E7DFD3] px-3 py-2 text-sm font-mono-code"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 pt-5 cursor-pointer text-xs font-semibold text-stone-700">
                <input
                  type="checkbox"
                  checked={itemVeg}
                  onChange={(e) => setItemVeg(e.target.checked)}
                  className="w-4 h-4 accent-emerald-700"
                />
                Vegetarian
              </label>
            </div>

            {itemType === 'Combo' && (
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Included Items (comma-separated)
                </label>
                <input
                  type="text"
                  value={comboIncludes}
                  onChange={(e) => setComboIncludes(e.target.value)}
                  className="w-full rounded-xl border border-[#E7DFD3] px-3.5 py-2 text-sm"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#D94E28] hover:bg-[#B63B19] text-white text-sm font-semibold transition cursor-pointer"
            >
              Add {itemType} to {activeRestaurant?.name}
            </button>
          </form>
        </section>
      </div>

      {/* Live Restaurant & Menu Controls */}
      {activeRestaurant && (
        <section className="rounded-3xl bg-white border border-[#E7DFD3] p-6 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7DFD3] pb-4">
            <div className="flex items-center gap-2.5">
              <Settings2 className="w-5 h-5 text-[#D94E28]" />
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Manage {activeRestaurant.name} — Open Status, Prices &amp; Availability
                </h2>
                <p className="text-xs text-stone-500">
                  Toggle a restaurant closed or an item sold out to test{' '}
                  <span className="font-mono-code">RestaurantClosedException</span> and{' '}
                  <span className="font-mono-code">ItemUnavailableException</span> while ordering.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextOpen = system.toggleRestaurantOpen(activeRestaurant.id);
                onSystemMutated(
                  `${activeRestaurant.name} is now ${nextOpen ? 'OPEN' : 'CLOSED'} for orders.`,
                );
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                activeRestaurant.isOpen
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              Kitchen: {activeRestaurant.isOpen ? 'OPEN (Click to Close)' : 'CLOSED (Click to Open)'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activeRestaurant.menu.getAllItems().map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[#E7DFD3] bg-[#FAF7F2]/60 p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FoodArtwork
                    kind={item.illustration}
                    itemName={item.name}
                    itemId={item.id}
                    className="w-12 h-12 rounded-xl shadow-2xs border border-[#E7DFD3] shrink-0"
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <VegIndicator isVeg={item.isVegetarian} />
                      <span className="font-semibold text-sm text-stone-900 truncate">{item.name}</span>
                      <ItemTypeBadge type={item.getItemType()} />
                    </div>
                    <div className="text-xs text-stone-500">
                      Base: <span className="font-mono-code font-bold">{formatCurrency(item.basePrice)}</span> •
                      Effective:{' '}
                      <span className="font-mono-code font-bold text-stone-900">
                        {formatCurrency(item.calculateUnitPrice())}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        system.updateMenuItemPrice(activeRestaurant.id, item.id, item.basePrice + 20);
                        onSystemMutated(`Increased ${item.name} base price by ₹20.`);
                      } catch (err) {
                        onRecordError(err);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E7DFD3] text-[11px] font-semibold text-stone-700 hover:border-stone-400 cursor-pointer"
                  >
                    +₹20
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const available = system.toggleMenuItemAvailability(activeRestaurant.id, item.id);
                      onSystemMutated(
                        `${item.name} marked as ${available ? 'Available' : 'Sold Out'}.`,
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                      item.isAvailable
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {item.isAvailable ? 'Available' : 'Sold Out'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

