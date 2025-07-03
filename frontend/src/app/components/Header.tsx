"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { LucideBell, LucideUser, LucidePlus, LucideHome, LucideLogOut } from "lucide-react";

export default function Header() {
  const sessionData = useSession() || {};
  const { data, status } = sessionData;
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: <LucideHome size={18} /> },
    { href: "/adicionar-produto", label: "Adicionar", icon: <LucidePlus size={18} /> },
    { href: "/alertas", label: "Alertas", icon: <LucideBell size={18} /> },
    { href: "/perfil", label: "Perfil", icon: <LucideUser size={18} /> },
  ];

  return (
    <header className="w-full bg-white shadow-md py-2 px-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold text-blue-800">VigIA</span>
        <nav className="hidden md:flex gap-2 ml-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg font-semibold transition text-blue-700 hover:bg-blue-50 ${pathname === link.href ? "bg-blue-100" : ""}`}
            >
              {link.icon} {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden md:block text-sm text-blue-900 font-semibold">{data?.user?.email}</span>
        <button
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 font-semibold transition"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LucideLogOut size={18} /> Sair
        </button>
      </div>
    </header>
  );
} 