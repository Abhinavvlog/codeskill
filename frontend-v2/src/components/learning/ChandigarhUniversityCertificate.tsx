"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

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
    data.verificationUrl ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/verify/${data.credentialId}`
      : `https://codeskill.chandigarhuniversity.ac.in/verify/${data.credentialId}`);

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
      className={`relative w-full max-w-[840px] mx-auto bg-[#faf9f6] text-slate-900 shadow-2xl rounded-xl overflow-hidden print:m-0 print:p-0 print:w-full print:max-w-none print:shadow-none print:rounded-none select-none ${className}`}
      style={{
        boxShadow:
          "0 20px 40px -10px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(180, 83, 9, 0.25)",
      }}
    >
      {/* Outer Ornate Double Border - Traditional Academic Diploma Frame */}
      <div className="p-3 sm:p-4 border-[7px] border-[#881337] relative bg-[#fdfbf7]">
        {/* Inner Gold Filigree Inset Border */}
        <div className="relative border-2 border-[#b45309] p-4 sm:p-5 md:p-6 bg-white/90 backdrop-blur-sm">
          {/* Corner Flourishes */}
          <div className="absolute top-1.5 left-1.5 w-6 h-6 border-t-2 border-l-2 border-[#b45309]" />
          <div className="absolute top-1.5 right-1.5 w-6 h-6 border-t-2 border-r-2 border-[#b45309]" />
          <div className="absolute bottom-1.5 left-1.5 w-6 h-6 border-b-2 border-l-2 border-[#b45309]" />
          <div className="absolute bottom-1.5 right-1.5 w-6 h-6 border-b-2 border-r-2 border-[#b45309]" />

          {/* Authentic Watermark: Chandigarh University Official Seal in Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none overflow-hidden">
            <img
              src="/cu-seal.png"
              alt="Chandigarh University Watermark Seal"
              className="w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] object-contain select-none"
            />
          </div>

          {/* Header Section: Official University Logo & Authentic Hierarchy */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-1.5">
            {/* Top Accreditations & Badges Strip */}
            <div className="w-full flex items-center justify-between px-2 pb-1 border-b border-amber-600/20 text-[9px] sm:text-[10px] font-bold text-amber-900 tracking-wider uppercase">
              <span className="flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600" />
                NAAC Grade A+ Accredited
              </span>
              <span className="hidden sm:inline text-amber-700/80">
                UGC Recognized · NIRF Top Ranked
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Autonomous University
              </span>
            </div>

            {/* University Emblem & Official Name */}
            <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full p-1 bg-white border-2 border-amber-500/50 shadow-xs flex items-center justify-center">
                <img
                  src="/cu-logo.png"
                  alt="Chandigarh University Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-black tracking-widest text-[#7f1d1d] uppercase leading-tight">
                  CHANDIGARH UNIVERSITY
                </h1>
                <p className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-amber-900 uppercase">
                  NH-05, Chandigarh-Ludhiana Highway, Mohali, Punjab - 140413
                </p>
                <p className="text-[9.5px] sm:text-[10px] font-medium text-slate-600 tracking-wide">
                  Department of Computer Science & Engineering · Apex Institute of Technology
                </p>
              </div>
            </div>
          </div>

          {/* Certificate Title Banner */}
          <div className="relative z-10 text-center my-3 sm:my-3.5">
            <div className="inline-flex items-center gap-2.5">
              <span className="h-[1.5px] w-8 sm:w-14 bg-gradient-to-r from-transparent to-[#b45309]" />
              <h2 className="text-xs sm:text-sm md:text-base font-serif font-extrabold uppercase tracking-widest text-slate-800">
                Certificate of Excellence
              </h2>
              <span className="h-[1.5px] w-8 sm:w-14 bg-gradient-to-l from-transparent to-[#b45309]" />
            </div>
            <p className="text-[11px] sm:text-xs italic font-serif text-slate-600 mt-0.5">
              This academic credential certifies that
            </p>
          </div>

          {/* Recipient Full Name */}
          <div className="relative z-10 text-center py-1 border-b-2 border-[#b45309]/30 max-w-lg mx-auto">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif font-extrabold tracking-wide text-[#7f1d1d] drop-shadow-xs capitalize">
              {data.recipientName || "Mustakim Shaikh"}
            </h3>
          </div>

          {/* Citation & Learning Path Title */}
          <div className="relative z-10 text-center max-w-xl mx-auto mt-2.5 space-y-2">
            <p className="text-[11px] sm:text-xs text-slate-700 leading-snug font-sans">
              has successfully fulfilled all institutional criteria, algorithmic lab benchmarks, and rigorous technical evaluations in
            </p>

            <div className="inline-block px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/50 shadow-xs">
              <span className="text-sm sm:text-base md:text-lg font-bold font-serif text-slate-900 tracking-tight">
                {data.learningPath}
              </span>
            </div>

            {data.grade && (
              <div className="text-[10.5px] sm:text-[11.5px] font-semibold text-emerald-800 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Graduated with Distinction · {data.grade}</span>
              </div>
            )}
          </div>

          {/* Verified Competencies */}
          {data.skills && data.skills.length > 0 && (
            <div className="relative z-10 text-center mt-2.5">
              <div className="flex flex-wrap justify-center gap-1.5 max-w-lg mx-auto">
                {data.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-amber-50/80 text-amber-950 border border-amber-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lower Credentials Row: QR Code, Official Seal Image, & Academic Signatures */}
          <div className="relative z-10 grid grid-cols-3 items-end gap-3 sm:gap-4 pt-3.5 mt-3.5 border-t border-[#b45309]/30">
            {/* Left: Dynamic Verification QR Code */}
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
              <div className="mt-1 space-y-0.5">
                <p className="text-[8.5px] font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 inline" />
                  <span>University Verified</span>
                </p>
                <p className="text-[8.5px] font-mono text-slate-700 font-bold truncate max-w-[120px]">
                  {data.credentialId}
                </p>
                <p className="text-[8px] text-slate-500">{formattedDate}</p>
              </div>
            </div>

            {/* Middle: Official Embossed Gold Medallion with Direct Chandigarh University Seal */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 p-1 shadow-md border-2 border-amber-600 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-white border border-amber-800/40 flex items-center justify-center p-1 overflow-hidden shadow-inner">
                  <img
                    src="/cu-seal.png"
                    alt="Chandigarh University Official Seal"
                    className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  />
                </div>
              </div>
              <div className="mt-1 text-center">
                <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider text-[#78350f] block leading-tight">
                  OFFICIAL SEAL
                </span>
                <span className="text-[6.5px] sm:text-[7px] font-bold text-amber-800 uppercase block leading-tight">
                  CHANDIGARH UNIVERSITY
                </span>
              </div>
            </div>

            {/* Right: Academic Signatures */}
            <div className="flex flex-col items-end text-right space-y-2">
              <div className="w-32 sm:w-44 text-center">
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

              <div className="w-32 sm:w-44 text-center">
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
                    Director, Computer Science · CodeSkill
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Microprint Security String */}
          <div className="relative z-10 pt-2.5 mt-2 border-t border-amber-600/10 flex items-center justify-between text-[7px] sm:text-[7.5px] text-slate-500 font-mono">
            <span>REG: CU-CS-DEPT-ACCREDITED</span>
            <span className="hidden sm:inline">AUTHENTIC DIGITAL ATTESTATION · TAMPER EVIDENT VERIFICATION</span>
            <span>CHANDIGARH UNIVERSITY · PUNJAB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
