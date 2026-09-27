import { Shop } from '../types';

export const siteConfig = {
  // Centralized website configuration
  websiteName: 'VC MART',
  shortName: 'VC MART',
  tagline: 'Your Trust. Our Quality.',
  subTagline: 'Clothes • Mobiles • Bike Spare Parts',
  establishedYear: '2015',
  
  // Contact & WhatsApp details (Configurable in one place)
  whatsappNumber: '+918684933759',
  displayWhatsApp: '+91 86849 33759',
  contactPhone: '+91 86849 33759',
  email: 'vcmartshop@gmail.com',
  address: 'Street No 12E, Gandhi Nagar, Charkhi Dadri, Haryana - 127306, India',
  
  // Delivery & Free shipping policy
  freeDeliveryThreshold: 499,
  standardDeliveryFee: 49,
  currencySymbol: '₹',
  
  // Social media
  socialLinks: {
    instagram: 'https://www.instagram.com/vcmart.shop?stkn=eWM1c3k1OXdub2k5&utm_source=qr',
    whatsapp: 'https://wa.me/918684933759',
  },

  // Payment configuration
  paymentOptions: [
    {
      id: 'razorpay',
      title: 'Razorpay Secure Gateway',
      description: 'Pay via Google Pay, PhonePe, Paytm, BHIM UPI, Cards & NetBanking.',
      available: true,
    },
    {
      id: 'cod',
      title: 'Cash on Delivery (COD)',
      description: 'Pay cash or digital payment at your doorstep upon delivery.',
      available: true,
    },
  ],

  // Theme Colors inspired by the Lord Ganesha Vinayak Logo
  theme: {
    primaryBronze: '#965215',
    primaryGold: '#B47226',
    primaryGoldLight: '#D89B47',
    primaryDark: '#2A1810',
    primaryCream: '#FAF7F2',
    accentSaffron: '#C2410C',
  },
};

export const initialShops: Shop[] = [
  {
    id: 'vinayak-collection',
    name: 'VINAYAK COLLECTION',
    slug: 'vinayak-collection',
    subtitle: 'Clothing & Fashion',
    categoryName: 'Fashion & Clothing',
    tagline: 'Upgrade Your Style with Premium Ethnic & Western Wear',
    description: "North India's premier fashion hub for Men's shirts, T-shirts, premium jeans, lowers, oversize tees, cordsets, palazzo, suits, kurtis, kurta sets, tops, and festive wear.",
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    accentColor: '#965215',
    bgLight: 'bg-[#FAF7F2]',
    bannerImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop',
    logoIcon: 'Shirt',
    phone: '+91 86849 33759',
    whatsapp: '+918684933759',
    address: 'Street No 12E, Gandhi Nagar, Charkhi Dadri - 127306',
    status: 'active',
    categories: [
      'Shirts',
      'T-Shirts',
      'Jeans',
      "Women's Wear",
      'Kurtis',
      'Suits',
      'Tops',
      'Lowers',
      'Cordsets',
    ],
  },
  {
    id: 'kinshuk-spare-parts',
    name: 'KINSHUK SPARE PARTS',
    slug: 'kinshuk-spare-parts',
    subtitle: 'Bike Spare Parts & Accessories',
    categoryName: 'Bike Spare Parts & Accessories',
    tagline: 'Upgrade Your Ride with Genuine Spares & Styling Essentials',
    description: 'Trusted genuine two-wheeler parts, heavy-duty mobile holders, ultra-bright LED fog lights, indicators, premium mirrors, loud horns, comfort seat covers, and performance styling accessories.',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    accentColor: '#334155',
    bgLight: 'bg-[#F8FAFC]',
    bannerImage: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1200&auto=format&fit=crop',
    logoIcon: 'Bike',
    phone: '+91 82954 03529',
    whatsapp: '+918295403529',
    address: 'Street No 12E, Gandhi Nagar, Charkhi Dadri - 127306',
    status: 'active',
    categories: [
      'Bike Accessories',
      'Lights',
      'Indicators',
      'Mirrors',
      'Mobile Holders',
      'Horns',
      'Styling Accessories',
      'Safety Accessories',
    ],
  },
  {
    id: 'khushi-communication',
    name: 'KHUSHI COMMUNICATION',
    slug: 'khushi-communication',
    subtitle: 'Mobile Phones & Accessories',
    categoryName: 'Mobile Phones & Accessories',
    tagline: 'Power Your Digital Life with Certified Gadgets & Tech',
    description: 'Authorized smart gadgets, high-speed GaN chargers, braided cables, noise-cancelling earphones, deep-bass headphones, 20000mAh power banks, armored mobile covers, and 9H screen protectors.',
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
    accentColor: '#0284C7',
    bgLight: 'bg-[#F0F9FF]',
    bannerImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop',
    logoIcon: 'Smartphone',
    phone: '+91 83968 31521',
    whatsapp: '+918396831521',
    address: 'Street No 12E, Gandhi Nagar, Charkhi Dadri - 127306',
    status: 'active',
    categories: [
      'Mobile Phones',
      'Chargers',
      'Cables',
      'Earphones',
      'Headphones',
      'Mobile Covers',
      'Power Banks',
      'Screen Protectors',
    ],
  },
];
