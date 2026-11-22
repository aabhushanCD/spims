export interface LookupRow {
  name: string;
  description: string;
}

export const DEFAULT_UNITS: LookupRow[] = [
  { name: "Tablet", description: "tablet" },
  { name: "Capsule", description: "capsule" },
  { name: "Bottle", description: "bottle" },
  { name: "Tube", description: "tube" },
  { name: "Sachet", description: "sachet" },
  { name: "Injection", description: "inject" },
  { name: "Vial", description: "vial" },
  { name: "Cream", description: "cream" },
  { name: "Syrup", description: "syrup" },
  { name: "Drops", description: "drops" },
];

export const DEFAULT_CATEGORIES: LookupRow[] = [
  { name: "Analgesic", description: "Pain relief" },
  { name: "Antibiotic", description: "Bacterial infections" },
  { name: "Antacid", description: "Gastric acid relief" },
  { name: "Antihistamine", description: "Allergy relief" },
  { name: "Antidiabetic", description: "Blood glucose control" },
  { name: "Cardiovascular", description: "Heart and blood pressure" },
  { name: "Respiratory", description: "Airway and breathing" },
  { name: "Vitamin", description: "Vitamins and supplements" },
  { name: "Dermatology", description: "Skin preparations" },
];

export const DEFAULT_BRANDS: LookupRow[] = [
  { name: "Generic", description: "Generic / unbranded" },
  { name: "SPIMS Default", description: "Default seed brand" },
];

export const DEFAULT_GENERIC_NAMES: LookupRow[] = [
  { name: "Paracetamol", description: "Analgesic and antipyretic" },
  { name: "Amoxicillin", description: "Penicillin antibiotic" },
  { name: "Omeprazole", description: "Proton-pump inhibitor" },
  { name: "Cetirizine", description: "Second-generation antihistamine" },
  { name: "Metformin", description: "Biguanide antidiabetic" },
  { name: "Amlodipine", description: "Calcium-channel blocker" },
  { name: "Salbutamol", description: "Short-acting bronchodilator" },
  { name: "Ascorbic acid", description: "Vitamin C" },
];
