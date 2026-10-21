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
        width: 180,
        margin: 1,
        color: {
          dark: "#1e1b4b", // deep indigo/navy
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
      className={`relative w-full max-w-5xl mx-auto bg-[#faf9f6] text-slate-900 shadow-2xl rounded-2xl overflow-hidden print:m-0 print:p-0 print:w-full print:max-w-none print:shadow-none print:rounded-none select-none ${className}`}
      style={{
        boxShadow:
          "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(180, 83, 9, 0.2)",
      }}
    >
      {/* Outer Ornate Double Border */}
      <div className="p-4 sm:p-7 md:p-9 border-[10px] border-[#991b1b] relative bg-[#fdfbf7]">
        {/* Inner Gold Filigree Inset Border */}
        <div className="relative border-2 border-[#b45309] p-6 sm:p-8 md:p-10 bg-white/80 backdrop-blur-sm">
          {/* Corner Flourishes */}
          <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-[#b45309]" />
          <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-[#b45309]" />
          <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-[#b45309]" />
          <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-[#b45309]" />

          {/* Watermark Crest in Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none overflow-hidden">
            <svg viewBox="0 0 200 200" className="w-[450px] h-[450px] text-[#991b1b]" fill="currentColor">
              <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="4" />
              <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
              <path d="M100 25 L120 70 L170 75 L130 110 L142 160 L100 135 L58 160 L70 110 L30 75 L80 70 Z" />
            </svg>
          </div>

          {/* Header: Chandigarh University Crest & Typography */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              {/* Official Seal / Monogram Emblem */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#991b1b] to-[#7f1d1d] p-1 shadow-md flex items-center justify-center text-amber-300 border-2 border-amber-400">
                <svg viewBox="0 0 100 100" className="w-12 h-12 sm:w-14 sm:h-14 fill-current">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#fef08a" strokeWidth="3" />
                  <path d="M50 15 L62 40 L88 43 L68 62 L74 87 L50 73 L26 87 L32 62 L12 43 L38 40 Z" fill="#fde047" opacity="0.9" />
                  <text x="50" y="58" textAnchor="middle" fill="#7f1d1d" fontSize="22" fontWeight="900" fontFamily="serif">CU</text>
                </svg>
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black tracking-widest text-[#7f1d1d] uppercase">
                CHANDIGARH UNIVERSITY
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold tracking-wider text-amber-800 uppercase">
                NH-05, Ludhiana - Chandigarh Highway, Mohali, Punjab · NAAC A+ Accredited
              </p>
              <p className="text-[10px] sm:text-[11px] font-medium tracking-wide text-slate-600">
                Department of Computer Science & Engineering · Centre for Professional & Skill Development
              </p>
              <div className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-amber-100 text-amber-900 border border-amber-300 mt-1">
                CodeSkill Technical Education & Competency Verification Ledger
              </div>
            </div>
          </div>

          {/* Certificate Title Banner */}
          <div className="relative z-10 text-center my-6 sm:my-8">
            <div className="inline-flex items-center gap-3">
              <span className="h-[2px] w-8 sm:w-16 bg-gradient-to-r from-transparent to-[#b45309]" />
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-extrabold uppercase tracking-widest text-slate-800">
                Certificate of Excellence
              </h2>
              <span className="h-[2px] w-8 sm:w-16 bg-gradient-to-l from-transparent to-[#b45309]" />
            </div>
            <p className="text-xs sm:text-sm italic font-serif text-slate-600 mt-2">
              This credential is proud recognition that
            </p>
          </div>

          {/* Recipient Full Name */}
          <div className="relative z-10 text-center py-2 sm:py-3 border-b-2 border-[#b45309]/30 max-w-xl mx-auto">
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif font-extrabold tracking-wide text-[#7f1d1d] drop-shadow-sm capitalize">
              {data.recipientName || "Mustakim Shaikh"}
            </h3>
          </div>

          {/* Citation & Path Title */}
          <div className="relative z-10 text-center max-w-2xl mx-auto mt-4 sm:mt-5 space-y-3">
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
              has successfully completed all required engineering modules, algorithmic challenges, and passed the official comprehensive evaluations with verified distinction in
            </p>

            <div className="inline-block px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border-2 border-amber-500/40 shadow-inner">
              <span className="text-base sm:text-xl md:text-2xl font-bold font-serif text-slate-900 tracking-tight">
                {data.learningPath}
              </span>
            </div>

            {data.grade && (
              <div className="text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Awarded with {data.grade}</span>
              </div>
            )}
          </div>

          {/* Verified Competencies */}
          {data.skills && data.skills.length > 0 && (
            <div className="relative z-10 text-center mt-5">
              <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider text-slate-500 block mb-1.5">
                Demonstrated Engineering Competencies
              </span>
              <div className="flex flex-wrap justify-center gap-1.5 max-w-xl mx-auto">
                {data.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lower Section: QR Code, Gold Seal & Signatures */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 items-end gap-6 sm:gap-8 pt-8 sm:pt-10 mt-6 border-t border-[#b45309]/20">
            {/* Left: Auto Generated QR Code */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="p-1.5 bg-white border-2 border-slate-300 rounded-lg shadow-sm">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Certificate Verification QR Code"
                    className="w-24 h-24 sm:w-28 sm:h-28"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-100 animate-pulse flex items-center justify-center text-[10px] text-slate-400">
                    Generating QR...
                  </div>
                )}
              </div>
              <div className="mt-2 space-y-0.5">
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                  <span>Scan to Verify</span>
                </p>
                <p className="text-[10px] font-mono text-slate-600 font-bold">
                  ID: {data.credentialId}
                </p>
                <p className="text-[9px] text-slate-500">Issued: {formattedDate}</p>
              </div>
            </div>

            {/* Middle: Official Embossed Gold Seal */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 p-1 shadow-lg border-2 border-amber-600 flex items-center justify-center">
                {/* Scalloped outer edge effect */}
                <div className="w-full h-full rounded-full border border-amber-800/40 flex flex-col items-center justify-center p-2 text-[#78350f] text-center">
                  <Award className="w-6 h-6 sm:w-7 sm:h-7 text-[#78350f] mb-0.5" />
                  <span className="text-[8px] font-extrabold uppercase tracking-tight leading-tight">
                    Chandigarh University
                  </span>
                  <span className="text-[7px] font-bold tracking-widest text-[#92400e]">
                    OFFICIAL SEAL
                  </span>
                  <span className="text-[6.5px] font-black text-amber-950 uppercase mt-0.5">
                    NAAC A+ GRADE
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-semibold text-amber-900 uppercase tracking-widest mt-1">
                Authentic Credential
              </span>
            </div>

            {/* Right: Authorized Academic Signatures */}
            <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-4">
              {/* Signatory 1 */}
              <div className="w-48 sm:w-56 text-center">
                <div className="h-10 flex items-end justify-center mb-1">
                  {/* Vector Cursive Signature */}
                  <svg viewBox="0 0 160 40" className="w-36 h-9 text-slate-800 fill-none stroke-current stroke-[1.8]">
                    <path d="M10 28 Q 30 5, 50 25 T 90 20 T 120 15 T 150 26 M 35 15 L 75 12" />
                  </svg>
                </div>
                <div className="border-t border-slate-700/80 pt-1">
                  <div className="text-xs font-bold text-slate-900">
                    Prof. (Dr.) Manpreet Singh
                  </div>
                  <div className="text-[10px] text-slate-600">
                    Dean, Academic Affairs & Engineering
                  </div>
                  <div className="text-[9px] font-semibold text-amber-800">
                    Chandigarh University
                  </div>
                </div>
              </div>

              {/* Signatory 2 */}
              <div className="w-48 sm:w-56 text-center">
                <div className="h-10 flex items-end justify-center mb-1">
                  {/* Vector Cursive Signature */}
                  <svg viewBox="0 0 160 40" className="w-36 h-9 text-slate-800 fill-none stroke-current stroke-[1.8]">
                    <path d="M15 25 Q 40 10, 65 24 T 105 18 T 135 25 M 50 18 Q 80 5, 110 22" />
                  </svg>
                </div>
                <div className="border-t border-slate-700/80 pt-1">
                  <div className="text-xs font-bold text-slate-900">
                    Dr. Gurpreet Singh
                  </div>
                  <div className="text-[10px] text-slate-600">
                    Director, Technical Training & Research
                  </div>
                  <div className="text-[9px] font-semibold text-indigo-900">
                    CodeSkill Centre of Excellence
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
