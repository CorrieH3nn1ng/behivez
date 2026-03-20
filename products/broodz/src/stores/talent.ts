import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from 'src/boot/axios'

export interface Talent {
  id: number
  user_id: number
  slug: string
  name: string
  tagline: string | null
  bio: string | null
  category_id: number | null
  category_name?: string
  category_slug?: string
  location: string | null
  profile_image: string | null
  cover_image: string | null
  social_links: Record<string, string>
  is_published: boolean
  is_beta: boolean
  theme: string
  phone: string | null
  email: string | null
  whatsapp: string | null
  services?: Service[]
  portfolio?: PortfolioItem[]
  products?: Product[]
}

export interface Service {
  id: number
  talent_id: number
  name: string
  description: string | null
  price: number | null
  price_label: string | null
  duration: string | null
  sort_order: number
}

export interface PortfolioItem {
  id: number
  talent_id: number
  type: 'image' | 'video' | 'embed'
  url: string
  thumbnail_url: string | null
  title: string | null
  description: string | null
  sort_order: number
  embed_url: string | null
  platform: 'tiktok' | 'instagram' | 'youtube' | null
}

export interface Product {
  id: number
  talent_id: number
  name: string
  description: string | null
  price: number | null
  price_label: string | null
  image_url: string | null
  in_stock: boolean
  sort_order: number
}

export const useTalentStore = defineStore('talent', () => {
  const current = ref<Talent | null>(null)
  const mine = ref<Talent | null>(null)
  const browseTalents = ref<Talent[]>([])
  const categories = ref<{ id: number; name: string; slug: string; icon: string }[]>([])

  async function fetchBySlug(slug: string) {
    const { data } = await api.get('/bz-talent-by-slug', { params: { slug } })
    current.value = data
    return data as Talent
  }

  async function fetchMine() {
    const { data } = await api.get('/bz-talent-mine')
    mine.value = data
    return data as Talent
  }

  async function updateProfile(updates: Partial<Talent>) {
    const { data } = await api.post('/bz-talent-update', updates)
    mine.value = data
    return data as Talent
  }

  async function publish() {
    const { data } = await api.post('/bz-talent-publish', { is_published: true })
    if (mine.value) mine.value.is_published = true
    return data
  }

  async function unpublish() {
    const { data } = await api.post('/bz-talent-publish', { is_published: false })
    if (mine.value) mine.value.is_published = false
    return data
  }

  async function fetchBrowse(categorySlug?: string, page = 1) {
    const { data } = await api.get('/bz-talents-browse', {
      params: { category: categorySlug, page },
    })
    browseTalents.value = data.talents
    return data
  }

  async function fetchCategories() {
    const { data } = await api.get('/bz-categories-list')
    categories.value = data
    return data
  }

  async function checkSlug(slug: string) {
    const { data } = await api.get('/bz-talent-slug-check', { params: { slug } })
    return data as { available: boolean }
  }

  // Product methods
  async function fetchProducts(talentId: number) {
    const { data } = await api.get('/bz-product-list', { params: { talent_id: talentId } })
    return data as Product[]
  }

  async function upsertProduct(product: Partial<Product> & { talent_id: number }) {
    const { data } = await api.post('/bz-product-upsert', product)
    return data as Product
  }

  async function deleteProduct(id: number) {
    await api.post('/bz-product-delete', { id })
  }

  async function reorderProducts(id: number, sortOrder: number) {
    await api.post('/bz-product-reorder', { id, sort_order: sortOrder })
  }

  return {
    current, mine, browseTalents, categories,
    fetchBySlug, fetchMine, updateProfile, publish, unpublish,
    fetchBrowse, fetchCategories, checkSlug,
    fetchProducts, upsertProduct, deleteProduct, reorderProducts,
  }
})
