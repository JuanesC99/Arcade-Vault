import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Sin esto Turbopack se va a buscar la raíz al directorio del usuario,
  // donde hay un package-lock.json viejo que no tiene nada que ver.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
