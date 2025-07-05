"use client";

import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { useState } from "react";

export default function PerfilPage() {
  const { user } = useAuth();
  const [nombre, setNombre] = useState(user?.name || "");
  const [telefono, setTelefono] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [registro, setRegistro] = useState("");
  const [institucion, setInstitucion] = useState("");
  const [bio, setBio] = useState("");
  const [guardado, setGuardado] = useState(false);

  if (!user) return <div className="p-8 text-center">Cargando perfil...</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí guardarías los datos en la base de datos o backend
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-10 bg-white dark:bg-neutral-900 rounded-lg shadow-lg mt-8 mb-12">
      <h1 className="text-2xl font-bold mb-6 text-primary">Perfil de Usuario</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Image
            src={user.image || "/default-avatar.svg"}
            alt={user.name || "Usuario"}
            width={96}
            height={96}
            className="rounded-full border-2 border-primary shadow"
          />
          <div className="text-center">
            <div className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{user.name}</div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-200">Nombre completo</label>
            <input
              type="text"
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-200">Teléfono</label>
            <input
              type="tel"
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              placeholder="Ej: +57 300 1234567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-200">Especialidad</label>
            <input
              type="text"
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={especialidad}
              onChange={e => setEspecialidad(e.target.value)}
              placeholder="Ej: Psiquiatría, Psicología, Medicina General..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-200">N° Registro Profesional</label>
            <input
              type="text"
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={registro}
              onChange={e => setRegistro(e.target.value)}
              placeholder="Ej: 123456789"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-200">Institución</label>
            <input
              type="text"
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={institucion}
              onChange={e => setInstitucion(e.target.value)}
              placeholder="Ej: Clínica San Juan de Dios"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-200">Biografía</label>
            <textarea
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Cuéntanos sobre tu experiencia profesional, áreas de interés, etc."
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary px-6 py-2 rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Guardar cambios
          </button>
        </div>
        {guardado && <div className="text-green-600 text-center font-medium">¡Perfil actualizado!</div>}
      </form>
    </div>
  );
} 