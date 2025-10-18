// Ini "mengajari" TypeScript bahwa tag A-Frame ada
// dan bisa menerima properti apa saja (any).
/* eslint-disable @typescript-eslint/no-explicit-any */


declare global {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': any;
      'a-assets': any;
      'a-camera': any;
      'a-entity': any;
      'a-plane': any;
    }
  }
}

// Baris ini diperlukan agar file ini dianggap sebagai "module"
export {};