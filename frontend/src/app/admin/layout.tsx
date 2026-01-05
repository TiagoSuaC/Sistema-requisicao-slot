"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getMacroPeriods } from "@/lib/api";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState({
    aguardando: 0,
    urgentes: 0,
    revisar: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
    } else {
      loadNotifications();
      // Atualizar a cada 30 segundos
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [router]);

  const loadNotifications = async () => {
    try {
      const periods = await getMacroPeriods({});
      const aguardando = periods.filter((p: any) => p.status === "AGUARDANDO").length;
      const urgentes = periods.filter(
        (p: any) => p.status === "AGUARDANDO" && p.dias_em_aberto !== null && p.dias_em_aberto >= 3
      ).length;
      const revisar = periods.filter(
        (p: any) => p.status === "RESPONDIDO" || p.status === "EDICAO_LIBERADA"
      ).length;

      setNotifications({ aguardando, urgentes, revisar });
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold">
                Sistema de Gestão
              </h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => router.push("/admin/dashboard")}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === "/admin/dashboard"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => router.push("/admin/macro-periods")}
                  className={`px-3 py-2 rounded-md text-sm font-medium relative ${
                    pathname?.startsWith("/admin/macro-periods")
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  📋 Macro Períodos
                  {(notifications.urgentes > 0 || notifications.revisar > 0) && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center font-bold">
                        {notifications.urgentes + notifications.revisar}
                      </span>
                    </span>
                  )}
                </button>
                <button
                  onClick={() => router.push("/admin/units")}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === "/admin/units"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  🏥 Unidades
                </button>
                <button
                  onClick={() => router.push("/admin/doctors")}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === "/admin/doctors"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  👨‍⚕️ Médicos
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {notifications.urgentes > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-md border border-red-200">
                  <span className="text-red-700 text-sm font-semibold">🚨 {notifications.urgentes} Urgente{notifications.urgentes > 1 ? 's' : ''}</span>
                </div>
              )}
              {notifications.revisar > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-md border border-green-200">
                  <span className="text-green-700 text-sm font-semibold">📥 {notifications.revisar} p/ Revisar</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-gray-900 px-3 py-2"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
