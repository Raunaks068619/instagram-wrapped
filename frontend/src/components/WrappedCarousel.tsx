import { useState, useRef, createRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import {
  CardIntro, CardImpact, CardTopPosts, CardNumbers,
  CardContentMix, CardTopMoment, CardVerdict,
  type WrappedCardData
} from './WrappedCards';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './WrappedCarousel.css';

const CARD_COMPONENTS = [CardIntro, CardImpact, CardTopPosts, CardNumbers, CardContentMix, CardTopMoment, CardVerdict];
const CARD_COUNT = CARD_COMPONENTS.length;

export default function WrappedCarousel({ cardData }: { cardData: WrappedCardData }) {
  const [downloading, setDownloading] = useState(false);
  const [cardDownloading, setCardDownloading] = useState<number | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);
  const cardRefs = useRef<React.RefObject<HTMLDivElement>[]>(
    Array.from({ length: CARD_COUNT }, () => createRef<HTMLDivElement>())
  );

  async function captureCard(el: HTMLDivElement, filename: string) {
    const canvas = await html2canvas(el, {
      backgroundColor: '#000',
      scale: 2,
      useCORS: true,
      logging: false,
    });
    canvas.toBlob((blob) => {
      if (blob) saveAs(blob, filename);
    }, 'image/png');
  }

  async function downloadCard(idx: number) {
    const el = cardRefs.current[idx]?.current;
    if (!el) return;
    setCardDownloading(idx);
    try {
      const names = ['intro', 'impact', 'top-posts', 'numbers', 'content-mix', 'top-moment', 'verdict'];
      await captureCard(el, `wrapped-${idx + 1}-${names[idx]}.png`);
    } catch {
      alert('Could not capture card.');
    } finally {
      setCardDownloading(null);
    }
  }

  async function downloadAll() {
    setDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('instagram-wrapped');
      const names = ['intro', 'impact', 'top-posts', 'numbers', 'content-mix', 'top-moment', 'verdict'];
      for (let i = 0; i < CARD_COUNT; i++) {
        const el = cardRefs.current[i]?.current;
        if (!el) continue;
        const canvas = await html2canvas(el, {
          backgroundColor: '#000',
          scale: 2,
          useCORS: true,
          logging: false,
        });
        const dataUrl = canvas.toDataURL('image/png');
        const b64 = dataUrl.split(',')[1];
        folder?.file(`slide-${i + 1}-${names[i]}.png`, b64, { base64: true });
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `IG-Wrapped-${cardData.year}.zip`);
    } catch {
      alert('Download failed.');
    } finally {
      setDownloading(false);
    }
  }

  async function shareCard(idx: number) {
    const el = cardRefs.current[idx]?.current;
    if (!el) return;
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: '#000',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], `wrapped-${idx + 1}.png`, { type: 'image/png' });
          const shareData = { files: [file], title: `My ${cardData.year} Instagram Wrapped` };
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
          }
        }
        saveAs(blob, `wrapped-${idx + 1}.png`);
      }, 'image/png');
    } catch { /* user cancelled share */ }
  }

  return (
    <div className="wc-root">
      {/* Progress segments */}
      <div className="wc-progress">
        {Array.from({ length: CARD_COUNT }, (_, idx) => (
          <div
            key={idx}
            className={`wc-seg${idx <= activeIdx ? ' wc-seg-done' : ''}${idx === activeIdx ? ' wc-seg-now' : ''}`}
            onClick={() => swiperRef.current?.slideTo(idx)}
          />
        ))}
      </div>

      {/* Carousel area */}
      <div className="wc-slider-area">
        <div className="wc-arrow wc-arrow-l" onClick={() => swiperRef.current?.slidePrev()}>‹</div>

        <div className="wc-swiper-wrap">
          <Swiper
            modules={[Navigation, Pagination]}
            slidesPerView={1.1}
            spaceBetween={10}
            centeredSlides={true}
            grabCursor={true}
            onSwiper={(s) => { swiperRef.current = s; }}
            onSlideChange={(s) => setActiveIdx(s.activeIndex)}
            breakpoints={{
              480: { slidesPerView: 1.3, spaceBetween: 14 },
              640: { slidesPerView: 1.8, spaceBetween: 18 },
              900: { slidesPerView: 2.5, spaceBetween: 22 },
              1100: { slidesPerView: 3, spaceBetween: 24 },
            }}
          >
            {CARD_COMPONENTS.map((CardComponent, idx) => (
              <SwiperSlide key={idx}>
                <div
                  ref={cardRefs.current[idx]}
                  className={`wc-card-wrapper${idx === activeIdx ? ' wc-card-on' : ''}`}
                >
                  <CardComponent data={cardData} />
                  {/* Footer overlay */}
                  <div className="wcard-footer-overlay">
                    <span
                      className="wcard-dl-icon"
                      onClick={(e) => { e.stopPropagation(); downloadCard(idx); }}
                    >
                      {cardDownloading === idx ? '⏳' : '↓'}
                    </span>
                    <span
                      className="wcard-share-btn-overlay"
                      onClick={(e) => { e.stopPropagation(); shareCard(idx); }}
                    >
                      ↗ Share
                    </span>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="wc-arrow wc-arrow-r" onClick={() => swiperRef.current?.slideNext()}>›</div>
      </div>

      {/* Counter */}
      <div className="wc-counter">{activeIdx + 1} / {CARD_COUNT}</div>

      {/* Download all */}
      <div className="wc-dl-row">
        <span className="wc-dl-all" onClick={downloadAll}>
          {downloading ? '⏳ Capturing all cards...' : '📥 Download All Cards'}
        </span>
      </div>

    </div>
  );
}
