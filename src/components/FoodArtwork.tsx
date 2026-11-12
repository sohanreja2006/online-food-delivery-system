import React, { useState } from 'react';
import { IllustrationKind } from '../models/MenuItem';

export const VegIndicator: React.FC<{ isVeg: boolean; size?: 'sm' | 'md' }> = ({
  isVeg,
  size = 'sm',
}) => {
  const outer = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const dot = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  return (
    <span
      title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
      aria-label={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
      className={`inline-flex items-center justify-center rounded-[4px] border-[1.5px] shrink-0 ${outer} ${
        isVeg ? 'border-emerald-700 bg-emerald-50/70' : 'border-red-700 bg-red-50/70'
      }`}
    >
      <span className={`rounded-full ${dot} ${isVeg ? 'bg-emerald-700' : 'bg-red-700'}`} />
    </span>
  );
};

// ─── Curated High-Definition Food Images (Unsplash CDN) ─────────────────────────
// Each kind has multiple distinct, suitable photos for variety

export const FOOD_IMAGE_POOLS: Record<IllustrationKind, string[]> = {
  biryani: [
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&w=400&q=80',
  ],
  curry: [
    'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80',
  ],
  pizza: [
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=400&q=80',
  ],
  pasta: [
    'https://images.unsplash.com/photo-1621996346565-e3d5d6281292?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1556760544-74068565f05c?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=400&q=80',
  ],
  burger: [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=400&q=80',
  ],
  fries: [
    'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=400&q=80',
  ],
  ramen: [
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1614563637806-1d0e645e0940?auto=format&fit=crop&w=400&q=80',
  ],
  dumpling: [
    'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80',
  ],
  dessert: [
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80',
  ],
  beverage: [
    'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
  ],
  coffee: [
    'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=400&q=80',
  ],
  combo: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
  ],
};

// ─── Specific High-Resolution Matches by Item ID or Name Keyword ──────────────

const SPECIFIC_FOOD_IMAGE_MAP: Record<string, string> = {
  'zf-biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80',
  'zf-paneer': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80',
  'zf-veg-biryani': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=400&q=80',
  'zf-lassi': 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=400&q=80',
  'zf-feast': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
  'fr-margherita': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&q=80',
  'fr-arrabbiata': 'https://images.unsplash.com/photo-1621996346565-e3d5d6281292?auto=format&fit=crop&w=400&q=80',
  'fr-tiramisu': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=400&q=80',
  'fr-spritz': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
  'fr-duo': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
  'sb-smash': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
  'sb-veggie': 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=400&q=80',
  'sb-fries': 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=400&q=80',
  'sb-shake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80',
  'sb-box': 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=400&q=80',
  'kj-ramen': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
  'kj-gyoza': 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=400&q=80',
  'kj-matcha': 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80',
  'kj-bento': 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=400&q=80',
  'cb-tres': 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&q=80',
  'cb-croissant': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
  'cb-chai': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
  'cb-tea-combo': 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=400&q=80',
};

// ─── Restaurant Photographic Banners ──────────────────────────────────────────

export const RESTAURANT_BANNER_MAP: Record<string, string> = {
  'rest-zaffran':
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  'rest-forno':
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  'rest-smash':
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
  'rest-koji':
    'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80',
  'rest-chai':
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
};

/** Deterministic pseudo-random integer from string for consistent image selection */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a suitable food image URL. If a specific match exists it is used;
 * otherwise, a photo is selected from the suitable category pool.
 */
export function getSuitableFoodImage(
  kind: IllustrationKind,
  itemName = '',
  itemId = '',
): string {
  if (itemId && SPECIFIC_FOOD_IMAGE_MAP[itemId]) {
    return SPECIFIC_FOOD_IMAGE_MAP[itemId];
  }

  const pool = FOOD_IMAGE_POOLS[kind] || FOOD_IMAGE_POOLS.combo;
  const seed = (itemName || itemId || kind) + kind;
  const idx = hashString(seed) % pool.length;
  return pool[idx];
}

/**
 * Returns an appetizing restaurant banner image URL.
 */
export function getRestaurantBannerUrl(
  restaurantId: string,
  cuisines: string[] = [],
  name = '',
): string {
  if (RESTAURANT_BANNER_MAP[restaurantId]) {
    return RESTAURANT_BANNER_MAP[restaurantId];
  }

  // Fallback to suitable banner based on cuisine
  const text = (cuisines.join(' ') + ' ' + name).toLowerCase();
  if (text.includes('biryani') || text.includes('indian')) {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('pizza') || text.includes('italian')) {
    return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('burger') || text.includes('fast')) {
    return 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('ramen') || text.includes('asian')) {
    return 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80';
  }
  return 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80';
}

// ─── Inline SVG Illustrations (Offline Fallback) ───────────────────────────────

const SvgIllustration: React.FC<{
  kind: IllustrationKind;
  accentColor?: string;
  className?: string;
}> = ({ kind, accentColor = '#D94E28', className = 'w-16 h-16' }) => {
  switch (kind) {
    case 'biryani':
      return (
        <svg viewBox="0 0 80 80" className={className} fill="none" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#FFF3E6" />
          <ellipse cx="40" cy="51" rx="24" ry="12" fill="#8C3B2B" />
          <path d="M16 47c0 9 10.7 15 24 15s24-6 24-15H16Z" fill="#B54930" />
          <ellipse cx="40" cy="44" rx="22" ry="9" fill="#FDE68A" />
          <path d="M24 43c4-5 10-7 16-7s12 2 16 7" fill="#F59E0B" opacity="0.45" />
          <circle cx="33" cy="42" r="2.2" fill="#D97706" />
          <circle cx="46" cy="41" r="2" fill="#15803D" />
          <circle cx="39" cy="45" r="2.2" fill="#DC2626" />
          <path
            d="M32 24c0-3 3-4 3-7M41 23c0-3 3-4 3-7M49 25c0-3 3-4 3-7"
            stroke="#D97706"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      );
    case 'curry':
      return (
        <svg viewBox="0 0 80 80" className={className} fill="none" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#FEF2EE" />
          <path d="M16 42c0 12 10.7 20 24 20s24-8 24-20H16Z" fill="#292524" />
          <ellipse cx="40" cy="42" rx="24" ry="8" fill="#E05A2B" />
          <rect x="29" y="38" width="8" height="6" rx="2" fill="#FFFBEB" />
          <rect x="42" y="40" width="8" height="6" rx="2" fill="#FFFBEB" />
          <path d="M31 35c5-2 13-2 18 0" stroke="#FEF3C7" strokeWidth="2" strokeLinecap="round" />
          <circle cx="40" cy="41" r="2" fill="#16A34A" />
        </svg>
      );
    case 'pizza':
      return (
        <svg viewBox="0 0 80 80" className={className} fill="none" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#FFF1F0" />
          <circle cx="40" cy="42" r="25" fill="#D97706" />
          <circle cx="40" cy="42" r="20" fill="#FDE047" />
          <circle cx="40" cy="42" r="18" fill="#EF4444" opacity="0.22" />
          <circle cx="33" cy="36" r="4" fill="#FFFBEB" />
          <circle cx="47" cy="39" r="3.8" fill="#FFFBEB" />
          <circle cx="38" cy="49" r="4" fill="#FFFBEB" />
          <ellipse cx="45" cy="49" rx="3" ry="1.8" transform="rotate(-25 45 49)" fill="#15803D" />
          <ellipse cx="34" cy="43" rx="3" ry="1.8" transform="rotate(20 34 43)" fill="#15803D" />
          <path d="M40 17v50M15 42h50" stroke="#B45309" strokeWidth="1.2" opacity="0.35" />
        </svg>
      );
    case 'pasta':
      return (
        <svg viewBox="0 0 80 80" className={className} fill="none" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#FFF7ED" />
          <ellipse cx="40" cy="49" rx="25" ry="11" fill="#E7E5E4" />
          <ellipse cx="40" cy="46" rx="22" ry="9" fill="#FAFAF9" />
          <path d="M25 45c4-7 26-7 30 0" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" />
          <path d="M28 42c6-6 18-6 24 0" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
          <circle cx="36" cy="40" r="3" fill="#DC2626" />
          <circle cx="45" cy="41" r="2.8" fill="#15803D" />
        </svg>
      );
    case 'burger':
      return (
        <svg viewBox="0 0 80 80" className={className} fill="none" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#FEF3C7" />
          <path d="M19 37c0-11 9.4-18 21-18s21 7 21 18H19Z" fill="#D97706" />
          <circle cx="31" cy="28" r="1.4" fill="#FEF3C7" />
          <circle cx="41" cy="25" r="1.4" fill="#FEF3C7" />
          <circle cx="49" cy="29" r="1.4" fill="#FEF3C7" />
          <path
            d="M18 40c4 2 7-2 11 0s7 2 11 0 7-2 11 0 7 2 11 0"
            stroke="#22C55E"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <rect x="18" y="43" width="44" height="6" rx="3" fill="#78350F" />
          <path d="M26 43l6 6 6-6 6 6 6-6" fill="#FACC15" />
          <rect x="20" y="51" width="40" height="8" rx="4" fill="#D97706" />
        </svg>
      );
    case 'fries':
      return (
        <svg viewBox="0 0 80 80" className={className} fill="none" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#FFFBEB" />
          <rect x="27" y="19" width="5" height="24" rx="2" transform="rotate(-8 27 19)" fill="#FBBF24" />
          <rect x="35" y="16" width="5" height="26" rx="2" fill="#F59E0B" />
          <rect x="43" y="17" width="5" height="25" rx="2" transform="rotate(6 43 17)" fill="#FCD34D" />
          <rect x="50" y="21" width="5" height="22" rx="2" transform="rotate(12 50 21)" fill="#F59E0B" />
          <path d="M23 36h34l-4 24H27l-4-24Z" fill="#DC2626" />
          <circle cx="40" cy="48" r="5" fill="#FEF2F2" opacity="0.9" />
        </svg>
      );
    case 'ramen':
      return (
        <svg viewBox="0 0 80 80" className={className} fill="none" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#ECFDF5" />
          <path d="M16 40c0 14 10.7 23 24 23s24-9 24-23H16Z" fill="#1C1917" />
          <ellipse cx="40" cy="40" rx="24" ry="8" fill="#F59E0B" />
          <path d="M24 41c5 3 11 3 16 0s11-3 16 0" stroke="#FEF08A" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="48" cy="38" r="5" fill="#FFFBEB" />
          <circle cx="48" cy="38" r="2.5" fill="#F97316" />
          <path d="M46 21l18-5M46 25l18-2" stroke="#78350F" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'dumpling':
      return (
        <svg viewBox="0 0 80 80" className={className} fill="none" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#F0FDF4" />
          <ellipse cx="40" cy="48" rx="24" ry="12" fill="#D6D3D1" />
          <path d="M22 46c0-8 7-13 13-13s13 5 13 13H22Z" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
          <path d="M34 50c0-8 7-13 13-13s13 5 13 13H34Z" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5" />
        </svg>
      );
    case 'dessert':
      return (
        <svg viewBox="0 0 80 80" className={className} fill="none" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#FDF2F8" />
          <path d="M22 42l18-16 18 16v17H22V42Z" fill="#FDE68A" />
          <path d="M22 42h36v6H22z" fill="#92400E" opacity="0.7" />
          <path d="M22 36c6 4 12-2 18 2s12-4 18 0v6H22v-6Z" fill="#FFFBEB" />
          <circle cx="40" cy="25" r="4" fill="#DC2626" />
        </svg>
      );
    case 'beverage':
      return (
        <svg viewBox="0 0 80 80" className={className} fill="none" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#FFF7ED" />
          <path d="M28 28h24l-3 33H31l-3-33Z" fill="#FB923C" opacity="0.88" />
          <path d="M28 28h24" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" />
          <path d="M44 15l-4 32" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
          <rect x="33" y="34" width="7" height="7" rx="1.5" fill="#FFFBEB" opacity="0.85" />
          <rect x="41" y="42" width="7" height="7" rx="1.5" fill="#FFFBEB" opacity="0.85" />
        </svg>
      );
    case 'coffee':
      return (
        <svg viewBox="0 0 80 80" className={className} fill="none" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#F5EBE0" />
          <path d="M26 32h26l-3 28H29l-3-28Z" fill="#78350F" />
          <ellipse cx="39" cy="32" rx="13" ry="4" fill="#D6D3D1" />
          <path d="M52 38h4a4 4 0 0 1 0 8h-5" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
          <path d="M34 22c0-3 3-3 3-6M42 22c0-3 3-3 3-6" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'combo':
    default:
      return (
        <svg viewBox="0 0 80 80" className={className} fill="none" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#FEF2EE" />
          <rect x="18" y="29" width="32" height="30" rx="6" fill={accentColor} opacity="0.9" />
          <rect x="22" y="35" width="24" height="18" rx="3" fill="#FFFBEB" />
          <circle cx="34" cy="44" r="6" fill="#F59E0B" />
          <path d="M50 24h13l-2 33h-9l-2-33Z" fill="#1F7A4C" />
          <path d="M56 15l1 15" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
  }
};

// ─── FoodArtwork (Hybrid: High-res Photo with Graceful SVG Fallback) ─────────────

interface ArtworkProps {
  kind: IllustrationKind;
  accentColor?: string;
  className?: string;
  itemName?: string;
  itemId?: string;
}

export const FoodArtwork: React.FC<ArtworkProps> = ({
  kind,
  accentColor = '#D94E28',
  className = 'w-16 h-16',
  itemName = '',
  itemId = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const imageUrl = getSuitableFoodImage(kind, itemName, itemId);

  if (imgError || !imageUrl) {
    return <SvgIllustration kind={kind} accentColor={accentColor} className={className} />;
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-[#FAF7F2] shrink-0 ${className}`}>
      <img
        src={imageUrl}
        alt={itemName || kind}
        loading="lazy"
        onError={() => setImgError(true)}
        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
      />
    </div>
  );
};
