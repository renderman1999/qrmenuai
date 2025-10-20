'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Edit, Trash2, Image, Upload } from 'lucide-react'

interface Category {
  id: string
  name: string
  description: string | null
  coverImage?: string | null
  sortOrder: number
  dishes: any[]
}

interface SortableCategoriesProps {
  categories: Category[]
  onCategoriesReorder: (categories: Category[]) => void
  onEditCategory: (categoryId: string) => void
  onDeleteCategory: (categoryId: string) => void
  onUpdateCategoryImage?: (categoryId: string, imageFile: File) => void
  isUploadingImage?: string | null
  onRefresh?: () => void
}

interface SortableItemProps {
  category: Category
  onEdit: (categoryId: string) => void
  onDelete: (categoryId: string) => void
  onUpdateImage?: (categoryId: string, imageFile: File) => void
  isUploadingImage?: string | null
  onRefresh?: () => void
}

function SortableItem({ category, onEdit, onDelete, onUpdateImage, isUploadingImage, onRefresh }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && onUpdateImage) {
      onUpdateImage(category.id, file)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex items-center space-x-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
          >
            <GripVertical size={18} className="sm:w-5 sm:h-5" />
          </div>
          
          {/* Cover Image */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
            {category.coverImage ? (
              <>
                <img 
                  src={category.coverImage} 
                  alt={category.name}
                  className="w-full h-full object-cover"
                  key={`${category.id}-${category.coverImage?.slice(-10)}`} // Force re-render when image changes
                />
                {/* Loading overlay */}
                {isUploadingImage === category.id && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Image size={20} className="sm:w-6 sm:h-6" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{category.name}</h3>
            <p className="text-gray-600 text-xs sm:text-sm mt-1 line-clamp-2">
              {category.description || 'Nessuna descrizione.'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Piatti: {category.dishes?.length || 0} | Ordine: {category.sortOrder}
            </p>
          </div>
        </div>
        
        {/* Pulsanti di azione - Mobile: colonna, Desktop: riga */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
          {/* Image Upload Button */}
          <label className={`px-3 py-2 rounded text-sm transition-colors flex items-center justify-center cursor-pointer w-full sm:w-auto ${
            isUploadingImage === category.id 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white`}>
            {isUploadingImage === category.id ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span className="text-sm">Caricamento...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                <span className="text-sm">Immagine</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isUploadingImage === category.id}
            />
          </label>
          
          <button
            onClick={() => onEdit(category.id)}
            className="cursor-pointer bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center w-full sm:w-auto"
          >
            <Edit className="h-4 w-4 mr-2" />
            <span className="text-sm">Gestisci</span>
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="cursor-pointer bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors flex items-center justify-center w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            <span className="text-sm">Elimina</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SortableCategories({
  categories,
  onCategoriesReorder,
  onEditCategory,
  onDeleteCategory,
  onUpdateCategoryImage,
  isUploadingImage,
  onRefresh
}: SortableCategoriesProps) {
  const [items, setItems] = useState(categories)
  
  // Update local state when categories prop changes
  useEffect(() => {
    setItems(categories)
  }, [categories])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over?.id)

      const newItems = arrayMove(items, oldIndex, newIndex)
      
      // Aggiorna il sortOrder per riflettere la nuova posizione
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        sortOrder: index
      }))

      setItems(updatedItems)
      onCategoriesReorder(updatedItems)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {items.map((category) => (
            <SortableItem
              key={category.id}
              category={category}
              onEdit={onEditCategory}
              onDelete={onDeleteCategory}
              onUpdateImage={onUpdateCategoryImage}
              isUploadingImage={isUploadingImage}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
