"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { Calendar, User, Clock, ArrowLeft, Share2 } from "lucide-react";
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

export default function BlogPost({ params }: { params: any }) {
  const router = useRouter();
  const id = params?.id ? params.id : use(params).id;
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const { data, error } = await supabase
          .from("blogs")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        
        if (data) {
          setArticle({
            id: data.id,
            title: data.title,
            excerpt: data.excerpt,
            content: data.content,
            category: data.category,
            image: data.image || "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
            author: data.author,
            date: new Date(data.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            readTime: data.read_time,
            featured: data.featured
          });
        }
      } catch (err) {
        console.log("Supabase blogs fetch error, using local storage:", err);
        const local = localStorage.getItem("mehta_blogs");
        if (local) {
          try {
            const blogs: BlogArticle[] = JSON.parse(local);
            const found = blogs.find(b => b.id === id);
            if (found) {
              setArticle(found);
            }
          } catch (e) {
            console.error(e);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchArticle();
  }, [id]);

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-[70vh] flex items-center justify-center bg-[#faf9f6]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-orange"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!article) {
    return (
      <>
        <Header />
        <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#faf9f6]">
          <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-4">Article Not Found</h2>
          <button 
            onClick={() => router.push("/blogs")}
            className="px-6 py-2 bg-brand-orange text-white font-bold rounded-lg hover:bg-brand-orange-hover"
          >
            Back to Blogs
          </button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <WhatsAppFloat />

      <main className="pt-28 sm:pt-36 pb-16 bg-[#faf9f6] min-h-screen">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          <Link href="/blogs" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-brand-orange transition-colors mb-8 uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" /> Back to all articles
          </Link>

          <article className="bg-white rounded-3xl p-6 sm:p-10 lg:p-14 shadow-2xs border border-brand-beige">
            <div className="flex flex-col gap-4 text-center items-center mb-10">
              <span className="text-[0.65rem] font-bold text-brand-gold uppercase tracking-widest bg-brand-cream/30 px-4 py-1.5 rounded-full border border-brand-beige">
                {article.category}
              </span>
              
              <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-brand-charcoal leading-tight mt-2 mb-4">
                {article.title}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[0.75rem] text-muted-foreground uppercase tracking-wider font-semibold">
                <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-brand-orange" /> {article.author}</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-brand-orange" /> {article.date}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-brand-orange" /> {article.readTime}</span>
              </div>
            </div>

            <div className="w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden mb-12 shadow-sm border border-brand-beige">
              <img 
                src={article.image} 
                alt={article.title} 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="prose prose-sm sm:prose-base max-w-none text-[#4A2F1F] leading-loose">
              <p className="text-lg sm:text-xl font-serif text-[#7E6B5A] italic mb-8 border-l-4 border-brand-orange pl-4">
                {article.excerpt}
              </p>
              
              {/* Content rendering: split by newlines for basic paragraphs */}
              <div className="space-y-6">
                {article.content.split('\n').map((paragraph, idx) => (
                  paragraph.trim() && <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="border-t border-brand-beige mt-12 pt-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-cream rounded-full flex items-center justify-center text-brand-orange font-serif text-xl font-bold">
                  {article.author.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-charcoal uppercase">{article.author}</h4>
                  <span className="text-[0.65rem] text-muted-foreground font-semibold uppercase tracking-widest">Author</span>
                </div>
              </div>
              
              <button className="p-3 bg-[#FAF6EE] hover:bg-[#F0E6D2] text-[#4A2F1F] rounded-full transition-colors" title="Share Article">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </article>

        </div>
      </main>

      <Footer />
    </>
  );
}
