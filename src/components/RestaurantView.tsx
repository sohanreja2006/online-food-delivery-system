import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Heart,
  Leaf,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Store,
} from 'lucide-react';
import { FoodDeliverySystem } from '../models/FoodDeliverySystem';
import { ComboMeal, ItemCustomization, MenuItem } from '../models/MenuItem';
import { Restaurant } from '../models/Restaurant';
import { CustomizeModal } from './CustomizeModal';
import { FoodArtwork, getRestaurantBannerUrl, VegIndicator } from './FoodArtwork';
import { formatCurrency, ItemTypeBadge } from './uiBadges';

interface RestaurantViewProps {
  system: FoodDeliverySystem;
  selectedRestaurantId: string | null;
  onSelectRestaurant: (id: string | null) => void;
  onAddToCart: (restaurantId: string, itemId: string, quantity: number, customization?: ItemCustomization) => void;
  onToggleFavorite: (restaurantId: string) => void;
}

export const RestaurantView: React.FC<RestaurantViewProps> = ({
  system,
  selectedRestaurantId,
  onSelectRestaurant,
  onAddToCart,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [menuCategory, setMenuCategory] = useState('All');
  const [menuQuery, setMenuQuery] = useState('');
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  const cuisines = useMemo(() => ['All', ...system.getAllCuisines()], [system]);

  const filteredRestaurants = useMemo(
    () =>
      system.browseRestaurants({
        query: searchQuery,
        cuisine: selectedCuisine,
        vegOnly,
        openOnly,
        favoritesOnly,
      }),
    [system, searchQuery, selectedCuisine, vegOnly, openOnly, favoritesOnly],
  );

  const selectedRestaurant: Restaurant | null = useMemo(() => {
    if (!selectedRestaurantId) {
      return null;
    }
    try {
      return system.getRestaurant(selectedRestaurantId);
    } catch {
      return null;
    }
  }, [system, selectedRestaurantId]);

  if (selectedRestaurant) {
    const categories = ['All', ...Array.from(selectedRestaurant.menu.getCategories())];
    const filteredMenu = selectedRestaurant.menu.filterItems({
      query: menuQuery,
      category: menuCategory,
      vegOnly,
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              setMenuCategory('All');
              setMenuQuery('');
              onSelectRestaurant(null);
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700 hover:text-[#D94E28] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            All Restaurants
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(selectedRestaurant.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
              system.isFavoriteRestaurant(selectedRestaurant.id)
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-white text-stone-600 border-[#E7DFD3] hover:border-stone-400'
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                system.isFavoriteRestaurant(selectedRestaurant.id) ? 'fill-rose-600 text-rose-600' : ''
              }`}
            />
            {system.isFavoriteRestaurant(selectedRestaurant.id) ? 'Favorited' : 'Save Favorite'}
          </button>
        </div>

        {/* Restaurant Banner Hero with Real Photographic Banner */}
        <section className="relative rounded-3xl bg-white border border-[#E7DFD3] overflow-hidden shadow-xs">
          <div className="relative h-48 sm:h-64 w-full overflow-hidden">
            <img
              src={getRestaurantBannerUrl(
                selectedRestaurant.id,
                selectedRestaurant.cuisines,
                selectedRestaurant.name,
              )}
              alt={selectedRestaurant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-stone-950/10" />
            <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-4 text-white">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
                      selectedRestaurant.isOpen
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-red-500/90 text-white'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedRestaurant.isOpen ? 'bg-white animate-pulse' : 'bg-white'
                      }`}
                    />
                    {selectedRestaurant.isOpen ? 'Open for Delivery' : 'Currently Closed'}
                  </span>
                  {selectedRestaurant.cuisines.map((c) => (
                    <span
                      key={c}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/40 backdrop-blur-md text-white border border-white/20"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight drop-shadow-sm">
                  {selectedRestaurant.name}
                </h1>
                <p className="text-white/85 text-xs sm:text-sm max-w-xl line-clamp-1">
                  {selectedRestaurant.tagline}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-md border border-white/20 text-xs font-semibold text-white">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {selectedRestaurant.rating.toFixed(1)} ({selectedRestaurant.reviewCount}+ ratings)
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-md border border-white/20 text-xs font-semibold text-white">
                  <Clock className="w-4 h-4 text-white/80" />
                  ~{selectedRestaurant.getEstimatedPrepMinutes() + 12} mins
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-md border border-white/20 text-xs font-semibold text-white">
                  <MapPin className="w-4 h-4 text-white/80" />
                  {selectedRestaurant.distanceKm} km • {selectedRestaurant.address}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Menu Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setMenuCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  menuCategory === cat
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-700 border-[#E7DFD3] hover:border-stone-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={menuQuery}
                onChange={(e) => setMenuQuery(e.target.value)}
                placeholder="Search this menu..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E7DFD3] text-sm focus:outline-none focus:ring-2 focus:ring-[#D94E28]/30"
              />
            </div>

            <button
              type="button"
              onClick={() => setVegOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                vegOnly
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-white text-stone-700 border-[#E7DFD3]'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              Veg Only
            </button>
          </div>
        </div>

        {/* Menu Items Grid */}
        {filteredMenu.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#E7DFD3] p-10 text-center text-stone-500">
            No menu items match your active filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMenu.map((item) => {
              const effectivePrice = item.calculateUnitPrice();
              const isCombo = item instanceof ComboMeal;
              const isUnavailable = !item.isAvailable || !selectedRestaurant.isOpen;

              return (
                <article
                  key={item.id}
                  className={`rounded-2xl bg-white border border-[#E7DFD3] p-5 flex gap-4 justify-between transition hover:shadow-sm ${
                    !item.isAvailable ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <VegIndicator isVeg={item.isVegetarian} />
                      <ItemTypeBadge type={item.getItemType()} />
                      <span className="text-[11px] font-medium text-stone-500">
                        {item.getDetailsBadge()}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-stone-900 text-base leading-snug">{item.name}</h3>
                      <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="font-mono-code font-bold text-base text-stone-900">
                        {formatCurrency(effectivePrice)}
                      </span>
                      {isCombo && effectivePrice < item.basePrice && (
                        <span className="font-mono-code text-xs line-through text-stone-400">
                          {formatCurrency(item.basePrice)}
                        </span>
                      )}
                      <span className="text-[11px] text-stone-400">•</span>
                      <span className="text-[11px] text-stone-500">
                        {item.prepMinutes}m prep • +{formatCurrency(item.getPackagingFee())} pack
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-between gap-2.5 shrink-0">
                    <FoodArtwork
                      kind={item.illustration}
                      itemName={item.name}
                      itemId={item.id}
                      accentColor={selectedRestaurant.accentColor}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl shadow-xs border border-[#E7DFD3]"
                    />
                    <div className="flex flex-col gap-1.5 w-full">
                      <button
                        type="button"
                        onClick={() => onAddToCart(selectedRestaurant.id, item.id, 1)}
                        className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          isUnavailable
                            ? 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                            : 'bg-[#D94E28] hover:bg-[#B63B19] text-white shadow-xs'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {!selectedRestaurant.isOpen
                          ? 'Closed'
                          : !item.isAvailable
                            ? 'Sold Out'
                            : 'Quick Add'}
                      </button>
                      {!isUnavailable && (
                        <button
                          type="button"
                          onClick={() => setCustomizingItem(item)}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          Customize
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {customizingItem && (
          <CustomizeModal
            item={customizingItem}
            restaurantName={selectedRestaurant.name}
            accentColor={selectedRestaurant.accentColor}
            onClose={() => setCustomizingItem(null)}
            onConfirmAdd={(qty, customization) => {
              onAddToCart(selectedRestaurant.id, customizingItem.id, qty, customization);
              setCustomizingItem(null);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Editorial Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-[#FFF9F2] via-white to-[#FDF1E6] border border-[#E7DFD3] p-6 sm:p-9 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#D94E28]/10 text-[#B63B19]">
              <Store className="w-3.5 h-3.5" />
              Group 13 • Fresh Kitchens Near {system.customer.address.split(',')[0]}
            </span>
            <h1 className="font-display text-4xl sm:text-5xl text-stone-900 tracking-tight leading-[1.08]">
              Craving something memorable? Order from curated local kitchens.
            </h1>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
              Browse artisan restaurants, customize dishes, beverages, and combos, calculate live itemized
              bills, and track every step from kitchen prep to doorstep.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search biryani, ramen, sourdough, chai..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-[#E7DFD3] text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-[#D94E28]/30 focus:border-[#D94E28]"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 pt-5 border-t border-[#E7DFD3]/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {cuisines.map((cuisine) => (
              <button
                key={cuisine}
                type="button"
                onClick={() => setSelectedCuisine(cuisine)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                  selectedCuisine === cuisine
                    ? 'bg-stone-900 text-white'
                    : 'bg-white/80 text-stone-700 border border-[#E7DFD3] hover:border-stone-400'
                }`}
              >
                {cuisine}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setVegOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                vegOnly
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-white text-stone-700 border-[#E7DFD3]'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              Pure Veg Options
            </button>
            <button
              type="button"
              onClick={() => setOpenOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                openOnly
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-[#E7DFD3]'
              }`}
            >
              Open Now
            </button>
            <button
              type="button"
              onClick={() => setFavoritesOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                favoritesOnly
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-stone-700 border-[#E7DFD3]'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              Favorites
            </button>
          </div>
        </div>
      </section>

      {/* Restaurant Cards Grid */}
      {filteredRestaurants.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#E7DFD3] p-12 text-center space-y-2">
          <p className="text-base font-semibold text-stone-800">No restaurants match your filters</p>
          <p className="text-sm text-stone-500">Try clearing the search term or cuisine filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCuisine('All');
              setVegOnly(false);
              setOpenOnly(false);
              setFavoritesOnly(false);
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRestaurants.map((restaurant) => {
            const isFav = system.isFavoriteRestaurant(restaurant.id);
            const previewItems = restaurant.menu.getAllItems().slice(0, 3);
            return (
              <article
                key={restaurant.id}
                className="group rounded-3xl bg-white border border-[#E7DFD3] overflow-hidden shadow-xs hover:shadow-md hover:border-stone-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={getRestaurantBannerUrl(
                        restaurant.id,
                        restaurant.cuisines,
                        restaurant.name,
                      )}
                      alt={restaurant.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/25 to-stone-950/10" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {previewItems.map((item) => (
                          <FoodArtwork
                            key={item.id}
                            kind={item.illustration}
                            itemName={item.name}
                            itemId={item.id}
                            accentColor={restaurant.accentColor}
                            className="w-9 h-9 rounded-full border-2 border-white shadow-md"
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleFavorite(restaurant.id)}
                          aria-label={`Toggle favorite for ${restaurant.name}`}
                          className="p-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-white/40 shadow-xs hover:scale-110 transition cursor-pointer"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isFav ? 'fill-rose-600 text-rose-600' : 'text-stone-700'
                            }`}
                          />
                        </button>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md ${
                            restaurant.isOpen
                              ? 'bg-emerald-600/90 text-white'
                              : 'bg-red-600/90 text-white'
                          }`}
                        >
                          {restaurant.isOpen ? 'OPEN' : 'CLOSED'}
                        </span>
                      </div>
                    </div>

                    <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-xs drop-shadow-sm">
                      <span className="font-semibold">{restaurant.distanceKm} km away</span>
                      <span className="text-white/80 font-mono-code">
                        ~{restaurant.getEstimatedPrepMinutes() + 12} mins
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-bold text-stone-900 leading-snug">
                          {restaurant.name}
                        </h2>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {restaurant.cuisines.join(' • ')}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-700 text-white text-xs font-bold shrink-0">
                        <Star className="w-3 h-3 fill-white" />
                        {restaurant.rating.toFixed(1)}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {restaurant.tagline}
                    </p>

                    <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                      <span>{restaurant.distanceKm} km away</span>
                      <span>~{restaurant.getEstimatedPrepMinutes() + 12} min</span>
                      <span>{formatCurrency(restaurant.costForTwo)} for two</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2 border-t border-[#F3EDE3] flex items-center justify-between">
                  <span className="text-xs text-stone-500">{restaurant.menu.size} menu items</span>
                  <button
                    type="button"
                    onClick={() => onSelectRestaurant(restaurant.id)}
                    className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-[#D94E28] text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Browse Menu →
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

