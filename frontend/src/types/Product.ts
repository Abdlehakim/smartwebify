// src/types/Product.ts

export interface AttributeValueItem {
  name: string;
  value?: string;
  hex?: string;
  image?: string;
  imageId?: string;
}

export interface ProductDetail {
  name: string;
  description?: string | null;
}

export interface Magasin {
  _id: string;
  name: string;
}

export interface Brand {
  _id: string;
  name: string;
}

export interface Categorie {
  _id: string;
  name: string;
  slug: string;
}

export interface SubCategorie {
  _id: string;
  name: string;
  slug: string;
}

export interface Product {
  _id: string;
  name: string;
  info?: string | null;
  description?: string | null;
  reference: string;
  slug: string;

  categorie?: Categorie | null;
  subcategorie?: SubCategorie | null;       // 👈 unified name
  magasin?: Magasin | null;
  brand?: Brand | null;

  stock: number;
  price: number;
  tva: number;
  discount?: number;
  stockStatus: "in stock" | "out of stock";
  statuspage: "none" | "new-products" | "promotion" | "best-collection";

  mainImageUrl: string;
  mainImageId?: string;
  extraImagesUrl: string[];
  extraImagesId: string[];

  nbreview: number;
  averageRating: number;

  attributes: {
    attributeSelected: string;  // or ObjectId
    value?: string | AttributeValueItem[];
  }[];

  productDetails: ProductDetail[];
}
