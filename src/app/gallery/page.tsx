"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { X, ChevronLeft, ChevronRight, Camera, Maximize2 } from "lucide-react";
import { BUSINESS } from "@/lib/businessConfig";

const GALLERY_CATEGORIES = ["All", "Store Front", "Sweet Counter", "Sweet Making Process", "Dairy Production", "Gift Packaging"];

const MOCK_IMAGES = [
  { id: 1, src: "/store_entry_image.jpeg", alt: "Store Front", category: "Store Front", span: "row-span-2" },
  { id: 2, src: "/store_inside_counter.jpeg", alt: "Store Counter", category: "Store Counter", span: "row-span-1" },
  { id: 3, src: "/sweets3.jpg", alt: "Sweet Storage", category: "Sweet Storage", span: "row-span-2" },
  { id: 4, src: "/store_products_storage.jpeg", alt: "Gift Packaging", category: "Gift Packaging", span: "row-span-1" },
  { id: 5, src: "/store_outside.jpeg", alt: "Sweet Counter", category: "Sweet Counter", span: "row-span-1" },
  { id: 6, src: "/sweets_6.jpg", alt: "Dairy Production", category: "Dairy Production", span: "row-span-2" },
  { id: 7, src: "/sweets_7.jpg", alt: "Gift Packaging", category: "Gift Packaging", span: "row-span-1" },
  { id: 8, src: "/sweets_8.jpg", alt: "Store Front", category: "Store Front", span: "row-span-1" },
];

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightboxImage, setLightboxImage] = useState<number | null>(null);

  const filteredImages = activeCategory === "All"
    ? MOCK_IMAGES
    : MOCK_IMAGES.filter(img => img.category === activeCategory);

  const openLightbox = (index: number) => {
    setLightboxImage(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    document.body.style.overflow = 'auto';
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxImage !== null) {
      setLightboxImage((lightboxImage + 1) % filteredImages.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxImage !== null) {
      setLightboxImage((lightboxImage - 1 + filteredImages.length) % filteredImages.length);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <Header />

      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-16 h-16 bg-brand-cream border border-[#EAE0D3] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Camera className="w-7 h-7 text-brand-orange" />
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-brand-charcoal mb-4">Our Heritage in Pictures</h1>
              <p className="text-muted-foreground text-sm max-w-2xl mx-auto leading-relaxed">
                Take a visual journey through {BUSINESS.shortName}. From our bustling store front in {BUSINESS.address.city} to the meticulous sweet making process, experience the purity and tradition we've upheld since {BUSINESS.foundedYear}.
              </p>
            </motion.div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-10">
            {GALLERY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${activeCategory === cat
                  ? "bg-brand-charcoal text-white shadow-md"
                  : "bg-white text-brand-charcoal border border-[#EAE0D3] hover:border-brand-orange hover:text-brand-orange"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Masonry Grid (CSS Columns approach for simple masonry) */}
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            <AnimatePresence>
              {filteredImages.map((img, idx) => (
                <motion.div
                  key={img.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="break-inside-avoid relative group overflow-hidden rounded-2xl cursor-pointer shadow-sm border border-[#EAE0D3]/50 bg-white"
                  onClick={() => openLightbox(idx)}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                    <span className="text-brand-orange text-[0.65rem] font-bold uppercase tracking-wider mb-1">{img.category}</span>
                    <h3 className="text-white font-serif font-bold">{img.alt}</h3>
                    <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-[#EAE0D3] mt-8">
              <Camera className="w-10 h-10 text-brand-beige mx-auto mb-3" />
              <p className="text-sm text-brand-charcoal font-bold">No images found for this category.</p>
              <button onClick={() => setActiveCategory("All")} className="mt-4 text-xs font-bold text-brand-orange hover:underline">Clear Filter</button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {lightboxImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors text-white hidden sm:flex"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="relative w-full max-w-5xl max-h-[85vh] px-4 flex items-center justify-center" onClick={e => e.stopPropagation()}>
              <motion.img
                key={lightboxImage}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                src={filteredImages[lightboxImage].src}
                alt={filteredImages[lightboxImage].alt}
                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
              />
              <div className="absolute bottom-[-40px] left-0 w-full text-center">
                <p className="text-white font-bold">{filteredImages[lightboxImage].alt}</p>
                <p className="text-white/60 text-xs">{lightboxImage + 1} of {filteredImages.length}</p>
              </div>
            </div>

            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors text-white hidden sm:flex"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
