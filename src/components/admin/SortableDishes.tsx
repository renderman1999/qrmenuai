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
import { GripVertical, Edit, Trash2, Euro, Move, Eye, EyeOff } from 'lucide-react'

interface Dish {
  id: string
  name: string
  description: string | null
  price: number | string
  allergens: (string | { id: string; name: string; icon?: string })[]
  ingredients: (string | { id: string; name: string; category?: string })[]
  isVegetarian: boolean
  isVegan: boolean
  isGlutenFree: boolean
  isSpicy: boolean
  image: string | null
  sortOrder: number
  isActive: boolean
}

interface SortableDishesProps {
  dishes: Dish[]
  onDishesReorder: (dishes: Dish[]) => void
  onEditDish: (dish: Dish) => void
  onDeleteDish: (dishId: string) => void
  onMoveDish: (dish: Dish) => void
  onToggleVisibility: (dishId: string, currentStatus: boolean) => void
  togglingDish?: string | null
}

interface SortableItemProps {
  dish: Dish
  onEdit: (dish: Dish) => void
  onDelete: (dishId: string) => void
  onMove: (dish: Dish) => void
  onToggleVisibility: (dishId: string, currentStatus: boolean) => void
  isToggling?: boolean
}

function SortableItem({ dish, onEdit, onDelete, onMove, onToggleVisibility, isToggling }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dish.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 mt-1"
          >
            <GripVertical size={18} className="sm:w-5 sm:h-5" />
          </div>
          
          {/* Immagine del piatto */}
          {dish.image && (
            <div className="flex-shrink-0">
              <img
                src={dish.image}
                alt={dish.name}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{dish.name}</h3>
              {!dish.isActive && (
                <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                  Nascosto
                </span>
              )}
            </div>
            {dish.description && (
              <p className="text-gray-600 text-xs sm:text-sm mt-1 line-clamp-2">{dish.description}</p>
            )}
            <div className="flex items-center mt-2">
              <span className="text-base sm:text-lg font-bold text-green-600 flex items-center">
                <Euro size={14} className="mr-1 sm:w-4 sm:h-4" />
                {typeof dish.price === 'string' ? parseFloat(dish.price).toFixed(2) : dish.price.toFixed(2)}
              </span>
            </div>
            
            {/* Caratteristiche */}
            <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
              {dish.isVegetarian && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  🌱 Vegetariano
                </span>
              )}
              {dish.isVegan && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  🌿 Vegano
                </span>
              )}
              {dish.isGlutenFree && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  🌾 Senza Glutine
                </span>
              )}
              {dish.isSpicy && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                  🌶️ Piccante
                </span>
              )}
            </div>

            {/* Allergeni */}
            {dish.allergens && dish.allergens.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Allergeni:</p>
                <div className="flex flex-wrap gap-1">
                  {dish.allergens.map((allergen, index) => (
                    <span
                      key={index}
                      className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs"
                    >
                      {typeof allergen === 'string' ? allergen : allergen.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredienti */}
            {dish.ingredients && dish.ingredients.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Ingredienti:</p>
                <div className="flex flex-wrap gap-1">
                  {dish.ingredients.slice(0, 3).map((ingredient, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs"
                    >
                      {typeof ingredient === 'string' ? ingredient : ingredient.name}
                    </span>
                  ))}
                  {dish.ingredients.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{dish.ingredients.length - 3} altri
                    </span>
                  )}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              Ordine: {dish.sortOrder}
            </p>
          </div>
        </div>
        
        {/* Pulsanti di azione - Mobile: colonna, Desktop: riga */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 mt-4 sm:mt-0 sm:ml-4">
          <button
            onClick={() => onEdit(dish)}
            className="cursor-pointer bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center w-full sm:w-auto"
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifica
          </button>
          <button
            onClick={() => onMove(dish)}
            className="cursor-pointer bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors flex items-center justify-center w-full sm:w-auto"
          >
            <Move className="h-4 w-4 mr-2" />
            Sposta
          </button>
          <button
            onClick={() => onToggleVisibility(dish.id, dish.isActive)}
            disabled={isToggling}
            className={`cursor-pointer px-3 py-2 rounded text-sm transition-colors flex items-center justify-center w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed ${
              dish.isActive 
                ? 'bg-orange-600 text-white hover:bg-orange-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
            title={dish.isActive ? 'Nascondi dal menu' : 'Mostra nel menu'}
          >
            {isToggling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Aggiornamento...
              </>
            ) : dish.isActive ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Nascondi
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Mostra
              </>
            )}
          </button>
          <button
            onClick={() => onDelete(dish.id)}
            className="cursor-pointer bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors flex items-center justify-center w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Elimina
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SortableDishes({
  dishes,
  onDishesReorder,
  onEditDish,
  onDeleteDish,
  onMoveDish,
  onToggleVisibility,
  togglingDish,
}: SortableDishesProps) {
  const [items, setItems] = useState(dishes)

  // Sincronizza lo stato interno con le props quando cambiano
  useEffect(() => {
    setItems(dishes)
  }, [dishes])

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
      onDishesReorder(updatedItems)
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
          {items.map((dish) => (
            <SortableItem
              key={dish.id}
              dish={dish}
              onEdit={onEditDish}
              onDelete={onDeleteDish}
              onMove={onMoveDish}
              onToggleVisibility={onToggleVisibility}
              isToggling={togglingDish === dish.id}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
