"use client";

import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { useState, useEffect } from "react";
import { userProfileService, UserProfile } from "@/lib/services/databaseService";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";

export default function PerfilPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const fetchProfile = async () => {
        setIsLoading(true);
        try {
          const userProfile = await userProfileService.getProfile(user.id);
          if (userProfile) {
            setProfile(userProfile);
          }
        } catch (error) {
          console.error("Error al cargar el perfil:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProfile();
    }
  }, [user?.id]);

  if (!user || isLoading) {
    return <div className="p-8 text-center">Cargando perfil...</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await userProfileService.updateProfile(user.id, profile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error al guardar el perfil:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen flex-1 w-full">
      <Header title="Perfil de Usuario" />
      <main className="flex-grow max-w-2xl mx-auto p-6 md:p-10 bg-white dark:bg-neutral-900 rounded-lg shadow-lg mt-8 mb-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Image
              src={profile.avatar_url || user.image || "/default-avatar.svg"}
              alt={profile.name || user.name || "Usuario"}
              width={96}
              height={96}
              className="rounded-full border-2 border-primary shadow"
            />
            <div className="text-center">
              <div className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{profile.name || user.name}</div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-200">Nombre completo</label>
              <input
                type="text"
                name="name"
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={profile.name || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-200">Teléfono</label>
              <input
                type="tel"
                name="phone_number"
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={profile.phone_number || ""}
                onChange={handleChange}
                placeholder="Ej: +57 300 1234567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-200">Especialidad</label>
              <input
                type="text"
                name="specialty"
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={profile.specialty || ""}
                onChange={handleChange}
                placeholder="Ej: Psiquiatría, Psicología, Medicina General..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-200">N° Registro Profesional</label>
              <input
                type="text"
                name="license_number"
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={profile.license_number || ""}
                onChange={handleChange}
                placeholder="Ej: 123456789"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-200">Institución</label>
              <input
                type="text"
                name="institution"
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={profile.institution || ""}
                onChange={handleChange}
                placeholder="Ej: Clínica San Juan de Dios"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-200">Biografía</label>
              <textarea
                name="bio"
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                value={profile.bio || ""}
                onChange={handleChange}
                placeholder="Cuéntanos sobre tu experiencia profesional, áreas de interés, etc."
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary px-6 py-2 rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
          {saveSuccess && <div className="text-green-600 text-center font-medium">¡Perfil actualizado con éxito!</div>}
        </form>
      </main>
      <Footer />
    </div>
  );
} 