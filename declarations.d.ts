// declarations.d.ts
// Place this file in your project root (same level as package.json)

import 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': any
      'a-marker': any
      'a-nft': any
      'a-entity': any
      'a-box': any
      'a-sphere': any
      'a-cylinder': any
      'a-plane': any
      'a-sky': any
      'a-camera': any
      'a-light': any
      'a-text': any
      'a-image': any
      'a-video': any
      'a-asset-item': any
      'a-assets': any
      'a-gltf-model': any
      'a-obj-model': any
      'a-collada-model': any
      'a-cursor': any
      'a-animation': any
    }
  }
}

// Extend HTMLVideoElement to support custom attributes
declare global {
  namespace JSX {
    interface IntrinsicElements {
      video: React.DetailedHTMLProps<
        React.VideoHTMLAttributes<HTMLVideoElement> & {
          crossOrigin?: string
          playsInline?: boolean
        },
        HTMLVideoElement
      >
    }
  }
}

// Kelebihan '}' SUDAH DIHAPUS dari sini
