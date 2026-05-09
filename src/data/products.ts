export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
};

export const products: Product[] = [
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80aa',
    title: 'Cloud Native Backpack',
    description: 'Durable daypack with a laptop sleeve and weather-resistant shell.',
    price: 79,
    count: 12,
  },
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80a1',
    title: 'Lambda Desk Lamp',
    description: 'Adjustable LED desk lamp with warm and cool light modes.',
    price: 42,
    count: 7,
  },
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80a2',
    title: 'API Gateway Mug',
    description: 'Ceramic mug with a matte finish and comfortable handle.',
    price: 18,
    count: 24,
  },
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80a3',
    title: 'CloudWatch Notebook',
    description: 'Hardcover notebook for logs, sketches, and deployment notes.',
    price: 15,
    count: 31,
  },
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80a4',
    title: 'Serverless Hoodie',
    description: 'Soft cotton hoodie with a relaxed fit.',
    price: 64,
    count: 5,
  },
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80a5',
    title: 'CDK Sticker Pack',
    description: 'Set of vinyl stickers for laptops, water bottles, and notebooks.',
    price: 9,
    count: 50,
  },
];
