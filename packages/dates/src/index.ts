import omer2025 from './omer_2025.json'

interface OmerDay {
  diaDoOmer: number;
  semanasDias: string;
  dataJudaica: string;
  dataGregoriana: string;
  pronuncia: string;
  observacoes: string;
}

function getTodayDateFormated(): string {
  return new Date().toLocaleDateString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

export async function getOmerToday(): Promise<OmerDay | null> {
  const today = getTodayDateFormated();
  const diaOmer = omer2025.find(item => item.dataGregoriana.toLowerCase() === today.toLowerCase());

  return diaOmer ?? null;
}