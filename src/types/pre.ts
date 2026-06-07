import type { RouteRecommendation } from 'src/services/routes';

export type RecommendedRoute = RouteRecommendation;

export interface ParsedHistory {
  name: string;
  distanceKm: number;
  elevationGain: number;
  durationMin: number;
  date: string;
}

export interface AnalysisResult extends ParsedHistory {
  fitnessEstimate: number;
  insight: string;
  recommendation: string;
}

export interface ProgressData {
  progress: number;
  name: string;
}

export interface RouteCard {
  emoji: string;
  name: string;
  region: string;
  routeKind: 'trail' | 'peak';
  difficulty: 'easy' | 'medium' | 'hard';
  distance: string;
  elevation: string;
  maxElevation: string;
  time: string;
  trailShape: string;
  surface: string;
  bestSeason: string;
  tags: string[];
  highlight: string;
  source?: RecommendedRoute;
}

export interface Message {
  id: number;
  role: 'bot' | 'user';
  type:
    | 'text'
    | 'sos'
    | 'route-card'
    | 'weather-card'
    | 'history-card'
    | 'analysis-progress'
    | 'analysis-card';
  text?: string;
  card?: RouteCard;
  time: string;
  cardData?: ParsedHistory | AnalysisResult | ProgressData;
}

export interface DemandSummary {
  goal: string;
  days: string;
  elevation: string;
  maxElevation: string;
  fitness: string;
  risk: string;
  note: string;
}

export interface GearAssessment {
  score: number;
  level: string;
  summary: string;
  tips: string[];
  suggested_items: string[];
  model_used: string;
  fallback?: boolean;
}

export interface WeatherPeriod {
  label: string;
  icon: string;
  temp: string;
  condition: string;
  rain_probability?: string | null;
}

export interface RouteWeatherResponse {
  location_name: string;
  periods: WeatherPeriod[];
  advice: string;
  source: string;
  model_used: string;
  fallback?: boolean;
  fallback_stage?: string | null;
  fallback_reason?: string | null;
}

export interface GpxMapTrack {
  name: string;
  points: [number, number][];
  segments?: [number, number][][];
  trackId?: number;
  matchScope?: 'trail' | 'peak';
  distanceKm: number;
  elevationGain: number;
  elevationLoss: number | null;
  durationMin: number | null;
  averageGradePct: number | null;
  source: 'uploaded-gpx' | 'database-gpx' | 'route-polyline';
  hintSegments: Array<{
    label: string;
    midpoint: [number, number];
    distanceKm: number;
    elevationDeltaM: number;
    gradePct: number | null;
  }>;
}

export interface GearItem {
  id: string;
  label: string;
  icon?: string;
}
