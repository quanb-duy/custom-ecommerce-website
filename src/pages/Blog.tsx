
import React from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Blog = () => {
  const featuredPost = {
    title: "Creating a Minimalist Living Space: Tips from Interior Designers",
    excerpt: "Discover how to embrace minimalism in your home with practical advice from top interior designers. Learn about decluttering strategies, selecting statement pieces, and creating a serene environment.",
    date: "June 10, 2024",
    author: "Emily Rodriguez",
    category: "Interior Design",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
    slug: "creating-minimalist-living-space"
  };
  
  const blogPosts = [
    {
      title: "The Psychology of Color in Home Decor",
      excerpt: "How different colors affect mood and perception in your living spaces, and how to use color psychology to create the perfect atmosphere.",
      date: "June 5, 2024",
      author: "Alex Johnson",
      category: "Home Decor",
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
      slug: "psychology-color-home-decor"
    },
    {
      title: "Sustainable Furniture: Eco-Friendly Options for Modern Homes",
      excerpt: "Explore environmentally conscious furniture choices that don't compromise on style or quality. From recycled materials to ethical production.",
      date: "May 28, 2024",
      author: "Sarah Green",
      category: "Sustainability",
      image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
      slug: "sustainable-furniture-eco-friendly-options"
    },
    {
      title: "Small Space Solutions: Maximizing Functionality in Apartments",
      excerpt: "Creative ideas and multi-functional furniture choices to make the most of limited square footage without sacrificing style or comfort.",
      date: "May 20, 2024",
      author: "David Chen",
      category: "Small Spaces",
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
      slug: "small-space-solutions"
    },
    {
      title: "Lighting 101: How to Create the Perfect Ambiance",
      excerpt: "A comprehensive guide to different lighting types and how to layer them effectively to transform the mood and functionality of any room.",
      date: "May 15, 2024",
      author: "Jessica Wong",
      category: "Lighting",
      image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
      slug: "lighting-101-perfect-ambiance"
    },
    {
      title: "Mixing Design Styles: Creating an Eclectic Home",
      excerpt: "Learn how to confidently blend different design aesthetics to create a personalized space that reflects your unique taste and experiences.",
      date: "May 8, 2024",
      author: "Omar Phillips",
      category: "Design Trends",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
      slug: "mixing-design-styles-eclectic-home"
    },
    {
      title: "Seasonal Home Updates: Summer Refresh Guide",
      excerpt: "Quick and affordable ways to transition your home decor for the summer season, from textile swaps to color accents.",
      date: "May 1, 2024",
      author: "Nicole Thompson",
      category: "Seasonal Decor",
      image: "https://images.unsplash.com/photo-1617104551722-6988fc29a741?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80",
      slug: "seasonal-home-updates-summer"
    },
  ];
  
  const categories = [
    "All Categories",
    "Interior Design",
    "Home Decor",
    "Sustainability",
    "Small Spaces",
    "Lighting",
    "Design Trends",
    "Seasonal Decor",
    "DIY Projects"
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <h1 className="text-4xl font-bold mb-4 text-center">Blog</h1>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
          Explore ideas, inspiration, and expert advice for creating a beautiful home
        </p>
        
        {/* Featured post */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="h-64 lg:h-auto">
              <img 
                src={featuredPost.image} 
                alt={featuredPost.title} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-8 flex flex-col justify-center">
              <div className="mb-2">
                <span className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">
                  {featuredPost.category}
                </span>
              </div>
              <h2 className="text-2xl font-semibold mb-3">{featuredPost.title}</h2>
              <p className="text-gray-600 mb-4">{featuredPost.excerpt}</p>
              <div className="text-sm text-gray-500 mb-6">
                {featuredPost.date} • By {featuredPost.author}
              </div>
              <Button className="w-fit gap-2">
                Read Article <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Categories */}
        <div className="mb-12 overflow-x-auto py-2">
          <div className="flex space-x-2 min-w-max">
            {categories.map((category, index) => (
              <Button 
                key={index}
                variant={index === 0 ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Blog posts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {blogPosts.map((post, index) => (
            <article key={index} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="aspect-video">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="mb-2">
                  <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>
                <h3 className="text-xl font-medium mb-2">{post.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="text-sm text-gray-500 mb-4">
                  {post.date} • By {post.author}
                </div>
                <Button variant="ghost" className="p-0 h-auto gap-2 text-sm font-medium hover:bg-transparent hover:underline">
                  Read More <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </article>
          ))}
        </div>
        
        {/* Newsletter */}
        <div className="bg-gray-50 rounded-xl p-8 text-center max-w-3xl mx-auto">
          <h3 className="text-xl font-semibold mb-2">Subscribe to our newsletter</h3>
          <p className="text-gray-600 mb-6">
            Get the latest articles, inspiration, and exclusive offers delivered to your inbox
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email"
              placeholder="Enter your email"
              className="px-4 py-2 rounded-md border border-gray-300 flex-grow focus:outline-none focus:ring-2 focus:ring-black/5"
              required
            />
            <Button type="submit">Subscribe</Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Blog;
