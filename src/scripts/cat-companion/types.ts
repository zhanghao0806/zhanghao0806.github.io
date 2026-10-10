export type PetMood =
  | 'neutral'
  | 'happy'
  | 'curious'
  | 'surprised'
  | 'relaxed'
  | 'playful'
  | 'sleepy'
  | 'annoyed';

export type PetState =
  | 'idle'
  | 'attentive'
  | 'speaking'
  | 'reacting'
  | 'sleepy'
  | 'hidden';

export type PetTrigger =
  | 'hover-hide'
  | 'hover-giant'
  | 'hover-quantum'
  | 'hover-gravity'
  | 'hover-patronum'
  | 'first-visit'
  | 'tab-return'
  | 'pet-head'
  | 'pet-nose'
  | 'rapid-click'
  | 'recall'
  | 'idle'
  | 'page-blog'
  | 'page-projects'
  | 'page-about';

export interface PetLine {
  id: string;
  trigger: PetTrigger;
  text: string;
  mood: PetMood;
  weight: number;
  minIntervalMs: number;
  paths: string[];
}

export interface SpeechRequest {
  trigger: PetTrigger;
  priority: number;
  announce?: boolean;
}

export interface StateLease {
  id: number;
  state: PetState;
  priority: number;
}
