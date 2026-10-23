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
          dark: "#0f172a",
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
      className={`relative w-full max-w-[840px] mx-auto bg-white text-slate-900 shadow-xl rounded-lg overflow-hidden print:m-0 print:p-0 print:w-full print:max-w-none print:shadow-none print:rounded-none select-none ${className}`}
      style={{
        boxShadow:
          "0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)",
      }}
    >
      {/* Outer Clean Security Border */}
      <div className="p-6 sm:p-10 md:p-12 relative bg-white">
        {/* Subtle Inner Hairline Border */}
        <div className="relative border border-slate-200/90 p-6 sm:p-8 md:p-10 bg-white">
          {/* Subtle Authentic University Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.025] pointer-events-none select-none overflow-hidden">
            <img
              src="/cu-emblem.png"
              alt=""
              className="w-[280px] h-[280px] object-contain"
            />
          </div>

          {/* Header Section: Minimalist, Industry-Standard Official Logo */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-2">
            <img
              src="/cu-logo-tight.png"
              alt="Chandigarh University"
              className="h-11 sm:h-13 w-auto object-contain"
            />

            <div className="space-y-0.5">
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-600 tracking-wider uppercase">
                Department of Computer Science & Engineering · Apex Institute of Technology
              </p>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium tracking-wide">
                NAAC Grade A+ Accredited · Approved by UGC · Mohali, Punjab, India
              </p>
            </div>

            {/* Subtle Divider */}
            <div className="w-16 h-[1.5px] bg-slate-300 mx-auto my-2" />
          </div>

          {/* Certificate Title */}
          <div className="relative z-10 text-center my-3 sm:my-4">
            <span className="text-[10.5px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Certificate of Completion
            </span>
            <p className="text-xs sm:text-sm font-serif italic text-slate-500 mt-1">
              This is to certify that
            </p>
          </div>

          {/* Recipient Full Name */}
          <div className="relative z-10 text-center py-1 max-w-lg mx-auto">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-slate-900 tracking-tight capitalize">
              {data.recipientName || "Mustakim Shaikh"}
            </h3>
            <div className="w-24 h-[1px] bg-amber-600/40 mx-auto mt-2" />
          </div>

          {/* Accomplishment & Curriculum Citation */}
          <div className="relative z-10 text-center max-w-xl mx-auto mt-3 space-y-2">
            <p className="text-xs sm:text-[13px] text-slate-600 font-normal leading-relaxed">
              has successfully fulfilled all institutional criteria, algorithmic lab benchmarks, and rigorous technical evaluations in
            </p>

            <div className="py-1">
              <span className="text-base sm:text-lg md:text-xl font-bold text-slate-900 tracking-tight">
                {data.learningPath}
              </span>
            </div>

            {data.grade && (
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Awarded with {data.grade}</span>
              </div>
            )}
          </div>

          {/* Verified Competencies */}
          {data.skills && data.skills.length > 0 && (
            <div className="relative z-10 text-center mt-3">
              <div className="flex flex-wrap justify-center gap-1.5 max-w-lg mx-auto">
                {data.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Academic Signatures & Institutional Seal Section */}
          <div className="relative z-10 grid grid-cols-3 items-end gap-4 pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-slate-200">
            {/* Left Signatory: Vice-Chancellor */}
            <div className="flex flex-col items-start text-left">
              <div className="w-36 sm:w-44 text-left">
                <div className="h-7 flex items-end justify-start mb-1">
                  <svg viewBox="0 0 160 30" className="w-24 sm:w-28 h-6 text-slate-800 fill-none stroke-current stroke-[1.8]">
                    <path d="M10 22 Q 30 5, 50 20 T 90 15 T 120 12 T 150 20 M 35 12 L 75 10" />
                  </svg>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-900 leading-tight">
                    Prof. (Dr.) Satbir Singh Sehgal
                  </div>
                  <div className="text-[8.5px] sm:text-[9px] text-slate-600 leading-tight">
                    Vice-Chancellor · Chandigarh University
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: Official University Embossed Seal */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white p-1 border border-slate-200 shadow-xs flex items-center justify-center">
                <img
                  src="/cu-emblem.png"
                  alt="Official University Seal"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-widest mt-1">
                Official Seal
              </span>
            </div>

            {/* Right Signatory: Head - Technical Training */}
            <div className="flex flex-col items-end text-right">
              <div className="w-36 sm:w-44 text-right">
                <div className="h-7 flex items-end justify-end mb-1">
                  <svg viewBox="0 0 160 30" className="w-24 sm:w-28 h-6 text-slate-800 fill-none stroke-current stroke-[1.8]">
                    <path d="M15 20 Q 40 8, 65 18 T 105 14 T 135 20 M 50 14 Q 80 5, 110 18" />
                  </svg>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-900 leading-tight">
                    Ishdeep Singla
                  </div>
                  <div className="text-[8.5px] sm:text-[9px] text-slate-600 leading-tight">
                    Head - Technical Training (CSE) · CU
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Minimalist Verification Bar: QR Code, Credential ID, Date */}
          <div className="relative z-10 pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[8.5px] sm:text-[9px] text-slate-500 font-mono">
            <div className="flex items-center gap-2">
              {qrCodeUrl && (
                <img
                  src={qrCodeUrl}
                  alt="Verification QR"
                  className="w-10 h-10 border border-slate-200 rounded p-0.5"
                />
              )}
              <div>
                <p className="font-bold text-slate-700 flex items-center gap-1 font-sans">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Officially Verified Credential</span>
                </p>
                <p className="font-mono text-slate-600">ID: {data.credentialId}</p>
                <p className="text-slate-400">Issued: {formattedDate}</p>
              </div>
            </div>

            <div className="text-right font-sans">
              <p className="text-slate-600 font-medium">Verify online:</p>
              <p className="font-mono text-[8px] text-slate-500 truncate max-w-[200px]">
                {verificationUrl}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
