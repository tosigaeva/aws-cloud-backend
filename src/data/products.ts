export type Product = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  count: number;
};

export const products: Product[] = [
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80aa',
    title: 'Cloud Native Backpack',
    description: 'Durable daypack with a laptop sleeve and weather-resistant shell.',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',
    price: 79,
    count: 12,
  },
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80a1',
    title: 'Lambda Desk Lamp',
    description: 'Adjustable LED desk lamp with warm and cool light modes.',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80',
    price: 42,
    count: 7,
  },
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80a2',
    title: 'API Gateway Mug',
    description: 'Ceramic mug with a matte finish and comfortable handle.',
    imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80',
    price: 18,
    count: 24,
  },
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80a3',
    title: 'CloudWatch Notebook',
    description: 'Hardcover notebook for logs, sketches, and deployment notes.',
    imageUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=80',
    price: 15,
    count: 31,
  },
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80a4',
    title: 'Serverless Hoodie',
    description: 'Soft cotton hoodie with a relaxed fit.',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
    price: 64,
    count: 5,
  },
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80a5',
    title: 'CDK Sticker Pack',
    description: 'Set of vinyl stickers for laptops, water bottles, and notebooks.',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    price: 9,
    count: 50,
  },
];
