
import { SpedData, SpedC100, SpedC500, SpedD100 } from '../types';

export const parseSpedFile = async (text: string): Promise<SpedData> => {
  const lines = text.split('\n');
  const data: SpedData = {
    c100: [],
    c500: [],
    c600: [],
    d100: []
  };

  let currentC010Cnpj = '';
  let currentD010Cnpj = '';
  let reg0000Cnpj = '';

  for (const line of lines) {
    const p = line.split('|');
    const tag = p[1];

    if (tag === '0000') {
      reg0000Cnpj = p[7] || ''; // CNPJ da entidade no 0000
    }

    if (tag === 'C010' || tag === '0140') {
      currentC010Cnpj = p[2] || reg0000Cnpj;
    }

    if (tag === 'D010') {
      currentD010Cnpj = p[2] || reg0000Cnpj;
    }

    if (tag === 'C100') {
      data.c100.push({
        cnpj: currentC010Cnpj || reg0000Cnpj,
        dtDoc: p[10], 
        indOper: parseInt(p[2]),
        vlDoc: parseFloat(p[12]?.replace(',', '.') || '0'),
        vlBcIcms: parseFloat(p[21]?.replace(',', '.') || '0'),
        vlIcms: parseFloat(p[22]?.replace(',', '.') || '0'),
        vlPis: parseFloat(p[24]?.replace(',', '.') || '0'),
        vlCofins: parseFloat(p[25]?.replace(',', '.') || '0'),
      });
    }

    if (tag === 'C500') {
      data.c500.push({
        cnpj: currentC010Cnpj || reg0000Cnpj,
        dtDoc: p[10],
        vlDoc: parseFloat(p[13]?.replace(',', '.') || '0'),
        vlBcIcms: parseFloat(p[18]?.replace(',', '.') || '0'),
        vlIcms: parseFloat(p[19]?.replace(',', '.') || '0'),
        vlPis: parseFloat(p[22]?.replace(',', '.') || '0'),
        vlCofins: parseFloat(p[23]?.replace(',', '.') || '0'),
      });
    }

    if (tag === 'C600') {
      data.c600.push({
        cnpj: currentC010Cnpj || reg0000Cnpj,
        dtDoc: p[5], 
        vlDoc: parseFloat(p[7]?.replace(',', '.') || '0'),
        vlBcIcms: 0, 
        vlIcms: 0,
        vlPis: parseFloat(p[22]?.replace(',', '.') || '0'),
        vlCofins: parseFloat(p[23]?.replace(',', '.') || '0'),
      });
    }

    if (tag === 'D100') {
      data.d100.push({
        cnpj: currentD010Cnpj || reg0000Cnpj,
        dtDoc: p[10],
        indOper: parseInt(p[2]),
        vlDoc: parseFloat(p[13]?.replace(',', '.') || '0'),
        vlBcIcms: parseFloat(p[18]?.replace(',', '.') || '0'),
        vlIcms: parseFloat(p[19]?.replace(',', '.') || '0'),
        vlPis: parseFloat(p[21]?.replace(',', '.') || '0'),
        vlCofins: parseFloat(p[22]?.replace(',', '.') || '0'),
      });
    }
  }

  return data;
};
