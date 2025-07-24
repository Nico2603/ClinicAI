import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUserFavoriteTemplates, 
  addUserFavoriteTemplate, 
  removeUserFavoriteTemplate,
  type FavoriteTemplate 
} from '@/lib/services/storageService';
import { UserTemplate } from '@/types';

export const useFavoriteTemplates = () => {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoriteTemplates, setFavoriteTemplates] = useState<FavoriteTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar favoritos al montar o cambiar usuario
  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      try {
        const favorites = getUserFavoriteTemplates(user.id);
        setFavoriteTemplates(favorites);
        setFavoriteIds(favorites.map(fav => fav.id));
      } catch (error) {
        console.error('Error loading favorite templates:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setFavoriteTemplates([]);
      setFavoriteIds([]);
    }
  }, [user?.id]);

  // Agregar a favoritos
  const addToFavorites = useCallback(async (template: UserTemplate) => {
    if (!user?.id) return false;

    try {
      const updatedFavorites = addUserFavoriteTemplate(user.id, {
        name: template.name,
        content: template.content,
        specialty_id: template.id
      });
      
      setFavoriteTemplates(updatedFavorites);
      setFavoriteIds(updatedFavorites.map(fav => fav.id));
      
      console.log(`⭐ Plantilla "${template.name}" agregada a favoritos`);
      return true;
    } catch (error) {
      console.error('Error adding template to favorites:', error);
      return false;
    }
  }, [user?.id]);

  // Remover de favoritos
  const removeFromFavorites = useCallback(async (templateId: string) => {
    if (!user?.id) return false;

    try {
      // Buscar el favorito por specialty_id
      const favoriteToRemove = favoriteTemplates.find(fav => fav.specialty_id === templateId);
      if (!favoriteToRemove) return false;

      const updatedFavorites = removeUserFavoriteTemplate(user.id, favoriteToRemove.id);
      
      setFavoriteTemplates(updatedFavorites);
      setFavoriteIds(updatedFavorites.map(fav => fav.id));
      
      console.log(`⭐ Plantilla removida de favoritos`);
      return true;
    } catch (error) {
      console.error('Error removing template from favorites:', error);
      return false;
    }
  }, [user?.id, favoriteTemplates]);

  // Toggle favorito
  const toggleFavorite = useCallback(async (template: UserTemplate) => {
    const isFavorite = favoriteTemplates.some(fav => fav.specialty_id === template.id);
    
    if (isFavorite) {
      return await removeFromFavorites(template.id);
    } else {
      return await addToFavorites(template);
    }
  }, [favoriteTemplates, addToFavorites, removeFromFavorites]);

  // Verificar si una plantilla es favorita
  const isFavorite = useCallback((templateId: string) => {
    return favoriteTemplates.some(fav => fav.specialty_id === templateId);
  }, [favoriteTemplates]);

  // Obtener plantillas favoritas con información completa
  const getFavoriteTemplatesWithInfo = useCallback((allTemplates: UserTemplate[]): UserTemplate[] => {
    return allTemplates.filter(template => isFavorite(template.id));
  }, [isFavorite]);

  // Estadísticas
  const favoriteCount = favoriteTemplates.length;
  const favoriteTemplateIds = favoriteTemplates.map(fav => fav.specialty_id || '').filter(Boolean);

  return {
    favoriteTemplates,
    favoriteIds: favoriteTemplateIds,
    favoriteCount,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    getFavoriteTemplatesWithInfo
  };
}; 