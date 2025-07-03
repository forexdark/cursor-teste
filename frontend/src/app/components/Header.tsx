"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { LucideBell, LucideUser, LucidePlus, LucideHome, LucideLogOut, LucideMenu, LucideX } from "lucide-react";
import { FaShoppingCart } from "react-icons/fa";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { useState } from "react";

export default function Header() {
  const sessionData = useSession();
  const data = sessionData?.data || null;
  const status = sessionData?.status || "unauthenticated";
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { href: "/inicio", label: "Início", icon: <LucideHome size={18} /> },
    { href: "/adicionar-produto", label: "Adicionar", icon: <LucidePlus size={18} /> },
    { href: "/alertas", label: "Alertas", icon: <LucideBell size={18} /> },
    { href: "/perfil", label: "Perfil", icon: <LucideUser size={18} /> },
  ];

  // Don't show header on home page or login page
  if (pathname === "/" || pathname === "/login" || status === "unauthenticated") {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-lg border-b border-blue-100/60 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/inicio" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <FaShoppingCart className="text-white text-sm" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                VigIA
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    pathname === link.href
                      ? "bg-blue-100 text-blue-700 shadow-sm"
                      : "text-gray-600 hover:text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  {link.icon} 
                  <span className="hidden lg:block">{link.label}</span>
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-800">
                  {data?.user?.name || data?.user?.email?.split('@')[0]}
                </span>
                <span className="text-xs text-gray-500">{data?.user?.email}</span>
              </div>
              
              <div className="hidden md:block">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LucideLogOut size={16} />
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <LucideX size={20} /> : <LucideMenu size={20} />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-blue-100/60 bg-white/95 backdrop-blur-lg">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col gap-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      pathname === link.href
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-blue-700 hover:bg-blue-50"
                    }`}
                  >
                    {link.icon} {link.label}
                  </Link>
                ))}
                
                <div className="border-t border-gray-200 mt-4 pt-4">
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-800">
                        {data?.user?.name || data?.user?.email?.split('@')[0]}
                      </span>
                      <span className="text-xs text-gray-500">{data?.user?.email}</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 mt-2"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                  >
                    <LucideLogOut size={16} className="mr-2" />
                    Sair da conta
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}