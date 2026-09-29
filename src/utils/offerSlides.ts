import type { OfferSlide } from '../types';

export function getVisibleOfferSlides(slides: OfferSlide[], now: number): OfferSlide[] {
  return slides.filter((slide) => slide.active &&
    (!slide.startDate || new Date(`${slide.startDate}T00:00:00`).getTime() <= now) &&
    (!slide.endDate || new Date(`${slide.endDate}T23:59:59`).getTime() >= now))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}
