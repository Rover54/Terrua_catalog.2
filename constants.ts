
import { Product } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    productCode: 'CHAIR-001',
    name: 'Modern Ergonomic Chair',
    category: 'Furniture',
    price: 249.99,
    description: 'A sleek, comfortable chair designed for long working hours with lumbar support.',
    imageUrl: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=800&q=80',
    tags: ['chair', 'furniture', 'office', 'black']
  },
  {
    id: '2',
    productCode: 'HEAD-992',
    name: 'Wireless Noise Cancelling Headphones',
    category: 'Electronics',
    price: 349.00,
    description: 'Premium audio experience with industry-leading active noise cancellation.',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    tags: ['headphones', 'audio', 'electronics', 'tech']
  },
  {
    id: '3',
    productCode: 'VASE-X-20',
    name: 'Minimalist Ceramic Vase',
    category: 'Home Decor',
    price: 45.00,
    description: 'Handcrafted white ceramic vase with a matte finish, perfect for any interior.',
    imageUrl: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=800&q=80',
    tags: ['vase', 'home', 'decor', 'white']
  }
];
