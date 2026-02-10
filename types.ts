
export interface Product {
  id: string;
  productCode: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  tags: string[];
}

export interface VisualSearchMatch {
  matchId: string | null;
  confidence: number;
  detectedObject: string;
  detectedCode: string | null;
  reasoning: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  SEARCHING = 'SEARCHING',
  ERROR = 'ERROR'
}

export type ViewMode = 'compact' | 'standard' | 'xxl';
