export type WasteCategory = 'Organik' | 'Anorganik' | 'B3' | 'Residu';

export interface UpcycleIdea {
  title: string;
  difficulty: string;
  description: string;
}

export interface WasteScanResult {
  confidence?: number;
  evidence?: string;
  needsRetake?: boolean;
  itemName: string;
  category: WasteCategory;
  subMaterial: string;
  decompositionTime: string;
  recyclabilityScore: number;
  actionBadge: string;
  handlingSteps: string[];
  upcycleIdea: UpcycleIdea;
  ecoTip: string;
  carbonSavedKg: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'terri';
  text: string;
  timestamp: string;
  quickAction?: string;
}

export interface EduModule {
  id: string;
  stage: 'KNOW' | 'LEARN' | 'SORT' | 'ACT' | 'PROTECT';
  title: string;
  subtitle?: string;
  icon?: string;
  category?: WasteCategory | 'Umum';
  color?: string;
  brickColor?: string; // Tailwind color class or hex
  accentColor?: string;
  duration: string;
  xp: number;
  completed: boolean;
  isCustom?: boolean;
  summary: string;
  sections: {
    title: string;
    content: string;
    highlight?: string;
  }[];
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface SortItem {
  id: string;
  name: string;
  category: WasteCategory;
  material: string;
  binColor: string;
  binName: string;
  icon: string;
  decomposition: string;
  tips: string;
}

export interface UpcycleProject {
  id: string;
  title: string;
  sourceMaterial: string;
  category: string;
  difficulty: 'Mudah' | 'Sedang' | 'Kreatif';
  timeEstimate: string;
  materials: string[];
  steps: string[];
  imagePlaceholder: string;
  impactScore: number;
  likes: number;
}

export interface SmartBin {
  id: string;
  location: string;
  type: string;
  capacityPercent: number;
  status: 'Normal' | 'Perlu Dikosongkan' | 'Optimal';
  batteryLevel: number;
  temperatureC: number;
  lastEmptied: string;
  colorBadge: string;
}

export interface WasteBank {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  operatingHours: string;
  acceptedTypes: WasteCategory[];
  rewardRatePerKg: string;
  coordinates: { x: number; y: number }; // percentage on map
}

export interface QuizQuestion {
  id: string;
  question: string;
  category: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  xpReward: number;
}

export type UserRole = 'siswa' | 'petugas' | 'admin';
