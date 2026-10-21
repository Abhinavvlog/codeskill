"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ShieldCheck, Award } from "lucide-react";

export interface CertificateData {
  credentialId: string;
  recipientName: string;
  learningPath: string;
  issuedAt?: string;
  issuer?: string;
  institution?: string;
  department?: string;
  accreditation?: string;
  grade?: string;
  skills?: string[];
  estimatedHours?: number;
  verificationUrl?: string;
}

interface ChandigarhUniversityCertificateProps {
  data: CertificateData;
  className?: string;
}

export function ChandigarhUniversityCertificate({
  data,
  className = "",
}: ChandigarhUniversityCertificateProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  const verificationUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verify/${data.credentialId}`
      : `https://codeskill.chandigarhuniversity.ac.in/verify/${data.credentialId}`;

  useEffect(() => {
    if (data.credentialId) {
      QRCode.toDataURL(verificationUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: "#1e1b4b",
          light: "#ffffff",
        },
      })
        .then(setQrCodeUrl)
        .catch((err) => {
          console.error("Failed to generate QR code", err);
        });
    }
  }, [data.credentialId, verificationUrl]);

  const formattedDate = data.issuedAt
    ? new Date(data.issuedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <div
      className={`relative w-full max-w-[820px] mx-auto bg-[#faf9f6] text-slate-900 shadow-xl rounded-xl overflow-hidden print:m-0 print:p-0 print:w-full print:max-w-none print:shadow-none print:rounded-none select-none ${className}`}
      style={{
        boxShadow:
          "0 15px 35px -8px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(180, 83, 9, 0.2)",
      }}
    >
      {/* Outer Ornate Double Border - Standard Diploma Proportions */}
      <div className="p-2.5 sm:p-3.5 border-[6px] border-[#991b1b] relative bg-[#fdfbf7]">
        {/* Inner Gold Filigree Inset Border */}
        <div className="relative border-2 border-[#b45309] p-4 sm:p-5 md:p-6 bg-white/85 backdrop-blur-sm">
          {/* Corner Flourishes */}
          <div className="absolute top-1.5 left-1.5 w-5 h-5 border-t-2 border-l-2 border-[#b45309]" />
          <div className="absolute top-1.5 right-1.5 w-5 h-5 border-t-2 border-r-2 border-[#b45309]" />
          <div className="absolute bottom-1.5 left-1.5 w-5 h-5 border-b-2 border-l-2 border-[#b45309]" />
          <div className="absolute bottom-1.5 right-1.5 w-5 h-5 border-b-2 border-r-2 border-[#b45309]" />

          {/* Watermark Crest in Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
            <svg viewBox="0 0 200 200" className="w-[300px] h-[300px] text-[#991b1b]" fill="currentColor">
              <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="4" />
              <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
              <path d="M100 25 L120 70 L170 75 L130 110 L142 160 L100 135 L58 160 L70 110 L30 75 L80 70 Z" />
            </svg>
          </div>

          {/* Header: Chandigarh University Crest & Typography */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              {/* Official Seal / Monogram Emblem */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#991b1b] to-[#7f1d1d] p-0.5 shadow-sm flex items-center justify-center text-amber-300 border border-amber-400">
                <svg viewBox="0 0 100 100" className="w-8 h-8 sm:w-9 sm:h-9 fill-current">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#fef08a" strokeWidth="3" />
                  <path d="M50 15 L62 40 L88 43 L68 62 L74 87 L50 73 L26 87 L32 62 L12 43 L38 40 Z" fill="#fde047" opacity="0.9" />
                  <text x="50" y="58" textAnchor="middle" fill="#7f1d1d" fontSize="22" fontWeight="900" fontFamily="serif">CU</text>
                </svg>
              </div>
            </div>

            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-serif font-black tracking-widest text-[#7f1d1d] uppercase leading-tight">
                CHANDIGARH UNIVERSITY
              </h1>
              <p className="text-[9.5px] sm:text-[10.5px] font-semibold tracking-wider text-amber-800 uppercase">
                NH-05, Mohali, Punjab · NAAC A+ Accredited · Department of Computer Science & Engineering
              </p>
            </div>
          </div>

          {/* Certificate Title Banner */}
          <div className="relative z-10 text-center my-2.5 sm:my-3">
            <div className="inline-flex items-center gap-2">
              <span className="h-[1.5px] w-6 sm:w-10 bg-gradient-to-r from-transparent to-[#b45309]" />
              <h2 className="text-xs sm:text-sm md:text-base font-serif font-extrabold uppercase tracking-widest text-slate-800">
                Certificate of Excellence
              </h2>
              <span className="h-[1.5px] w-6 sm:w-10 bg-gradient-to-l from-transparent to-[#b45309]" />
            </div>
            <p className="text-[11px] sm:text-xs italic font-serif text-slate-600 mt-0.5">
              This credential certifies that
            </p>
          </div>

          {/* Recipient Full Name */}
          <div className="relative z-10 text-center py-1 border-b border-[#b45309]/30 max-w-md mx-auto">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-extrabold tracking-wide text-[#7f1d1d] drop-shadow-sm capitalize">
              {data.recipientName || "Mustakim Shaikh"}
            </h3>
          </div>

          {/* Citation & Path Title */}
          <div className="relative z-10 text-center max-w-xl mx-auto mt-2 space-y-1.5">
            <p className="text-[11px] sm:text-xs text-slate-700 leading-snug font-sans">
              has completed all technical curricula, algorithmic challenges, and passed comprehensive evaluations in
            </p>

            <div className="inline-block px-4 py-1 rounded-lg bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border border-amber-500/40">
              <span className="text-xs sm:text-sm md:text-base font-bold font-serif text-slate-900 tracking-tight">
                {data.learningPath}
              </span>
            </div>

            {data.grade && (
              <div className="text-[10px] sm:text-[11px] font-semibold text-emerald-800 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Awarded with {data.grade}</span>
              </div>
            )}
          </div>

          {/* Verified Competencies */}
          {data.skills && data.skills.length > 0 && (
            <div className="relative z-10 text-center mt-2">
              <div className="flex flex-wrap justify-center gap-1 max-w-lg mx-auto">
                {data.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lower Section: QR Code, Gold Seal & Signatures in Compact Single Row */}
          <div className="relative z-10 grid grid-cols-3 items-end gap-3 sm:gap-4 pt-3 mt-3 border-t border-[#b45309]/20">
            {/* Left: Auto Generated QR Code */}
            <div className="flex flex-col items-start text-left">
              <div className="p-1 bg-white border border-slate-300 rounded shadow-xs">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Certificate Verification QR Code"
                    className="w-14 h-14 sm:w-16 sm:h-16"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 animate-pulse flex items-center justify-center text-[8px] text-slate-400">
                    QR...
                  </div>
                )}
              </div>
              <div className="mt-1 space-y-0.2">
                <p className="text-[8.5px] font-bold text-slate-800 uppercase tracking-tight flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 inline" />
                  <span>Verified</span>
                </p>
                <p className="text-[8.5px] font-mono text-slate-600 font-bold truncate max-w-[110px]">
                  {data.credentialId}
                </p>
                <p className="text-[8px] text-slate-500">{formattedDate}</p>
              </div>
            </div>

            {/* Middle: Official Embossed Gold Seal */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 p-0.5 shadow-md border border-amber-600 flex items-center justify-center">
                <div className="w-full h-full rounded-full border border-amber-800/40 flex flex-col items-center justify-center p-1 text-[#78350f] text-center">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#78350f]" />
                  <span className="text-[6.5px] sm:text-[7.5px] font-extrabold uppercase tracking-tight leading-none mt-0.5">
                    Chandigarh Univ
                  </span>
                  <span className="text-[6px] font-bold tracking-widest text-[#92400e]">
                    OFFICIAL SEAL
                  </span>
                  <span className="text-[5.5px] font-black text-amber-950 uppercase">
                    NAAC A+
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Academic Signatures */}
            <div className="flex flex-col items-end text-right space-y-2">
              <div className="w-32 sm:w-40 text-center">
                <div className="h-6 flex items-end justify-center mb-0.5">
                  <svg viewBox="0 0 160 30" className="w-24 sm:w-28 h-5 text-slate-800 fill-none stroke-current stroke-[1.8]">
                    <path d="M10 22 Q 30 5, 50 20 T 90 15 T 120 12 T 150 20 M 35 12 L 75 10" />
                  </svg>
                </div>
                <div className="border-t border-slate-700/80 pt-0.5">
                  <div className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-900 leading-tight">
                    Prof. (Dr.) Manpreet Singh
                  </div>
                  <div className="text-[8px] sm:text-[8.5px] text-slate-600 leading-tight">
                    Dean, Academic Affairs · CU
                  </div>
                </div>
              </div>

              <div className="w-32 sm:w-40 text-center">
                <div className="h-6 flex items-end justify-center mb-0.5">
                  <svg viewBox="0 0 160 30" className="w-24 sm:w-28 h-5 text-slate-800 fill-none stroke-current stroke-[1.8]">
                    <path d="M15 20 Q 40 8, 65 18 T 105 14 T 135 20 M 50 14 Q 80 5, 110 18" />
                  </svg>
                </div>
                <div className="border-t border-slate-700/80 pt-0.5">
                  <div className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-900 leading-tight">
                    Dr. Gurpreet Singh
                  </div>
                  <div className="text-[8px] sm:text-[8.5px] text-slate-600 leading-tight">
                    Director · CodeSkill
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
