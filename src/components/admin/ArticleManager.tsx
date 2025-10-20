'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar } from 'lucide-react'
import ArticleCoverImageUpload from './ArticleCoverImageUpload'

interface Article {
  id: string
  title: string
  content: string
  excerpt?: string
  coverImage?: string | null
  buttonText?: string | null
  buttonUrl?: string | null
  isPublished: boolean
  publishedAt?: string
  createdAt: string
}

interface ArticleManagerProps {
  restaurantId: string
  articles: Article[]
  onArticlesUpdate: (articles: Article[]) => void
}

export default function ArticleManager({ restaurantId, articles, onArticlesUpdate }: ArticleManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAddArticle = async (articleData: Partial<Article>) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(articleData)
      })

      if (response.ok) {
        const newArticle = await response.json()
        onArticlesUpdate([...articles, newArticle])
        setShowAddModal(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Errore nella creazione dell\'articolo')
      }
    } catch (error) {
      console.error('Error creating article:', error)
      alert('Errore di connessione')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateArticle = async (articleId: string, articleData: Partial<Article>) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(articleData)
      })

      if (response.ok) {
        const updatedArticle = await response.json()
        onArticlesUpdate(articles.map(article => 
          article.id === articleId ? updatedArticle : article
        ))
        setEditingArticle(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Errore nell\'aggiornamento dell\'articolo')
      }
    } catch (error) {
      console.error('Error updating article:', error)
      alert('Errore di connessione')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo articolo?')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/articles/${articleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onArticlesUpdate(articles.filter(article => article.id !== articleId))
      } else {
        const error = await response.json()
        alert(error.error || 'Errore nell\'eliminazione dell\'articolo')
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      alert('Errore di connessione')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePublish = async (articleId: string, isPublished: boolean) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          isPublished,
          publishedAt: isPublished ? new Date().toISOString() : null
        })
      })

      if (response.ok) {
        const updatedArticle = await response.json()
        onArticlesUpdate(articles.map(article => 
          article.id === articleId ? updatedArticle : article
        ))
      } else {
        const error = await response.json()
        alert(error.error || 'Errore nell\'aggiornamento dello stato')
      }
    } catch (error) {
      console.error('Error toggling publish:', error)
      alert('Errore di connessione')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestione Articoli</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Articolo
        </button>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Nessun articolo pubblicato</p>
          <p className="text-sm">Crea il tuo primo articolo per il ristorante</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <div key={article.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {article.coverImage && (
                <img 
                  src={article.coverImage} 
                  alt={article.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    article.isPublished 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {article.isPublished ? 'Pubblicato' : 'Bozza'}
                  </span>
                </div>
                
                {article.excerpt && (
                  <p className="text-gray-600 text-sm mb-4">{article.excerpt}</p>
                )}
                
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(article.createdAt).toLocaleDateString('it-IT')}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingArticle(article)}
                    className="cursor-pointer flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Modifica
                  </button>
                  
                  <button
                    onClick={() => handleTogglePublish(article.id, !article.isPublished)}
                    className={`cursor-pointer flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center ${
                      article.isPublished
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {article.isPublished ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        Nascondi
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        Pubblica
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleDeleteArticle(article.id)}
                    className="cursor-pointer bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingArticle) && (
        <ArticleModal
          article={editingArticle}
          onSave={editingArticle ? 
            (data) => handleUpdateArticle(editingArticle.id, data) :
            handleAddArticle
          }
          onClose={() => {
            setShowAddModal(false)
            setEditingArticle(null)
          }}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}

// Article Modal Component
interface ArticleModalProps {
  article?: Article | null
  onSave: (data: Partial<Article>) => void
  onClose: () => void
  isLoading: boolean
}

function ArticleModal({ article, onSave, onClose, isLoading }: ArticleModalProps) {
  const [formData, setFormData] = useState({
    title: article?.title || '',
    content: article?.content || '',
    excerpt: article?.excerpt || '',
    coverImage: article?.coverImage || null,
    buttonText: article?.buttonText || '',
    buttonUrl: article?.buttonUrl || '',
    isPublished: article?.isPublished || false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }


  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="  text-xl font-bold mb-4">
          {article ? 'Modifica Articolo' : 'Nuovo Articolo'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titolo *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estratto
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={3}
              placeholder="Breve descrizione dell'articolo..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contenuto *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={8}
              required
              placeholder="Contenuto completo dell'articolo..."
            />
          </div>

          <ArticleCoverImageUpload
            articleId={article?.id}
            currentImage={formData.coverImage}
            onImageChange={(imageUrl) => setFormData(prev => ({ ...prev, coverImage: imageUrl }))}
            disabled={isLoading}
          />

          {/* Button Section */}
          <div className="border-t pt-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Pulsante Opzionale</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Testo del Pulsante
                </label>
                <input
                  type="text"
                  value={formData.buttonText}
                  onChange={(e) => setFormData(prev => ({ ...prev, buttonText: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="es. Prenota ora, Scopri di più..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL di Destinazione
                </label>
                <input
                  type="url"
                  value={formData.buttonUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, buttonUrl: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="https://..."
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Lascia vuoto per non mostrare il pulsante nell'articolo
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublished"
              checked={formData.isPublished}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="isPublished" className="text-sm text-gray-700">
              Pubblica immediatamente
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : (article ? 'Aggiorna' : 'Crea')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
