// components/MindArViewer.tsx

"use client";

// Impor React Hooks
import React, { useEffect, useRef, useState } from "react";
// Import A-Frame dan MindAR
import "aframe";
import "mind-ar/dist/mindar-image-aframe.prod.js";

// Import file CSS Module
import styles from "./MindArViewer.module.css";

/**
 * Komponen viewer AR dengan viewfinder di tengah.
 */
export default function MindArViewer() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sceneRef = useRef<any>(null); // Ref untuk <a-scene>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const targetRef = useRef<any>(null); // Ref untuk <a-entity> target

  // State untuk mengontrol UI (tombol start vs viewfinder)
  const [isScanning, setIsScanning] = useState(false);

  // ========================================================================
  // 1. PERBAIKAN VIDEO FULLSCREEN (KAMERA)
  // Memaksa <video> feed kamera agar fullscreen dan menimpa inline style
  // ========================================================================
  useEffect(() => {
    const sceneEl = sceneRef.current;
    if (!sceneEl) return;

    const fixVideoStyle = () => {
      const videoEl = document.querySelector<HTMLVideoElement>(
        'video[style*="z-index: -2"]'
      );
      if (videoEl) {
        videoEl.style.width = "100%";
        videoEl.style.height = "100%";
        videoEl.style.position = "absolute";
        videoEl.style.top = "0px";
        videoEl.style.left = "0px";
        videoEl.style.objectFit = "cover";
        if (videoEl.style.left === "0px" && videoEl.style.width === "100%") {
          return true;
        }
      }
      return false;
    };

    const intervalId = setInterval(fixVideoStyle, 100);
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
    }, 10000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, []); // [] = jalankan sekali saat komponen dimuat

  // ========================================================================
  // 2. KONTROL PEMUTARAN VIDEO AR (KONTEN)
  // Memutar/menghentikan video aset saat target ditemukan/hilang
  // ========================================================================
  useEffect(() => {
    const targetEntity = targetRef.current;
    if (!targetEntity) return;

    const videoAsset = document.querySelector<HTMLVideoElement>("#cardVideo");
    if (!videoAsset) {
      console.error("Aset video #cardVideo tidak ditemukan!");
      return;
    }

    const onTargetFound = () => {
      console.log("Target Ditemukan: Memutar video.");
      videoAsset.play();
    };

    const onTargetLost = () => {
      console.log("Target Hilang: Menghentikan video.");
      videoAsset.pause();
    };

    targetEntity.addEventListener("targetFound", onTargetFound);
    targetEntity.addEventListener("targetLost", onTargetLost);

    return () => {
      targetEntity.removeEventListener("targetFound", onTargetFound);
      targetEntity.removeEventListener("targetLost", onTargetLost);
    };
  }, []); // [] = jalankan sekali saat komponen dimuat

  // ========================================================================
  // 3. FUNGSI "MULAI SCAN" (Mengaktifkan Suara & Kamera)
  // ========================================================================
  const handleStartScan = () => {
    const sceneEl = sceneRef.current;
    const videoAsset = document.querySelector<HTMLVideoElement>("#cardVideo");

    if (!sceneEl || !videoAsset) {
      console.error("Scene atau Aset Video tidak ditemukan saat start");
      return;
    }

    // 1. KUNCI SUARA: Aktifkan suara (unmute) karena ada interaksi pengguna
    videoAsset.muted = false;

    // 2. "Prime" video agar siap diputar (opsional)
    videoAsset.play();
    videoAsset.pause();

    // 3. Mulai sistem MindAR (menyalakan kamera)
    const mindarSystem = sceneEl.systems["mindar-image-system"];
    if (mindarSystem) {
      mindarSystem.start();
    }

    // 4. Ubah UI dari tombol "Start" menjadi "Viewfinder"
    setIsScanning(true);
  };

  // ========================================================================
  // RENDER KOMPONEN
  // ========================================================================
  return (
    // Container utama
    <div className={styles.container}>
      {/* Scene A-Frame untuk AR */}
      <a-scene
        ref={sceneRef}
        // PENTING: autoStart: false (agar tidak langsung nyala)
        mindar-image="imageTargetSrc: /targets/bullion.mind; autoStart: false; maxTrack: 1; uiScanning: #scanningUI"
        embedded
        color-space="sRGB"
        renderer="colorManagement: true, physicallyCorrectLights"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
        className={styles.aScene}
      >
        <a-assets>
          {/* PENTING: Gunakan tag <video> 
            'autoplay' DIHAPUS, 'muted' & 'playsinline' TETAP ADA
          */}
          <video
            id="cardVideo"
            src="/splashSilver.mp4"
            crossOrigin="anonymous"
            loop
            muted
            playsInline
          ></video>
        </a-assets>

        <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

        <a-entity ref={targetRef} mindar-image-target="targetIndex: 0">
          <a-plane
            src="#cardVideo"
            position="0 0 0"
            height="3"
            width="2.1"
            rotation="0 0 0"
          ></a-plane>
        </a-entity>
      </a-scene>

      {/* UI Overlay */}
      <div id="scanningUI" className={styles.scanningUI}>
        {!isScanning ? (
          // 1. Tampilan Awal (Tombol Start)
          <button className={styles.startButton} onClick={handleStartScan}>
            Mulai Scan
          </button>
        ) : (
          // 2. Tampilan Saat Scanning (Viewfinder)
          <>
            <div className={styles.viewfinder}>
              <div className={`${styles.corner} ${styles.topLeft}`}></div>
              <div className={`${styles.corner} ${styles.topRight}`}></div>
              <div className={`${styles.corner} ${styles.bottomLeft}`}></div>
              <div className={`${styles.corner} ${styles.bottomRight}`}></div>
              <div className={styles.scanLine}></div>
            </div>
            <p className={styles.instructions}>
              Arahkan kamera ke logo untuk memindai
            </p>
          </>
        )}
      </div>

      {/* Tombol Kembali/Tutup */}
      <button
        onClick={() => window.history.back()}
        className={styles.closeButton}
        aria-label="Kembali"
      >
        &times;
      </button>
    </div>
  );
}
