import { EMenuTemplateRegistry } from './types';
import { ClassicTemplate } from './ClassicTemplate';
import { ModernTemplate } from './ModernTemplate';
import { MinimalTemplate } from './MinimalTemplate';
import { NatureTemplate } from './NatureTemplate';
import { RoyalWhiteTemplate } from './RoyalWhiteTemplate';
import { RoyalBlueTemplate } from './RoyalBlueTemplate';
import { AntiquePaperTemplate } from './AntiquePaperTemplate';
import { ChalkboardPremiumTemplate } from './ChalkboardPremiumTemplate';
import { MarbleLuxuryTemplate } from './MarbleLuxuryTemplate';
import { SymphonyEliteTemplate } from './SymphonyEliteTemplate';

export * from './types';

export const TEMPLATE_REGISTRY: Record<string, EMenuTemplateRegistry> = {
  'default': {
    metadata: {
      id: 'default',
      name: 'Classic Elegant',
      description: 'Clean, light design with focus on typography.',
      previewImage: '/templates/classic.png',
      isFree: true,
      requiredPlan: 'FREE'
    },
    component: ClassicTemplate
  },
  'antique': {
    metadata: {
      id: 'antique',
      name: 'Antique Paper',
      description: 'Minimalist physical menu style with textured paper.',
      previewImage: '/templates/antique.png',
      isFree: true,
      requiredPlan: 'FREE'
    },
    component: AntiquePaperTemplate
  },
  'modern': {
    metadata: {
      id: 'modern',
      name: 'Modern Dark',
      description: 'Sleek dark mode with high-impact photography.',
      previewImage: '/templates/modern.png',
      isFree: true,
      requiredPlan: 'FREE'
    },
    component: ModernTemplate
  },
  'chalkboard': {
    metadata: {
      id: 'chalkboard',
      name: 'Chalkboard Premium',
      description: 'Hand-drawn chalkboard aesthetic with multi-column layout.',
      previewImage: '/templates/chalkboard.png',
      isFree: false,
      requiredPlan: 'PRO'
    },
    component: ChalkboardPremiumTemplate
  },
  'royal-white': {
    metadata: {
      id: 'royal-white',
      name: 'Royal White',
      description: 'Fancy premium white with ornate gold accents.',
      previewImage: '/templates/royal_white.png',
      isFree: false,
      requiredPlan: 'PRO'
    },
    component: RoyalWhiteTemplate
  },
  'royal-blue': {
    metadata: {
      id: 'royal-blue',
      name: 'Royal Blue Khmer',
      description: 'Deep navy and gold with artistic Khmer motifs.',
      previewImage: '/templates/royal_blue.png',
      isFree: false,
      requiredPlan: 'PRO'
    },
    component: RoyalBlueTemplate
  },
  'minimal': {
    metadata: {
      id: 'minimal',
      name: 'Minimal Premium',
      description: 'Ultra-clean luxury design for high-end stores.',
      previewImage: '/templates/minimal.png',
      isFree: false,
      requiredPlan: 'ELITE'
    },
    component: MinimalTemplate
  },
  'nature': {
    metadata: {
      id: 'nature',
      name: 'Farm Nature',
      description: 'Earthy, organic feel for farm-to-table concepts.',
      previewImage: '/templates/nature.png',
      isFree: false,
      requiredPlan: 'ELITE'
    },
    component: NatureTemplate
  },
  'marble': {
    metadata: {
      id: 'marble',
      name: 'Marble Luxury',
      description: 'Elite green marble aesthetic with large hero layouts.',
      previewImage: '/templates/marble.png',
      isFree: false,
      requiredPlan: 'ELITE'
    },
    component: MarbleLuxuryTemplate
  },
  'symphony': {
    metadata: {
      id: 'symphony',
      name: 'Symphony Elite',
      description: 'Story-driven cinematic layout with luxury typography.',
      previewImage: '/templates/symphony.png',
      isFree: false,
      requiredPlan: 'ELITE'
    },
    component: SymphonyEliteTemplate
  }
};

export const getTemplate = (id: string) => {
  return TEMPLATE_REGISTRY[id] || TEMPLATE_REGISTRY['default'];
};

export const getAllTemplates = () => {
  return Object.values(TEMPLATE_REGISTRY);
};
