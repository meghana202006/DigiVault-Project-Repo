import { Fingerprint, ShieldCheck , Gauge, BrickWall} from "lucide-react";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import cloudImage from "../../assets/cloud.png";
import TypeEffect from "../animations/TypeEffect";
import FeatureCard from "./FeatureCard";
import Navbar from "../shared/Navbar";

import { UserCheck , KeyRound , FolderLock , Bug} from "lucide-react";

function Home() {
  const navigate = useNavigate();
  const [isScrolling , setIsScrolling] = useState(false)

  useEffect(()=>{
    let timeoutId;

    const handleScroll = ()=>{
      setIsScrolling(true)

      clearTimeout(timeoutId)
      timeoutId = setTimeout(()=>{
          setIsScrolling(false)
      },150)
    }
    window.addEventListener("scroll",handleScroll)
    return ()=>{
      window.removeEventListener("scroll",handleScroll)
      clearTimeout(timeoutId)
    }
  },[])

  // Function to scroll to features section
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      // Get the position of the features section
      const elementPosition = featuresSection.getBoundingClientRect().top;
      // Get current scroll position
      const offsetPosition = elementPosition + window.pageYOffset;
      // Optional: Adjust offset to show more content (negative = scroll less, positive = scroll more)
      // For example, -100 would scroll 100px less, showing more of the section
      const scrollOffset = -120; // Adjust this value to control scroll position
      
      // Smooth scroll to the calculated position
      window.scrollTo({
        top: offsetPosition + scrollOffset,
        behavior: 'smooth'
      });
    }
  };

  const features = [
    {
      title: "Multi-Factor Authentication & JWT-Based Authorization",
      description:
        "Multi-Factor Authentication verifies user identity using credentials and a one-time password (possession), while JWT-based authorization securely manages access to protected resources.",
      icon: <UserCheck className="h-10 w-10 text-cyan-300"/>,
    },
    {
      title: "Client-Side AES-256 Encryption",
      description: "Data is encrypted on the user’s device using AES-256 encryption with keys derived from the user’s password, ensuring that only the user can decrypt and access the data, while the server remains incapable of accessing the plaintext information.",
      icon: <KeyRound className="h-10 w-10 text-cyan-300"/>,
    },
    {
      title: "Multi-Layered Malware Detection System",
      description:"Files undergo multi-level malware scanning using ClamAV, YARA, and Cuckoo Sandbox, combining signature-based, rule-based, and behavioral analysis to detect both known and unknown threats.",
      icon:<Bug className="h-10 w-10 text-cyan-300"/>
     
    },
    {
      title: "Password-Protected Folder",
      description:"Allows users to secure selected folders with a password, ensuring that only authorized users can access the contents. This adds an extra layer of protection against unauthorized access to sensitive files stored in the system.",
      icon:<FolderLock className="h-10 w-10 text-cyan-300"/>,
    },
    {
      title:"DoS Mitigation via Rate Limiting",
      description:"Implements controlled request thresholds per user or IP address to prevent excessive traffic, thereby mitigating Denial-of-Service (DoS) attacks and preserving system availability and performance.",
      icon:<Gauge className="h-10 w-10 text-cyan-300"/>,
    },
    {
      title:"Web Application Firewall (WAF) – Wafris",
      description:"Ensures real-time protection by filtering malicious traffic and blocking common web attacks, maintaining secure access and reliable application availability.",
      icon:<BrickWall className="h-10 w-10 text-cyan-300"/>,
    }
  ]


  return (
      <div className="w-full">
        <div className="flex items-center max-h-6xl pl-10 p-20">
          <div className="flex flex-col max-w-2xl min-h-3xl p-3">
            <div className="flex flex-col gap-4 font-bold text-5xl md:text-6xl tracking-tight leading-tight">
              <span className="text-white">Secure</span>

              <span className="bg-linear-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                Cloud Storage
              </span>
              <span className="text-blue-600 ">Platform</span>
            </div>

            <p className="text-gray-300 text-2xl font-semibold max-w-xl leading-12 mt-5">
              <TypeEffect
                text="Store, manage, and access your files securely from anywhere in the world"
                typeSpeed={50}
              />
            </p>
            <div className="flex items-center gap-8 ">
              <div className="h-15 w-48 bg-cyan-400 flex items-center justify-center rounded-md text-white font-semibold text-[20px] mt-8 cursor-pointer hover:bg-cyan-300 hover:text-slate-800 transition-all ease-out hover:scale-110 active:scale-95 hover:shadow-[0_0_20px_rgba(34,211,238,0.6)]" onClick={()=>navigate("/register")}>
                Get Started
              </div>
              <div 
                onClick={scrollToFeatures}
                className="h-15 w-48 border-4 border-cyan-500 flex items-center justify-center rounded-md mt-8 text-cyan-500 font-semibold text-[20px] cursor-pointer relative overflow-hidden group transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:shadow-[0_0_30px_rgba(34,211,238,0.8)] animate-pulse-slow hover:border-cyan-400"
              >
                {/* Glow effect overlay */}
                <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                <span className="relative z-10">Learn More</span>
              </div>
            </div>
          </div>
          <div className="relative group ml-auto">
            <div className="absolute inset-0 rounded-full animate-glow-infinite"
            style={{animationPlayState:isScrolling?"paused":"running"}}></div>
            <div className="relative animate-float-infinite will-change-transform"
            style={{animationPlayState:isScrolling?"paused":"running"}}>
              <img
                src={cloudImage}
                className="h-130 will-change-transform w-auto object-contain drop-shadow-[0_0_50px_rgba(34,211,238,0.3)]"
                alt="Cloud"
              />
            </div>
          </div>
        </div>
        <div className="w-full mt-20 pb-24" id="features">
          <div className="text-center mb-5">
            <h2 className="text-white text-4xl lg:4xl font-bold">
              Comprehensive Security Architecture
            </h2>
            <p className="text-slate-300 mt-8 max-w-xl mx-auto font-semibold text-[22px] leading-10">
              Advanced multi-layered protection engineered to safeguard your
              digital life, providing a resilient sanctuary for your data and
              absolute peace of mind.
            </p>
          </div>
          <div className="flex flex-col gap-10 px-10 mt-20 mb-20">
            {/* First row - 4 cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {features.slice(0, 4).map((feature , index)=>(
                <FeatureCard key={index} title={feature.title} description={feature.description} icon={feature.icon}/>
              ))}
            </div>
            {/* Second row - 2 cards centered */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-10 lg:gap-[120px]">
              {features.slice(4, 6).map((feature , index)=>(
                <FeatureCard key={index + 4} title={feature.title} description={feature.description} icon={feature.icon}/>
              ))}
            </div>
          </div>
        </div>
        <div className="h-32"></div>
      </div>
  );
}

export default Home;
