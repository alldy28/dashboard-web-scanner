/* eslint-disable @typescript-eslint/no-explicit-any */

// Memberi tahu TypeScript agar mengenali tag A-Frame.
declare namespace JSX {
  interface IntrinsicElements {
    'a-scene': any;
    'a-assets': any;
    'a-camera': any;
    'a-entity': any;
    'a-plane': any;
  }
}
