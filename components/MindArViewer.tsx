"use client";

import React, { useEffect, useRef } from "react";
// Import A-Frame dan MindAR.
import "aframe";
import "mind-ar/dist/mindar-image-aframe.prod.js";

// Import file CSS Module
import styles from "./MindArViewer.module.css";

/**
 * Komponen viewer AR dengan viewfinder di tengah.
 */
export default function MindArViewer() {
  const sceneRef = useRef<Element>(null); // Ref untuk <a-scene>
  const targetRef = useRef<Element>(null); // Ref untuk <a-entity> target

  // ========================================================================
  // 1. PERBAIKAN VIDEO FULLSCREEN (KAMERA)
  // Memaksa <video> feed kamera agar fullscreen dan menimpa inline style
  // ========================================================================
  useEffect(() => {
    const sceneEl = sceneRef.current;
    if (!sceneEl) return;

    // Fungsi untuk mencari dan memperbaiki style video feed
    const fixVideoStyle = () => {
      // Cari elemen <video> yang dibuat MindAR (z-index: -2)
      const videoEl = document.querySelector<HTMLVideoElement>(
        'video[style*="z-index: -2"]'
      );

      if (videoEl) {
        // Paksa ubah semua style yang bermasalah
        videoEl.style.width = "100%";
        videoEl.style.height = "100%";
        videoEl.style.position = "absolute";
        videoEl.style.top = "0px"; // Paksa ke 0
        videoEl.style.left = "0px"; // Paksa ke 0
        videoEl.style.objectFit = "cover"; // Agar tidak gepeng

        // Periksa apakah style sudah benar-benar berubah
        if (videoEl.style.left === "0px" && videoEl.style.width === "100%") {
          return true; // Perbaikan berhasil
        }
      }
      return false; // Video belum ditemukan
    };

    // Jalankan interval agresif untuk 'melawan' script MindAR
    const intervalId = setInterval(() => {
      fixVideoStyle();
    }, 100); // Coba perbaiki setiap 100 milidetik

    // Hentikan interval setelah 10 detik agar tidak boros resource
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
    }, 10000);

    // Bersihkan interval saat komponen ditutup (unmount)
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

    // Cari aset video di dalam <a-assets>
    const videoAsset = document.querySelector<HTMLVideoElement>("#cardVideo");
    if (!videoAsset) {
      console.error("Aset video #cardVideo tidak ditemukan!");
      return;
    }

    // Fungsi saat target (logo) ditemukan
    const onTargetFound = () => {
      console.log("Target Ditemukan: Memutar video.");
      videoAsset.play();
    };

    // Fungsi saat target (logo) hilang
    const onTargetLost = () => {
      console.log("Target Hilang: Menghentikan video.");
      videoAsset.pause();
      // Kita tidak setel currentTime = 0, agar video bisa lanjut saat terlihat lagi
    };

    targetEntity.addEventListener("targetFound", onTargetFound);
    targetEntity.addEventListener("targetLost", onTargetLost);

    // Bersihkan listener saat komponen ditutup
    return () => {
      targetEntity.removeEventListener("targetFound", onTargetFound);
      targetEntity.removeEventListener("targetLost", onTargetLost);
    };
  }, []); // [] = jalankan sekali saat komponen dimuat

  // ========================================================================
  // 3. KONTROL SUARA VIDEO AR (UNMUTE)
  // Mengaktifkan suara saat pengguna berinteraksi (klik)
  // ========================================================================
  useEffect(() => {
    // Targetkan UI overlay yang sedang tampil
    const scanningUI = document.getElementById("scanningUI");
    const videoAsset = document.querySelector<HTMLVideoElement>("#cardVideo");

    if (!scanningUI || !videoAsset) return;

    // Fungsi untuk meng-unmute
    const handleUnmute = () => {
      if (videoAsset.muted) {
        videoAsset.muted = false;
        console.log("Suara diaktifkan oleh interaksi pengguna.");
      }
      // Hapus listener setelah diklik sekali
      scanningUI.removeEventListener("click", handleUnmute);
    };

    // Tambahkan listener 'click'
    scanningUI.addEventListener("click", handleUnmute);

    // Bersihkan listener saat komponen ditutup
    return () => {
      scanningUI.removeEventListener("click", handleUnmute);
    };
  }, []); // [] = jalankan sekali saat komponen dimuat

  // ========================================================================

  return (
    // Container utama
    <div className={styles.container}>
      {/* Scene A-Frame untuk AR */}
      <a-scene
        ref={sceneRef}
        mindar-image="imageTargetSrc: /targets/logo.mind; autoStart: true; maxTrack: 1; uiScanning: #scanningUI"
        embedded
        color-space="sRGB"
        renderer="colorManagement: true, physicallyCorrectLights"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
        className={styles.aScene}
      >
        <a-assets>
          {/*
            PENTING: Gunakan tag <video>, BUKAN <img>.
            Atribut 'muted' WAJIB ada agar autoplay berfungsi di mobile.
          */}
          <video
            id="cardVideo"
            src="/splashSilver.mp4"
            crossOrigin="anonymous"
            autoPlay
            loop
            muted
            playsInline
          ></video>
        </a-assets>

        <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

        {/* Tambahkan 'ref={targetRef}' pada entitas target.
          Pastikan 'src' menunjuk ke ID video yang benar ('#cardVideo').
        */}
        <a-entity ref={targetRef} mindar-image-target="targetIndex: 0">
          <a-plane
            src="#cardVideo"
            position="0 0 0"
            height="1.380"
            width="1"
            rotation="0 0 0"
          ></a-plane>
        </a-entity>
      </a-scene>

      {/* UI Overlay */}
      <div id="scanningUI" className={styles.scanningUI}>
        {/* Kotak Viewfinder */}
        <div className={styles.viewfinder}>
          <div className={`${styles.corner} ${styles.topLeft}`}></div>
          <div className={`${styles.corner} ${styles.topRight}`}></div>
          <div className={`${styles.corner} ${styles.bottomLeft}`}></div>
          <div className={`${styles.corner} ${styles.bottomRight}`}></div>
          <div className={styles.scanLine}></div>
        </div>

        {/* Teks Instruksi (dengan info unmute) */}
        <p className={styles.instructions}>
          Arahkan kamera ke logo untuk memindai
          <br />
          <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>
            (Ketuk layar untuk mengaktifkan suara)
          </span>
        </p>
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
