import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { notFound } from 'next/navigation';

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data } = await supabase
    .from('cms_pages')
    .select('title')
    .eq('slug', params.slug)
    .single();

  return {
    title: data?.title ? `${data.title} | Mehta Sweet Mart` : 'Policy | Mehta Sweet Mart'
  };
}

export default async function PolicyPage({ params }: { params: { slug: string } }) {
  const { data: page, error } = await supabase
    .from('cms_pages')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single();

  if (error || !page) {
    notFound();
  }

  return (
    <>
      <Header />
      <div className="bg-brand-cream/30 min-h-screen py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-brand-beige">
            <h1 className="font-serif text-3xl sm:text-4xl font-black text-brand-charcoal mb-8 pb-4 border-b border-brand-beige">
              {page.title}
            </h1>
            <div 
              className="prose prose-sm sm:prose-base max-w-none prose-headings:font-serif prose-headings:text-brand-charcoal prose-a:text-brand-orange hover:prose-a:text-brand-orange-hover"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
