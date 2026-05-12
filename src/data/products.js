import kropekKrunchImg from '../assets/products/kropek-krunch.jpeg';
import veggieNachosImg from '../assets/products/veggie-nachos.jpeg';
import coneCrunchImg from '../assets/products/IMG_7245.jpeg';

export const PRODUCTS = [
  {
    id: 'kropek-krunch',
    name: 'Kropek Krunch',
    category: 'Healthy Vegetable Snacks',
    image: kropekKrunchImg,
    description:
      'Crunchy vegetable kropek made from squash and malunggay. A healthier twist on your favorite crispy snack.',
    badges: ['Best Seller'],
    variants: [
      {
        id: 'squash',
        name: 'Squash',
        sku: 'KB-SQUASH',
        barcode: '',
        price: 50,
        cost: 30,
        stockQty: 40,
        lowStockThreshold: 8,
        inStock: true,
      },
      {
        id: 'malunggay',
        name: 'Malunggay',
        sku: 'KB-MALUNGGAY',
        barcode: '',
        price: 50,
        cost: 30,
        stockQty: 40,
        lowStockThreshold: 8,
        inStock: true,
      },
    ],
  },
  {
    id: 'veggie-nachos',
    name: 'Veggie Nachos',
    category: 'Healthy Snack Meals',
    image: veggieNachosImg,
    description:
      'Crispy and flavorful veggie nachos loaded with savory goodness and satisfying crunch.',
    badges: ['Snack Meal'],
    variants: [
      {
        id: 'squash',
        name: 'Squash',
        sku: 'VN-SQUASH',
        barcode: '',
        price: 110,
        cost: 70,
        stockQty: 25,
        lowStockThreshold: 6,
        inStock: true,
      },
      {
        id: 'malunggay',
        name: 'Malunggay',
        sku: 'VN-MALUNGGAY',
        barcode: '',
        price: 110,
        cost: 70,
        stockQty: 25,
        lowStockThreshold: 6,
        inStock: true,
      },
    ],
  },
  {
    id: 'cone-crunch',
    name: 'Cone Crunch',
    category: 'Sweet & Savory Snacks',
    image: coneCrunchImg,
    description:
      'Crunchy cone-shaped snacks available in exciting flavors perfect for sharing.',
    badges: ['Share Pack'],
    variants: [
      {
        id: 'all-flavors',
        name: 'All Flavors',
        sku: 'CC-ALL',
        barcode: '',
        price: 80,
        cost: 45,
        stockQty: 35,
        lowStockThreshold: 7,
        inStock: true,
      },
    ],
  },
];
