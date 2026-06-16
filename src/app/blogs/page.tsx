"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { motion, AnimatePresence, useScroll } from "framer-motion";
import { Calendar, User, Clock, ArrowRight, Search, Tag } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface BlogArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: "heritage" | "recipes" | "culture" | "gifting";
  image: string;
  author: string;
  date: string;
  readTime: string;
  featured?: boolean;
}

const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: "blog-1",
    title: "The Legacy of Kesar Peda: A Taste of 1952",
    excerpt: "Discover the rich historical origins of our signature saffron-infused milk pedas, prepared using traditional techniques unchanged for over 70 years.",
    content: "For over seven decades, the sweet aroma of simmering milk solids (khoya) and saffron has defined the corners of our store. It started in 1952 with Shri Hariprasad Mehta's dedication to purity. Today, our Kesar Peda remains Ahmedabad's gold standard—made only with fresh organic whole milk, zero artificial color, and real Kashmiri saffron threads. Each peda is hand-pressed to ensure the authentic grainy bite that local sweet lovers have cherished across generations.",
    category: "heritage",
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
    author: "Shri Hariprasad Mehta",
    date: "June 05, 2026",
    readTime: "4 min read",
    featured: true
  },
  {
    id: "blog-2",
    title: "Pure Ghee vs Oil: Why Traditional Sweet-Making is an Art",
    excerpt: "An deep dive into why pure organic cow ghee is critical for texture, luxury aroma, and shelf-life in premium traditional Gujarati sweets.",
    content: "Sweet making is not just blending ingredients—it is a chemical dance. The choice of fat defines everything from mouthfeel to shelf stability. In our kitchen, pure cow ghee is non-negotiable. Ghee has a high smoke point that allows us to cook chickpea flour (besan) for Mohanthal and Magas to a perfect caramelization without burning. More importantly, its rich short-chain fatty acids coat the palate, delivering the smooth release of flavor that oils simply cannot duplicate.",
    category: "recipes",
    image: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800&auto=format&fit=crop&q=80",
    author: "Karan Mehta (Head Chef)",
    date: "May 28, 2026",
    readTime: "6 min read"
  },
  {
    id: "blog-3",
    title: "Ahmedabad: India's Ultimate Capital of Sweets",
    excerpt: "Savoring the sweet food culture of Gujarat, from Sunday morning hot fafda-jalebi feasts to late-night milk bar runs.",
    content: "In Gujarat, sweets are not a courses-end luxury—they are daily fuel. From the first bite of a saffron-infused malai penda on special holidays, to the crisp crunch of sugar-coated sata pastries, sweet delights bind families together. Ahmedabad's old-quarter streets are packed with historic sweet shops, but Mehta Sweet Mart stands as the bridge of heritage and hygiene, offering both legacy recipes and vacuum-sealed packaging for global shipping.",
    category: "culture",
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800&auto=format&fit=crop&q=80",
    author: "Rohan Vyas (Food Historian)",
    date: "May 15, 2026",
    readTime: "5 min read"
  },
  {
    id: "blog-4",
    title: "Premium Gifting Guide: Designing the Perfect Festive Sweet Box",
    excerpt: "How to select, blend, and organize assortments of sweets, rich dry fruit squares, and savory namkeens for corporate gifting.",
    content: "A gift box represents your brand or family values. Choosing the right mix of elements is key. We recommend blending texture, sweetness, and savoriness. A perfect premium box starts with a core sweet (like Kaju Katri or Motichur Ladu), is complemented by a dry-fruit square (like Kaju Anjeer Roll), and balanced by premium farsan (like Dry Kachori or Farsi Puri). Add a custom gold ribbon, vacuum-seal it for freshness, and you have a box of joy that lasts.",
    category: "gifting",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80",
    author: "Anjali Mehta (Design Dir.)",
    date: "April 30, 2026",
    readTime: "3 min read"
  }
];

export default function BlogsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredArticles, setFilteredArticles] = useState<BlogArticle[]>([]);
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Reading progress scroll state
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data, error } = await supabase
          .from("blogs")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;

        const formatted = (data || []).map((b: any) => ({
          id: b.id,
          title: b.title,
          excerpt: b.excerpt,
          content: b.content,
          category: b.category,
          image: b.image || "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
          author: b.author,
          date: new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          readTime: b.read_time,
          featured: b.featured
        }));
        setArticles(formatted);
      } catch (err) {
        console.log("Supabase blogs fetch error, using local storage:", err);
        const local = localStorage.getItem("mehta_blogs");
        if (local) {
          try {
            setArticles(JSON.parse(local));
          } catch (e) {
            setArticles(BLOG_ARTICLES);
          }
        } else {
          setArticles(BLOG_ARTICLES);
          localStorage.setItem("mehta_blogs", JSON.stringify(BLOG_ARTICLES));
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticles();
  }, []);

  useEffect(() => {
    let result = articles;

    // Filter by Category
    if (activeCategory !== "all") {
      result = result.filter(art => art.category === activeCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        art => 
          art.title.toLowerCase().includes(q) || 
          art.excerpt.toLowerCase().includes(q) || 
          art.content.toLowerCase().includes(q)
      );
    }

    setFilteredArticles(result);
  }, [activeCategory, searchQuery, articles]);

  const featuredArticle = articles.find(art => art.featured);
  const regularArticles = filteredArticles.filter(art => !art.featured || activeCategory !== "all");

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, duration: 0.6 } }
  } as const;

  return (
    <>
      <Header />
      <WhatsAppFloat />

      {/* --- READING PROGRESS BAR --- */}
      <motion.div 
        style={{ scaleX: scrollYProgress }} 
        className="fixed top-0 left-0 right-0 h-1.5 bg-brand-orange z-50 origin-left" 
      />

      {/* --- PAGE HEADER --- */}
      <section className="relative text-white overflow-hidden bg-gradient-to-r from-[#800c0c] via-[#4d0707] to-[#240303] pt-28 sm:pt-36 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10 flex flex-col items-center">
          <h2 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-wide drop-shadow-sm uppercase">
            Mehta Sweet Stories
          </h2>
          <div className="h-0.5 w-16 bg-brand-gold my-4"></div>
          <p className="text-xs sm:text-sm text-brand-cream/80 max-w-2xl leading-relaxed text-center drop-shadow-xs">
            Delve into the rich culinary heritage of Gujarat, chef recipes, gifting guides, and stories behind our legendary sweets.
          </p>
        </div>
      </section>

      {/* --- CONTENT AREA --- */}
      <section className="py-12 bg-[#faf9f6]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Featured Article Section */}
          {featuredArticle && activeCategory === "all" && !searchQuery && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="mb-16 bg-white border border-brand-beige rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-shadow duration-300"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-7 aspect-[16/10] sm:aspect-video lg:aspect-auto relative overflow-hidden group">
                  <motion.img 
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.5 }}
                    src={featuredArticle.image} 
                    alt={featuredArticle.title} 
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-4 left-4 text-[0.62rem] font-bold text-white bg-brand-orange px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                    Featured Story
                  </span>
                </div>
                
                <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between gap-6 bg-[#fdfaf2]/20">
                  <div className="flex flex-col gap-3">
                    <span className="text-[0.62rem] font-bold text-brand-gold uppercase tracking-widest block">
                      {featuredArticle.category}
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-charcoal hover:text-brand-orange transition-colors">
                      <Link href={`#${featuredArticle.id}`}>{featuredArticle.title}</Link>
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {featuredArticle.excerpt}
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 text-[0.7rem] text-muted-foreground border-t border-brand-beige/50 pt-4">
                      <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {featuredArticle.author}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {featuredArticle.date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {featuredArticle.readTime}</span>
                    </div>

                    <a 
                      href={`#${featuredArticle.id}`}
                      className="inline-flex items-center text-xs font-bold text-brand-orange hover:text-brand-orange-hover gap-1 transition-colors uppercase tracking-wider"
                    >
                      Read full story <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Controls Bar: Search & Categories */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between border-y border-brand-beige py-6 mb-12">
            
            {/* Category Selectors */}
            <div className="flex flex-wrap gap-2.5 justify-center md:justify-start w-full md:w-auto">
              {["all", "heritage", "recipes", "culture", "gifting"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-4.5 py-1.8 text-[0.68rem] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeCategory === cat
                      ? "bg-brand-orange border border-brand-orange text-white shadow-2xs scale-102"
                      : "bg-white border border-[#e8dcc4] text-brand-charcoal hover:border-brand-orange hover:text-brand-orange"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative flex items-center border border-brand-beige rounded-full bg-white px-4 py-2.5 w-full md:max-w-xs focus-within:border-brand-orange shadow-3xs transition-all">
              <Search className="h-4.5 w-4.5 text-muted-foreground mr-2" />
              <input 
                type="text" 
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-transparent border-none outline-none text-brand-charcoal font-sans"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-[0.68rem] font-bold text-muted-foreground hover:text-brand-charcoal">Reset</button>
              )}
            </div>

          </div>

          {/* Staggered Grid of Articles */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {regularArticles.map((art) => (
                <motion.article 
                  key={art.id}
                  layout
                  variants={itemVariants}
                  id={art.id}
                  className="bg-white border border-brand-beige rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-brand-orange/15 transition-all duration-300 flex flex-col justify-between scroll-mt-28 group"
                >
                  <div>
                    {/* Card Image Cover */}
                    <div className="aspect-[16/10] overflow-hidden relative">
                      <motion.img 
                        whileHover={{ scale: 1.04 }}
                        transition={{ duration: 0.4 }}
                        src={art.image} 
                        alt={art.title} 
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 left-3 text-[0.58rem] font-bold text-brand-gold bg-[#fdfaf2] border border-[#e8dcc4] px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                        {art.category}
                      </span>
                    </div>

                    {/* Card Content body */}
                    <div className="p-5 flex flex-col gap-3">
                      <div className="flex items-center gap-3 text-[0.62rem] text-muted-foreground font-semibold uppercase">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {art.date}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {art.readTime}</span>
                      </div>

                      <h4 className="font-serif text-base font-bold text-brand-charcoal group-hover:text-brand-orange transition-colors leading-snug line-clamp-2">
                        {art.title}
                      </h4>

                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {art.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Expanded text reading section */}
                  <div className="px-5 pb-5">
                    <div className="border-t border-brand-beige/50 pt-4 flex flex-col gap-4">
                      <p className="text-[0.72rem] text-brand-charcoal bg-brand-cream/15 border border-brand-beige/30 p-3 rounded-lg leading-relaxed italic hidden group-hover:block animate-fade-in-up">
                        "{art.content}"
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-[0.62rem] text-muted-foreground font-bold flex items-center gap-1">
                          <User className="h-3 w-3" /> By {art.author.split(" ")[0]}
                        </span>
                        
                        <a 
                          href="https://wa.me/919876543210?text=Hi,%20I'm%20writing%20after%20reading%20your%20story%20online!" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[0.68rem] font-bold text-brand-orange hover:text-[#1abc9c] uppercase tracking-wider inline-flex items-center gap-1 transition-colors"
                        >
                          Enquire <ArrowRight className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>

        </div>
      </section>

      <Footer />
    </>
  );
}
