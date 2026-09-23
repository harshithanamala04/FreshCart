import { Component, inject, signal, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

export interface CarouselSlide {
  id: number;
  imageUrl: string;
  alt: string;
}

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-banner.html',
  styleUrl: './hero-banner.scss',
})
export class HeroBannerComponent implements OnInit, OnDestroy {
  cartService = inject(CartService);
  authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  currentSlide = signal(0);
  isPaused = false;
  private autoSlideTimer: any = null;
  private touchStartX = 0;
  private touchEndX = 0;

  slides: CarouselSlide[] = [
    {
      id: 1,
      imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1000&q=80',
      alt: 'Fresh colorful seasonal fruits from Himachal and Maharashtra'
    },
    {
      id: 2,
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=80',
      alt: 'Hydroponic fresh leafy greens and crisp salad harvest'
    },
    {
      id: 3,
      imageUrl: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=1000&q=80',
      alt: 'Rustic farm wooden crate overflowing with crunchy organic root vegetables'
    },
    {
      id: 4,
      imageUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1000&q=80',
      alt: 'Sweet ripe red strawberries freshly gathered in wooden crates'
    },
    {
      id: 5,
      imageUrl: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?auto=format&fit=crop&w=1000&q=80',
      alt: 'Sun-ripened Indian citrus mandarins and lemons'
    }
  ];

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.startAutoSlide();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  startAutoSlide(): void {
    this.stopAutoSlide();
    this.autoSlideTimer = setInterval(() => {
      if (!this.isPaused) {
        this.nextSlide(false);
      }
    }, 4200);
  }

  stopAutoSlide(): void {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
      this.autoSlideTimer = null;
    }
  }

  nextSlide(userInitiated = true): void {
    this.currentSlide.update(idx => (idx + 1) % this.slides.length);
    if (userInitiated) {
      this.startAutoSlide();
    }
  }

  prevSlide(): void {
    this.currentSlide.update(idx => (idx - 1 + this.slides.length) % this.slides.length);
    this.startAutoSlide();
  }

  goToSlide(index: number): void {
    this.currentSlide.set(index);
    this.startAutoSlide();
  }

  pauseCarousel(): void {
    this.isPaused = true;
  }

  resumeCarousel(): void {
    this.isPaused = false;
  }

  onTouchStart(e: TouchEvent): void {
    this.touchStartX = e.changedTouches[0].clientX;
  }

  onTouchEnd(e: TouchEvent): void {
    this.touchEndX = e.changedTouches[0].clientX;
    const diff = this.touchStartX - this.touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    }
  }

  scrollToProduce(): void {
    if (!this.authService.isLoggedIn()) {
      this.authService.openAuthModal('register');
      return;
    }

    const el = document.getElementById('produce-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
