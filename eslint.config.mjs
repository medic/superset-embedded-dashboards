import coreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  { ignores: ['.claude/', 'coverage/', 'scripts/', 'node_modules/'] },
  ...coreWebVitals,
  ...nextTypescript,
];

export default eslintConfig;
