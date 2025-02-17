export interface HouseGeneralInfo {
  name: string;
  number: string;
  surface: string;
  price: string;
  city: string;
  image: string;
  tokenPrice: string;
  expectedIncome: string;
  dateIncome: string;
  tokenIncome: string;
}

export interface HouseHighlights {
  tokenType: string;
  totalTokens: string;
  propertyType: string;
  fullAddress: string;
  source: string;
  neighborhood: string;
  constructionYear: string;
  bathrooms: string;
  rentalType: string;
  rented: string;
}

export interface HouseFinancials {
  grossIncomeYear: string;
  grossIncomeMonth: string;
  monthlyCost: string;
  netIncomeMonth: string;
  netIncomeYear: string;
  totalInvestment: string;
  expectedIncome: string;
}

export interface HouseDetails {
  lotSize: string;
  foundation: string;
  exteriors: string;
  roof: string;
  interiorSize: string;
  heating: string;
  buildingClass: string;
  renovated: string;
  propertyManager: string;
}

export interface HouseOffering {
  offeringDate: string;
  issuer: string;
  minInvestmentAmount: string;
  maxInvestmentAmount: string;
  amountRaised: string;
  offeringPercentage: string;
}

export interface House {
  id: string;
  general: HouseGeneralInfo;
  highlights: HouseHighlights;
  financials: HouseFinancials;
  details: HouseDetails;
  offering: HouseOffering;
}
