import React, { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Gauge, BrickWall, UserCheck, KeyRound, FolderLock, Bug } from "lucide-react";

import cloudImage from "../../assets/cloud.png";
import TypeEffect from "../animations/TypeEffect";
import FeatureCard from "./FeatureCard";

const SCROLL_OFFSET = 120;

function Home() {
  const navigate = useNavigate();

  const features = useMemo(() => [
    {
      title: "Multi-Factor Authentication & JWT-Based Authorization",
      description: "Multi-Factor Authentication verifies user identity using credentials and a one-time password, while JWT-based authorization securely manages access to protected resources.",
      icon: <UserCheck className="h-10 w-10 text-cyan-300" />,
    },
    {
      title: "Client-Side AES-256 Encryption",
      description: "Data is encrypted on the user's device using AES-256 encryption with keys derived from the user's password, ensuring only you can access your data.",
      icon: <KeyRound className="h-10 w-10 text-cyan-300" />,
    },
    {
      title: "Multi-Layered Malware Detection System",
      description: "Files undergo multi-level malware scanning using ClamAV, YARA, and Cuckoo Sandbox, combining signature-based and behavioral analysis.",
      icon: <Bug className="h-10 w-10 text-cyan-300" />
    },
    {
      title: "Password-Protected Folder",
      description: "Allows users to secure selected folders with a password, ensuring that only authorized users can access the contents.",
      icon: <FolderLock className="h-10 w-10 text-cyan-300" />,
    },
    {
      title: "DoS Mitigation via Rate Limiting",
      description: "Implements controlled request thresholds per user or IP address to prevent excessive traffic and preserve system availability.",
      icon: <Gauge className="h-10 w-10 text-cyan-300" />,
    },
    {
      title: "Web Application Firewall (WAF) – Wafris",
      description: "Ensures real-time protection by filtering malicious traffic and blocking common web attacks, maintaining secure access.",
      icon: <BrickWall className="h-10 w-10 text-cyan-300" />,
    }
  ], []);

  const scrollToFeatures = useCallback(() => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      const elementPosition = featuresSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - SCROLL_OFFSET;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="w-full overflow-x-hidden">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row items-center max-h-6xl px-6 lg:pl-10 py-20">
        <div className="flex flex-col max-w-2xl p-3">
          <div className="flex flex-col gap-4 font-bold text-5xl md:text-6xl tracking-tight leading-tight">
            <span className="text-white">Secure</span>
            <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
              Cloud Storage
            </span>
            <span className="text-blue-600">Platform</span>
          </div>

          <div className="text-gray-300 text-2xl font-semibold max-w-xl leading-12 mt-5">
            <TypeEffect
              text="Store, manage, and access your files securely from anywhere in the world"
              typeSpeed={50}
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 md:gap-8 mt-8">
            <button 
              onClick={() => navigate("/register")}
              className="h-15 w-48 bg-cyan-400 rounded-md text-white font-semibold text-[20px] cursor-pointer hover:bg-cyan-300 hover:text-slate-800 transition-all hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(34,211,238,0.6)]"
            >
              Get Started
            </button>
            
            <button 
              onClick={scrollToFeatures}
              className="h-15 w-48 border-4 border-cyan-500 rounded-md text-cyan-500 font-semibold text-[20px] cursor-pointer relative overflow-hidden group transition-all hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]"
            >
              <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
              <span className="relative z-10">Learn More</span>
            </button>
          </div>
        </div>

        {/* Static Image Section (Optimized) */}
        <div className="relative ml-auto mt-12 lg:mt-0">
          <div className="relative">
            <img
              src={cloudImage}
              className="h-80 md:h-110 lg:h-130 w-auto object-contain drop-shadow-[0_0_40px_rgba(34,211,238,0.2)] select-none"
              alt="Secure Cloud"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full mt-20 pb-24" id="features">
        <div className="text-center px-4 mb-5">
          <h2 className="text-white text-3xl md:text-4xl font-bold">
            Comprehensive Security Architecture
          </h2>
          <p className="text-slate-300 mt-8 max-w-2xl mx-auto font-semibold text-[18px] md:text-[22px] leading-relaxed">
            Advanced multi-layered protection engineered to safeguard your digital life.
          </p>
        </div>

        <div className="flex flex-col gap-10 px-6 md:px-10 mt-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {features.slice(0, 4).map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-8 md:gap-10 lg:gap-[120px]">
            {features.slice(4, 6).map((feature, index) => (
              <FeatureCard key={index + 4} {...feature} />
            ))}
          </div>
        </div>
      </div>

      <div className="h-32" />
    </div>
  );
}

export default Home;