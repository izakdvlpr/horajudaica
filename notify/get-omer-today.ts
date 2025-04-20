import fs from 'fs';
import csv from 'csv-parser';

interface OmerDay {
  diaDoOmer: string;
  semanasDias: string;
  dataJudaica: string;
  dataGregoriana: string;
  pronuncia: string;
  observacoes?: string;
}

function getOmerData(): Promise<OmerDay[]> {
  return new Promise((resolve, reject) => {
    const results: OmerDay[] = [];

    fs.createReadStream('omer_2025.csv')
      .pipe(csv({
        separator: ',',
        headers: ['diaDoOmer', 'semanasDias', 'dataJudaica', 'dataGregoriana', 'pronuncia', 'observacoes'],
        skipLines: 1
      }))
      .on('data', (data: OmerDay) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function getTodayDateFormated(): string {
  return new Date().toLocaleDateString('pt-BR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

export async function getOmerToday(): Promise<OmerDay | null> {
  const omerData = await getOmerData();
  
  const today = getTodayDateFormated();
  const diaOmer = omerData.find(item => item.dataGregoriana.toLowerCase() === today.toLowerCase());

  return diaOmer ?? null;
}