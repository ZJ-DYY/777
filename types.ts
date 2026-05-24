
export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR'
}

export enum TreatmentPlan {
  CHEMO_PLATINUM = '化疗 (含铂双药)',
  TARGETED_EGFR = '靶向治疗 (EGFR-TKI)',
  IMMUNO_PD1 = '免疫治疗 (PD-1/PD-L1)',
  RADIO = '放射治疗 (Radiotherapy)',
  SURGERY = '外科手术 (Surgery)',
  NONE = '未设置 / 观察期'
}

export interface ReportData {
  id: string; 
  metrics: Record<string, number>;
  date: string;
  summary: string;
  clinicalAnalysis?: string; 
  reportType: 'LAB' | 'CT'; 
  imageUrl?: string; 
}

export interface HADSResult {
  anxietyScore: number;
  anxietyLevel: 'Normal' | 'Mild' | 'Moderate' | 'Severe';
  depressionScore: number;
  depressionLevel: 'Normal' | 'Mild' | 'Moderate' | 'Severe';
}

export interface DailyCheckIn {
  date: string;
  temperature: number;
  weight?: number; 
  dtScore?: number; 
  hadsResult?: HADSResult; 
  symptomLog: SymptomEntry[]; 
  mood: 'Great' | 'Good' | 'Neutral' | 'Bad' | 'Awful';
  notes: string;
  medicationAdherence?: 'Taken' | 'Skipped' | 'Not Required';
}

export interface SymptomEntry {
  bodyPart: string;
  specificSymptom: string;
  severity: number; // 0-10
  duration?: string; 
}

export interface StructuredAdvice {
  category: 'Nutrition' | 'Rehab' | 'Psych' | 'Medication' | 'SideEffect';
  title: string;
  content: string;
  source: string;
  isComforting?: boolean;
  severityLevel?: 'Normal' | 'Mild' | 'Moderate' | 'Severe';
}

export interface SideEffectAdvice {
  symptom: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  careGuide: string;
  seekDoctor: boolean;
}

export interface Message {
  id: string;
  sender: 'PATIENT' | 'DOCTOR';
  content: string;
  timestamp: string;
  isRead: boolean;
}

// 映射 UKB 字段 ID 到业务逻辑
export interface UKBLifestyleProfile {
  // --- 吸烟维度 ---
  // Field 20116: Smoking status (0:Never, 1:Previous, 2:Current)
  smokingStatus: 0 | 1 | 2; 
  // Field 20161: Pack years of smoking (每年吸烟包数 × 年数)
  packYears: number; 

  // --- 睡眠维度 ---
  // Field 1160: Sleep duration (小时/天)
  sleepDuration: number;
  // Field 20535: 原指Townsend指数，此处演示映射为"主观睡眠质量评分" (1-10)
  sleepQualityScore: number; 

  // --- 呼吸症状维度 ---
  // Field 4717: Shortness of breath (气短程度: 0-4级)
  shortnessOfBreath: number; 
  // Field 22502: Wheezing/whistling in chest (1:Yes, 0:No)
  hasWheezing: boolean;

  // --- 运动维度 ---
  // Field 22032: IPAQ activity group (0:Low, 1:Moderate, 2:High)
  activityLevel: 0 | 1 | 2; 
  // Field 924: 演示映射为"每周运动频次"
  weeklyExerciseFreq: number;

  // --- 饮食维度 ---
  // Field 1309: Fresh fruit intake (份/天)
  fruitIntake: number;
  // Field 1289: Cooked vegetable intake (汤勺/天)
  cookedVegIntake: number;
  // Field 1299: Raw vegetable intake (汤勺/天)
  rawVegIntake: number;
  // Field 1369/1379/1389: Red meat intake frequency (0:Never to 5:Daily)
  redMeatIntake: 0 | 1 | 2 | 3 | 4 | 5;
  // Field 1349: Processed meat intake frequency (0:Never to 3:Daily)
  processedMeatIntake: 0 | 1 | 2 | 3;
  // Field 1329: Oily fish intake (frequency/week)
  oilyFishIntake: number;
  // Field 4429: Sugar sweetened beverages (cups/week)
  sugaryBeverageIntake: number;
}

export interface PatientProfile {
  id: string; 
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  height: number; // cm
  weight: number; // kg
  diagnosis: string;
  currentTreatment: TreatmentPlan; 
  treatmentStartDate?: string;
  messages: Message[];
  history: {
    reports: ReportData[];
    checkIns: DailyCheckIn[];
  };
  ukbProfile?: UKBLifestyleProfile; // 新增可选字段
}

// --- Rich Database Types ---

export interface RichSideEffect {
  id: string;
  name: string;
  mechanism?: string;
  riskFactors?: string;
  management: {
    strategyName?: string;
    description?: string;
    actionableSteps: string[]; // List of specific actions
    medications?: string[];
    whenToSeekHelp?: string;
  };
  comfortMessage?: string;
}

export interface RichCategory {
  id: string;
  name: string;
  description: string;
  adverseEvents: RichSideEffect[];
}

export interface NutritionGuideline {
  id: string;
  condition: string; // e.g., "Nausea", "General"
  content: string;
  allowedFoods: string[];
  avoidFoods: string[];
}