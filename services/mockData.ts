
import { PatientProfile, TreatmentPlan, UserRole, ReportData, UKBLifestyleProfile } from "../types";

// Placeholder image for mock data (a generic document icon)
const MOCK_IMG_URL = "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";

// Helper to generate a date N months ago (Local Time safe)
const getDateMonthsAgo = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    // Use local YYYY-MM-DD format
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 10);
    return localISOTime;
};

// Helper to get Yesterday's date (Local Time)
const getYesterday = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 10);
    return localISOTime;
};

const getRandomValue = (min: number, max: number, decimals: number = 1) => {
    const val = Math.random() * (max - min) + min;
    return Number(val.toFixed(decimals));
};

// Generate 8 historical lab reports (6-month intervals = 4 years)
const generateHistoricalReports = (patientId: string, treatment: TreatmentPlan): ReportData[] => {
    const reports: ReportData[] = [];
    
    for (let i = 0; i < 8; i++) {
        const monthsAgo = i * 6; // 0, 6, 12, 18 ... 42
        
        // Base normal ranges
        let wbc = getRandomValue(4.5, 8.5);
        let hb = getRandomValue(125, 145, 0);
        let plt = getRandomValue(150, 250, 0);
        let neu = getRandomValue(2.0, 5.0);
        let lym = getRandomValue(1.5, 3.0);
        let rbc = getRandomValue(4.0, 4.8);
        let alt = getRandomValue(15, 35, 0);
        let ast = getRandomValue(18, 30, 0);
        let cr = getRandomValue(50, 80, 0);
        let cea = getRandomValue(1.0, 3.5);

        // Simulate Chemo Effect (Lower WBC/Neutrophils/Platelets recently)
        if (treatment === TreatmentPlan.CHEMO_PLATINUM && i < 3) {
            wbc = getRandomValue(2.8, 3.9); // Low
            neu = getRandomValue(1.2, 1.9); // Low
            plt = getRandomValue(90, 140, 0); // Low
            cea = getRandomValue(2.0, 6.0); // Slightly elevated or normal
        }
        
        // Simulate Targeted Therapy (Liver impact sometimes)
        if (treatment === TreatmentPlan.TARGETED_EGFR && i < 4) {
            alt = getRandomValue(45, 65, 0); // Elevated
            ast = getRandomValue(40, 60, 0); // Elevated
        }

        // Simulate advanced stage (CEA higher in past, maybe dropping now)
        if (treatment !== TreatmentPlan.NONE && i > 4) {
             cea = getRandomValue(5.0, 15.0); // Higher in the past
        }

        reports.push({
            id: `rep-lab-${patientId}-${i}`,
            date: getDateMonthsAgo(monthsAgo),
            reportType: 'LAB',
            metrics: {
                'WBC': wbc,
                'Hemoglobin': hb,
                'Platelet': plt,
                'Neutrophil': neu,
                'Lymphocyte': lym,
                'RBC': rbc,
                'ALT': alt,
                'AST': ast,
                'Creatinine': cr,
                'CEA': cea
            },
            summary: i === 0 ? "近期复查，重点关注血象变化。" : "定期随访检查。",
            clinicalAnalysis: "自动生成的历史数据分析...",
            imageUrl: MOCK_IMG_URL
        });
    }

    // Add one CT report recently
    reports.push({
        id: `rep-ct-${patientId}-recent`,
        date: getDateMonthsAgo(1),
        reportType: 'CT',
        metrics: { 'TumorSize': getRandomValue(1.5, 3.5) },
        summary: "胸部 CT 复查，病情稳定。",
        clinicalAnalysis: "影像学疗效评估：SD (病情稳定)。未见明显新发病灶。",
        imageUrl: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    });

    return reports;
};

// Base Template for a patient
const createPatient = (id: string, name: string, age: number, diagnosis: string, treatment: TreatmentPlan): PatientProfile => {
  // Generate UKB Profile based on ID (888 is high risk example)
  let ukbProfile: UKBLifestyleProfile | undefined;
  
  if (id === '888') {
    // High Risk Profile (Smoker, Poor Sleep, Low Activity, Poor Diet)
    ukbProfile = {
      smokingStatus: 2, // Current smoker
      packYears: 25,    // Heavy smoker
      sleepDuration: 5, // Poor sleep
      sleepQualityScore: 3,
      shortnessOfBreath: 2, // Moderate SOB
      hasWheezing: true,
      activityLevel: 0, // Low activity
      weeklyExerciseFreq: 1,
      fruitIntake: 1,    // Low fruit intake
      cookedVegIntake: 1,
      rawVegIntake: 0,
      redMeatIntake: 4, // 5-6/week
      processedMeatIntake: 3, // Daily (bad)
      oilyFishIntake: 0,
      sugaryBeverageIntake: 5
    };
  } else {
    // Moderate/Good Profile
    ukbProfile = {
      smokingStatus: 0, // Never
      packYears: 0,
      sleepDuration: 7,
      sleepQualityScore: 8,
      shortnessOfBreath: 0,
      hasWheezing: false,
      activityLevel: 1, // Moderate
      weeklyExerciseFreq: 3,
      fruitIntake: 4,
      cookedVegIntake: 3,
      rawVegIntake: 2,
      redMeatIntake: 2, // 1/week
      processedMeatIntake: 0, // Never
      oilyFishIntake: 2,
      sugaryBeverageIntake: 0
    };
  }

  return {
    id,
    name,
    age,
    gender: id === '555' || id === '222' ? 'Female' : 'Male',
    height: 170,
    weight: 65,
    diagnosis,
    currentTreatment: treatment,
    ukbProfile, // Inject UKB Data
    messages: [
      {
        id: 'msg-1',
        sender: 'DOCTOR',
        content: `你好，${name}。请记得按时记录每日的身体状况，这对调整治疗方案很有帮助。`,
        timestamp: getDateMonthsAgo(0),
        isRead: false
      }
    ],
    history: {
      reports: generateHistoricalReports(id, treatment),
      checkIns: [
        {
          date: getYesterday(), // Set to YESTERDAY to allow "Start Check-in" flow today
          temperature: 36.8,
          weight: 64.5,
          dtScore: 2,
          medicationAdherence: 'Taken',
          hadsResult: {
            anxietyScore: 3,
            anxietyLevel: 'Normal',
            depressionScore: 2,
            depressionLevel: 'Normal'
          },
          symptomLog: [],
          mood: 'Good',
          notes: '状态不错。'
        }
      ]
    }
  };
};

// Generate the 5 specific patients
export const MOCK_PATIENTS: PatientProfile[] = [
  createPatient('888', '张伟', 54, '非小细胞肺癌 III期', TreatmentPlan.CHEMO_PLATINUM),
  createPatient('555', '王丽', 48, '肺腺癌 IV期', TreatmentPlan.TARGETED_EGFR),
  createPatient('333', '赵一', 62, '鳞状细胞癌 IIB期', TreatmentPlan.IMMUNO_PD1),
  createPatient('222', '沈二', 35, '小细胞肺癌 局限期', TreatmentPlan.RADIO),
  createPatient('111', '马三', 71, '非小细胞肺癌 IB期', TreatmentPlan.NONE),
];

// Doctor account check
export const DOCTOR_CREDENTIALS = { id: '000', pass: '000', name: '李华' };