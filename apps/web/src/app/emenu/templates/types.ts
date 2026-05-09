import React from 'react';

export interface EMenuTemplateProps {
  store: any;
  settings: any;
  products: any[];
  tags: string | null;
  cart: any[];
  onAddToCart: (product: any) => void;
  onOpenCart: () => void;
  isScrolled: boolean;
}

export interface EMenuTemplateMetadata {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  isFree: boolean;
  requiredPlan?: 'FREE' | 'PRO' | 'ELITE';
}

export interface EMenuTemplateRegistry {
  metadata: EMenuTemplateMetadata;
  component: React.ComponentType<EMenuTemplateProps>;
}

// We will populate this in the next steps
export const TEMPLATE_REGISTRY: Record<string, EMenuTemplateRegistry> = {};
