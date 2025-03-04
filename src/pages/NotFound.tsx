
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Search } from "lucide-react";
import Layout from "@/components/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const popularPages = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: "About Us", path: "/about" },
    { name: "Contact", path: "/contact" },
    { name: "FAQ", path: "/faq" },
  ];

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full px-4 py-16 text-center">
          <h1 className="text-7xl font-bold mb-6">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Page not found</h2>
          <p className="text-gray-600 mb-8">
            We're sorry, the page you requested could not be found. It may have been moved, 
            renamed, or is temporarily unavailable.
          </p>
          
          <div className="space-y-4">
            <Button asChild variant="default" className="w-full gap-2">
              <Link to="/">
                <Home className="h-4 w-4" />
                Return to Home
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full gap-2">
              <Link to="..">
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Link>
            </Button>
          </div>
          
          <div className="mt-10">
            <h3 className="font-medium mb-4">Popular Pages</h3>
            <ul className="space-y-2">
              {popularPages.map((page) => (
                <li key={page.path}>
                  <Link 
                    to={page.path}
                    className="text-blue-600 hover:underline"
                  >
                    {page.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-gray-500 text-sm mb-2">
              Need help finding something?
            </p>
            <Button asChild variant="secondary" className="gap-2">
              <Link to="/products">
                <Search className="h-4 w-4" />
                Browse Products
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
