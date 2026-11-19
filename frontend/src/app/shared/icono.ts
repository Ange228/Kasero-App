import { Component, computed, input } from '@angular/core';
import {
  LucideApple, LucideArrowRight, LucideBadgeCheck, LucideBanana, LucideBeef, LucideCalculator, LucideCandy,
  LucideCarrot, LucideCheck, LucideChevronDown, LucideCherry, LucideCircleCheck, LucideClock, LucideCitrus,
  LucideCookie, LucideDrumstick, LucideDynamicIcon, LucideFish, LucideHandHelping, LucideHeart, LucideInfo,
  LucideLayers, LucideLeaf, LucideLogIn, LucideLogOut, LucideMapPin, LucideMegaphone, LucideMenu,
  LucideMessageCircle, LucideMinus, LucidePackage, LucidePlus, LucideReceipt, LucideScale, LucideSearch,
  LucideShieldCheck, LucideShoppingBasket, LucideSmartphone, LucideSoup, LucideSprout, LucideStar,
  LucideStore, LucideTag, LucideTrash2, LucideTrendingDown, LucideTrendingUp, LucideTruck, LucideUser,
  LucideUserCheck, LucideUserPlus, LucideUsers, LucideWallet, LucideWheat, LucideX, LucideCalendarDays, LucideSun
} from '@lucide/angular';

/** Iconos disponibles en la app (Lucide). Se agregan aquí para que Angular solo empaquete los usados. */
const REGISTRO: Record<string, unknown> = {
  'apple': LucideApple, 'arrow-right': LucideArrowRight, 'badge-check': LucideBadgeCheck, 'banana': LucideBanana,
  'beef': LucideBeef, 'calculator': LucideCalculator, 'candy': LucideCandy, 'carrot': LucideCarrot,
  'check': LucideCheck, 'chevron-down': LucideChevronDown, 'cherry': LucideCherry, 'circle-check': LucideCircleCheck,
  'clock': LucideClock, 'citrus': LucideCitrus, 'cookie': LucideCookie, 'drumstick': LucideDrumstick,
  'fish': LucideFish, 'hand-helping': LucideHandHelping, 'heart': LucideHeart, 'info': LucideInfo,
  'layers': LucideLayers, 'leaf': LucideLeaf, 'log-in': LucideLogIn, 'log-out': LucideLogOut,
  'map-pin': LucideMapPin, 'megaphone': LucideMegaphone, 'menu': LucideMenu, 'message-circle': LucideMessageCircle,
  'minus': LucideMinus, 'package': LucidePackage, 'plus': LucidePlus, 'receipt': LucideReceipt,
  'scale': LucideScale, 'search': LucideSearch, 'shield-check': LucideShieldCheck,
  'shopping-basket': LucideShoppingBasket, 'smartphone': LucideSmartphone, 'soup': LucideSoup,
  'sprout': LucideSprout, 'star': LucideStar, 'store': LucideStore, 'tag': LucideTag, 'trash-2': LucideTrash2,
  'trending-down': LucideTrendingDown, 'trending-up': LucideTrendingUp, 'truck': LucideTruck, 'user': LucideUser,
  'user-check': LucideUserCheck, 'user-plus': LucideUserPlus, 'users': LucideUsers, 'wallet': LucideWallet,
  'wheat': LucideWheat, 'x': LucideX, 'calendar-days': LucideCalendarDays, 'sun': LucideSun
};

@Component({
  selector: 'app-icono',
  imports: [LucideDynamicIcon],
  template: `<svg [lucideIcon]="def()" [size]="tam()" [strokeWidth]="trazo()" aria-hidden="true"></svg>`,
  host: { style: 'display:inline-flex;flex:none;line-height:0' }
})
export class Icono {
  readonly nombre = input.required<string>();
  readonly tam = input(20);
  readonly trazo = input(1.75);
  protected readonly def = computed(() => (REGISTRO[this.nombre()] ?? LucideShoppingBasket) as never);
}
