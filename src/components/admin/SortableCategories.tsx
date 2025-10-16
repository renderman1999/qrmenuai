'use client'

import { useState } from 'react'
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
import { GripVertical, Edit, Trash2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  description: string | null
  sortOrder: number
  dishes: any[]
}

interface SortableCategoriesProps {
  categories: Category[]
  onCategoriesReorder: (categories: Category[]) => void
  onEditCategory: (categoryId: string) => void
  onDeleteCategory: (categoryId: string) => void
}

interface SortableItemProps {
  category: Category
  onEdit: (categoryId: string) => void
  onDelete: (categoryId: string) => void
}

function SortableItem({ category, onEdit, onDelete }: SortableItemProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
          >
            <GripVertical size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
            <p className="text-gray-600 text-sm mt-1">
              {category.description || 'Nessuna descrizione.'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Piatti: {category.dishes?.length || 0} | Ordine: {category.sortOrder}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(category.id)}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
          >
            <Edit className="h-4 w-4 mr-1" />
            Gestisci
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Elimina
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
}: SortableCategoriesProps) {
  const [items, setItems] = useState(categories)

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
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
