declare module '*.css';
declare module '*.scss';
declare module '*.module.css';
declare module '*.module.scss';

interface ImportMeta {
  readonly env: { [key: string]: string | undefined };
}
