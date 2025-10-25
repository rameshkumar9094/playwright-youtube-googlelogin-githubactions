import * as fs from 'fs';
import { decrypt } from './encryptionHelper';

export const readJsonFile = (filePath: string): any => {
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(rawData);
  
  const encryptionKey: string | undefined = process.env.ENCRYPTION_KEY;
  
  if (data && typeof data === 'object') {
    Object.keys(data).forEach((env: string) => {
      if (data[env]?.credentials?.password) {
        const password: string = data[env].credentials.password;
        
        if (typeof password === 'string' && password.startsWith('encrypted:')) {
          if (!encryptionKey) {
            throw new Error(
              'ENCRYPTION_KEY environment variable is required to decrypt passwords. ' +
              'Set it with: export ENCRYPTION_KEY="your-key-here"'
            );
          }
          
          try {
            const encryptedData: string = password.substring('encrypted:'.length);
            data[env].credentials.password = decrypt(encryptedData, encryptionKey as string);
          } catch (error) {
            throw new Error(
              `Failed to decrypt password for ${env} environment. ` +
              'Verify ENCRYPTION_KEY is correct. Error: ' + (error as Error).message
            );
          }
        }
      }
    });
  }
  
  return data;
};
