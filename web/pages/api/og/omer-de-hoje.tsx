import { ImageResponse } from '@vercel/og';
import { PageConfig } from 'next';
import { NextRequest } from 'next/server';

export const config: PageConfig = {
  runtime: 'edge',
};
 
export default async function handler(request: NextRequest) {
  const width = 1200;
  const height = 720;
      
  const diaDoOmer = request.nextUrl.searchParams.get('diaDoOmer')
  const dataGregoriana = request.nextUrl.searchParams.get('dataGregoriana')
  const dataJudaica = request.nextUrl.searchParams.get('dataJudaica')
  const semanasDias = request.nextUrl.searchParams.get('semanasDias')
  const pronuncia = request.nextUrl.searchParams.get('pronuncia')
  
  if (!diaDoOmer || !dataGregoriana || !dataJudaica || !semanasDias || !pronuncia) {
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%' }} />,
      { width, height },
    );
  }
  
  const backgroundUrl = new URL('/images/shavuot.jpeg', request.url).toString()
  
  return new ImageResponse(
    (
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 60,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
      }}>
        <img
          src={backgroundUrl}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(10px)',  
            zIndex: 0,
          }}
        />
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '80px' }}>Contagem do Omer</span>
          <span style={{ margin: '20px 0', fontSize: '40px' }}>{dataGregoriana} - {dataJudaica}</span>
          <span style={{ fontSize: '30px' }}>{diaDoOmer} do Ômer</span>
          <span style={{ fontSize: '30px' }}>Hoje são {semanasDias} do Ômer.</span>
          <span style={{ fontSize: '30px' }}>{pronuncia}</span>
        </div>
      </div>
    ),
    {
      width,
      height,
      headers: {
        'Cache-Control': 'no-cache, no-store',
      },
    },
  );
}