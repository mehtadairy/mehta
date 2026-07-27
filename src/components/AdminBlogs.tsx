"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Edit, Trash2, Check, X, PenTool, Loader2, Sparkles, UploadCloud, ImageIcon } from "lucide-react";
import { showToast } from "@/components/Toast";
import imageCompression from "browser-image-compression";

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

// Initial fallback blog articles matching the ones in the blog page
const INITIAL_BLOGS: BlogArticle[] = [
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

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState<BlogArticle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingSupabase, setIsUsingSupabase] = useState(true);

  // Form Fields
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"heritage" | "recipes" | "culture" | "gifting">("heritage");
  const [image, setImage] = useState("");
  const [author, setAuthor] = useState("");
  const [readTime, setReadTime] = useState("");
  const [featured, setFeatured] = useState(false);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      // Try to select from Supabase blogs table
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

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

      setBlogs(formatted);
      setIsUsingSupabase(true);
    } catch (err: any) {
      console.log("Supabase blogs fetch failed, falling back to local storage:", err.message);
      setIsUsingSupabase(false);
      
      // Load from localStorage or use initial blogs
      const local = localStorage.getItem("mehta_blogs");
      if (local) {
        try {
          setBlogs(JSON.parse(local));
        } catch (e) {
          setBlogs(INITIAL_BLOGS);
          localStorage.setItem("mehta_blogs", JSON.stringify(INITIAL_BLOGS));
        }
      } else {
        setBlogs(INITIAL_BLOGS);
        localStorage.setItem("mehta_blogs", JSON.stringify(INITIAL_BLOGS));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Invalid image type (JPG, PNG, WEBP)");
      return;
    }

    setUploadError("");
    setIsUploadingImage(true);

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: "image/webp" as any
      };
      const compressedFile = await imageCompression(file, options);

      if (isUsingSupabase) {
        const fileExt = "webp";
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `blogs/${fileName}`;

        const { error } = await supabase.storage
          .from('products')
          .upload(filePath, compressedFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/webp'
          });

        if (error) {
          throw error;
        }

        const { data: publicUrlData } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        setImage(publicUrlData.publicUrl);
        showToast("Image uploaded successfully!", "success");
      } else {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => {
          setImage(reader.result as string);
          showToast("Image converted to Base64!", "success");
        };
      }
    } catch (err: any) {
      console.error("Image upload failed:", err);
      setUploadError(err.message || "Upload failed");
      showToast("Upload failed", "error");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    
    const blogData: any = {
      title,
      excerpt,
      content,
      category,
      image: image || "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
      author: author || "Mehta Dairy",
      read_time: readTime || "5 min read",
      featured
    };

    if (isUsingSupabase) {
      try {
        if (editingId) {
          const { error } = await supabase
            .from("blogs")
            .update(blogData)
            .eq("id", editingId);
          if (error) throw error;
          showToast("Blog post updated successfully!", "success");
        } else {
          const { error } = await supabase
            .from("blogs")
            .insert([blogData]);
          if (error) throw error;
          showToast("Blog post created successfully!", "success");
        }
        await fetchBlogs();
        resetForm();
      } catch (err: any) {
        console.error("Supabase write failed:", err);
        showToast("Supabase error: " + err.message + ". Trying fallback...", "error");
        
        // Write to local storage fallback
        saveToLocalFallback(blogData, dateStr);
      }
    } else {
      saveToLocalFallback(blogData, dateStr);
    }
    setIsLoading(false);
  };

  const saveToLocalFallback = (blogData: any, dateStr: string) => {
    const local = localStorage.getItem("mehta_blogs");
    let currentBlogs: BlogArticle[] = local ? JSON.parse(local) : INITIAL_BLOGS;

    const mappedData: BlogArticle = {
      id: editingId || `blog-${Date.now()}`,
      title: blogData.title,
      excerpt: blogData.excerpt,
      content: blogData.content,
      category: blogData.category,
      image: blogData.image,
      author: blogData.author,
      date: editingId ? (currentBlogs.find(b => b.id === editingId)?.date || dateStr) : dateStr,
      readTime: blogData.read_time,
      featured: blogData.featured
    };

    if (editingId) {
      currentBlogs = currentBlogs.map(b => b.id === editingId ? mappedData : b);
      showToast("Fallback updated successfully!", "success");
    } else {
      currentBlogs = [mappedData, ...currentBlogs];
      showToast("Fallback created successfully!", "success");
    }

    localStorage.setItem("mehta_blogs", JSON.stringify(currentBlogs));
    setBlogs(currentBlogs);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    if (isUsingSupabase) {
      try {
        const { error } = await supabase.from("blogs").delete().eq("id", id);
        if (error) throw error;
        showToast("Blog post deleted successfully!", "success");
        await fetchBlogs();
      } catch (err: any) {
        console.error("Supabase delete failed, using fallback:", err);
        deleteFromLocalFallback(id);
      }
    } else {
      deleteFromLocalFallback(id);
    }
  };

  const deleteFromLocalFallback = (id: string) => {
    const local = localStorage.getItem("mehta_blogs");
    if (local) {
      const current = JSON.parse(local) as BlogArticle[];
      const updated = current.filter(b => b.id !== id);
      localStorage.setItem("mehta_blogs", JSON.stringify(updated));
      setBlogs(updated);
      showToast("Deleted from fallback list", "success");
    }
  };

  const resetForm = () => {
    setTitle("");
    setExcerpt("");
    setContent("");
    setCategory("heritage");
    setImage("");
    setAuthor("");
    setReadTime("");
    setFeatured(false);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (b: BlogArticle) => {
    setTitle(b.title);
    setExcerpt(b.excerpt);
    setContent(b.content);
    setCategory(b.category);
    setImage(b.image);
    setAuthor(b.author);
    setReadTime(b.readTime);
    setFeatured(!!b.featured);
    setEditingId(b.id);
    setShowForm(true);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center border-b border-brand-beige pb-3">
        <h3 className="font-serif text-lg font-bold text-brand-charcoal flex items-center gap-2">
          <PenTool className="w-5 h-5 text-brand-orange" />
          Blog Articles CMS
        </h3>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:underline"
          >
            <Plus className="h-4 w-4" /> Add Blog Article
          </button>
        )}
      </div>

      {!isUsingSupabase && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 text-[0.72rem] flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <Sparkles className="w-4 h-4 text-yellow-600" />
            Supabase blogs table not found (Running in Local Fallback mode)
          </div>
          <p>
            The blog system is currently storing and retrieving articles inside your browser's local storage.
            To connect it to your database, please execute the SQL statements in the <strong>blog_schema.sql</strong> file inside your Supabase dashboard SQL editor.
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-brand-cream/10 border border-brand-beige rounded-xl p-5 flex flex-col gap-4 animate-fade-in-up">
          <div className="flex justify-between items-center border-b border-brand-beige pb-2 mb-2">
            <h4 className="font-serif text-sm font-bold text-brand-charcoal">
              {editingId ? "Edit Blog Post" : "Add New Blog Post"}
            </h4>
            <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-brand-charcoal">
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Title *</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Traditional sweets of Diwali"
                className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                required
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Category</label>
              <select 
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white cursor-pointer font-semibold"
              >
                <option value="heritage">Heritage</option>
                <option value="recipes">Recipes</option>
                <option value="culture">Culture</option>
                <option value="gifting">Gifting</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Author Name</label>
              <input 
                type="text" 
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Karan Mehta (Head Chef)"
                className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Read Time (e.g. 5 min read)</label>
              <input 
                type="text" 
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                placeholder="e.g. 5 min read"
                className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase flex justify-between items-center">
                <span>Featured Banner Image</span>
                {uploadError && <span className="text-[0.6rem] text-red-500 normal-case">{uploadError}</span>}
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Image URL or upload..."
                  className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none flex-1"
                />
                <label className="cursor-pointer bg-white border border-brand-beige rounded-lg px-3 flex items-center justify-center hover:bg-brand-cream transition-colors group">
                  {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-brand-orange" /> : <UploadCloud className="w-4 h-4 text-muted-foreground group-hover:text-brand-orange transition-colors" />}
                  <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
                </label>
              </div>
              {image && (
                <div className="mt-1 relative h-20 w-full rounded overflow-hidden border border-brand-beige/50 bg-brand-cream/30">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Short Excerpt (Intro summary) *</label>
            <input 
              type="text" 
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Provide a concise 1-2 sentence description of the article..."
              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Full Article Content *</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the full content of your article here..."
              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none h-44"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="accent-brand-orange h-4 w-4"
              id="featuredBlog"
            />
            <label htmlFor="featuredBlog" className="text-xs font-semibold text-brand-charcoal cursor-pointer">
              Featured Article (Pin to top banner on blogs list)
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-2 rounded-lg bg-brand-orange hover:bg-brand-orange-hover py-2.5 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="animate-spin h-3.5 w-3.5" />}
            {editingId ? "Update Blog Post" : "Save Blog Post"}
          </button>
        </form>
      )}

      {!showForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {blogs.length === 0 && !isLoading && (
            <div className="col-span-full py-12 text-center text-xs text-muted-foreground border border-dashed border-brand-beige rounded-xl bg-brand-cream/10">
              No blog posts recorded. Click "Add Blog Article" to write your first story!
            </div>
          )}
          {blogs.map((b) => (
            <div key={b.id} className="group relative flex flex-col bg-white border border-brand-beige rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300">
              <div className="relative h-40 w-full bg-brand-cream overflow-hidden">
                <img src={b.image} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 flex gap-1">
                  <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-[0.6rem] font-bold text-brand-charcoal uppercase tracking-wider shadow-sm">
                    {b.category}
                  </span>
                  {b.featured && (
                    <span className="px-2 py-0.5 bg-amber-400 text-amber-900 rounded-full text-[0.6rem] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Featured
                    </span>
                  )}
                </div>
                <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-5px] group-hover:translate-y-0 duration-300">
                  <button 
                    onClick={() => handleEdit(b)}
                    className="h-7 w-7 rounded-full bg-white/90 text-brand-charcoal flex items-center justify-center hover:bg-white hover:text-brand-orange shadow-md transition-colors"
                    title="Edit article"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(b.id)}
                    className="h-7 w-7 rounded-full bg-white/90 text-red-500 flex items-center justify-center hover:bg-red-50 shadow-md transition-colors"
                    title="Delete article"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h4 className="font-bold text-brand-charcoal text-sm leading-tight line-clamp-2 mb-1.5 group-hover:text-brand-orange transition-colors">
                  {b.title}
                </h4>
                <p className="text-[0.65rem] text-muted-foreground line-clamp-2 mb-3 flex-1">
                  {b.excerpt}
                </p>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-brand-beige/50">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-full bg-brand-cream flex items-center justify-center text-[0.55rem] font-bold text-brand-gold uppercase">
                      {b.author.charAt(0)}
                    </div>
                    <span className="text-[0.6rem] font-semibold text-brand-charcoal truncate max-w-[80px]">{b.author}</span>
                  </div>
                  <span className="text-[0.6rem] text-muted-foreground font-medium">{b.date} • {b.readTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
