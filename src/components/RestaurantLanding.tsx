'use client'

import React from 'react'
import { Star, MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Youtube } from 'lucide-react'
import Link from 'next/link'
import ReviewForm from './ReviewForm'
import QRScanTracker from './QRScanTracker'

interface Restaurant {
  id: string
  name: string
  slug: string
  description?: string | null
  address: string
  phone?: string | null
  email?: string | null
  website?: string | null
  instagram?: string | null
  facebook?: string | null
  whatsapp?: string | null
  logo?: string | null
  coverImage?: string | null
  socialLinks?: any
}

interface Menu {
  id: string
  name: string
  description?: string | null
  coverImage?: string | null
  isActive: boolean
}

interface Article {
  id: string
  title: string
  excerpt?: string
  coverImage?: string
  buttonText?: string
  buttonUrl?: string
  publishedAt?: string
}

interface Review {
  id: string
  customerName: string
  rating: number
  comment?: string
}

interface RestaurantLandingProps {
  restaurant: Restaurant
  menus: Menu[]
  articles: Article[]
  reviews: Review[]
  averageRating: number
  totalReviews: number
  qrCodeId?: string
}

export default function RestaurantLanding({ 
  restaurant, 
  menus, 
  articles, 
  reviews, 
  averageRating, 
  totalReviews,
  qrCodeId
}: RestaurantLandingProps) {

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <Facebook className="w-6 h-6" />
      case 'instagram':
        return <Instagram className="w-6 h-6" />
      case 'twitter':
        return <Twitter className="w-6 h-6" />
      case 'youtube':
        return <Youtube className="w-6 h-6" />
      default:
        return <Globe className="w-6 h-6" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con Logo */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-center">
            {restaurant.logo ? (
              <img 
                src={restaurant.logo} 
                alt={restaurant.name}
                className="h-32 w-auto object-contain"
              />
            ) : (
              <div className="text-3xl font-bold text-gray-900">
                {restaurant.name}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {restaurant.coverImage && (
        <div className="relative h-64 md:h-96">
          <img 
            src={restaurant.coverImage} 
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0   flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 text-shadow-lg">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="text-xl md:text-2xl text-shadow-sm">{restaurant.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Menu Cards */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">I Nostri Menu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menus.map((menu) => (
              <div 
                key={menu.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {menu.coverImage && (
                  <img 
                    src={menu.coverImage} 
                    alt={menu.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{menu.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{menu.description}</p>
                  <Link 
                    href={`/menu/${restaurant.slug}?menuId=${menu.id}`}
                    className="block w-full"
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                      className="cursor-pointer w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Visualizza Menu
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* Articoli del Ristorante */}
        {articles.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Notizie e Eventi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <article key={article.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  {article.coverImage && (
                    <img 
                      src={article.coverImage} 
                      alt={article.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{article.title}</h3>
                    {article.excerpt && (
                      <p className="text-gray-600 mb-4">{article.excerpt}</p>
                    )}
                    {article.buttonText && article.buttonUrl && (
                      <div className="mb-4">
                        <a
                          href={article.buttonUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {article.buttonText}
                        </a>
                      </div>
                    )}
                    {article.publishedAt && (
                      <p className="text-sm text-gray-500">
                        {new Date(article.publishedAt).toLocaleDateString('it-IT')}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Recensioni */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Cosa Dicono i Nostri Clienti</h2>
          
          {/* Rating Medio */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-2">
              {renderStars(Math.round(averageRating))}
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {averageRating.toFixed(1)} su 5
            </p>
            <p className="text-gray-600">{totalReviews} recensioni</p>
          </div>

          {/* Lista Recensioni */}
          {reviews.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {reviews.slice(0, 6).map((review) => (
                <div key={review.id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">{review.customerName}</span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Form Recensioni */}
          <div className="max-w-2xl mx-auto">
            <ReviewForm 
              restaurantId={restaurant.id}
              onReviewSubmitted={() => {
                // Potresti aggiornare le recensioni qui se necessario
                console.log('Review submitted')
              }}
            />
          </div>
        </section>

        {/* Social Network */}
        {(restaurant.instagram || restaurant.facebook || restaurant.whatsapp) && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Seguici sui Social</h2>
            <div className="flex justify-center space-x-6">
              {restaurant.instagram && (
                <a
                  href={restaurant.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-pink-600 transition-colors"
                  title="Instagram"
                >
                  <Instagram className="h-8 w-8" />
                </a>
              )}
              {restaurant.facebook && (
                <a
                  href={restaurant.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                  title="Facebook"
                >
                  <Facebook className="h-8 w-8" />
                </a>
              )}
              {restaurant.whatsapp && (
                <a
                  href={`https://wa.me/${restaurant.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-green-600 transition-colors"
                  title="WhatsApp"
                >
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </a>
              )}
            </div>
          </section>
        )}

        {/* Informazioni Contatto */}
        <section className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Contattaci</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {restaurant.address && (
              <div className="flex items-center">
                <MapPin className="w-6 h-6 text-blue-600 mr-3" />
                <span className="text-gray-700">{restaurant.address}</span>
              </div>
            )}
            {restaurant.phone && (
              <div className="flex items-center">
                <Phone className="w-6 h-6 text-blue-600 mr-3" />
                <a href={`tel:${restaurant.phone}`} className="text-gray-700 hover:text-blue-600">
                  {restaurant.phone}
                </a>
              </div>
            )}
            {restaurant.email && (
              <div className="flex items-center">
                <Mail className="w-6 h-6 text-blue-600 mr-3" />
                <a href={`mailto:${restaurant.email}`} className="text-gray-700 hover:text-blue-600">
                  {restaurant.email}
                </a>
              </div>
            )}
          </div>
        </section>
      </div>
      
      {/* QR Scan Tracker */}
      {qrCodeId && <QRScanTracker qrCodeId={qrCodeId} />}
    </div>
  )
}
