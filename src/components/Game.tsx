import React, { useState, useEffect } from "react";
import Wheel from "./Wheel";
import confetti from "canvas-confetti";
import { Link } from "react-router-dom";
import { startSpinSound, stopSpinSound, playWin, playLose, playBGM, stopBGM } from "../lib/audio";
import { Loader2, Share2, Gift } from "lucide-react";
import { motion } from "motion/react";

export default function Game() {
  const [config, setConfig] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "permission" | "spin" | "result">("phone");
  const [hasAlreadySpun, setHasAlreadySpun] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [spinning, setSpinning] = useState(false);
  const [prizeId, setPrizeId] = useState<number | null>(null);
  const [prizeName, setPrizeName] = useState("");

  const [phoneError, setPhoneError] = useState("");
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAssigningPrize, setIsAssigningPrize] = useState(false);

  const [fetchError, setFetchError] = useState(false);

  const fetchConfig = () => {
    setFetchError(false);
    fetch("/api/config")
      .then(r => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then(data => {
        setConfig(data);
        if (data.settings) {
          const root = document.documentElement;
          if (data.settings.primaryColor) root.style.setProperty('--color-primary', data.settings.primaryColor);
          if (data.settings.secondaryColor) root.style.setProperty('--color-secondary', data.settings.secondaryColor);
          if (data.settings.tertiaryColor) root.style.setProperty('--color-tertiary', data.settings.tertiaryColor);
          if (data.settings.backgroundColor) root.style.setProperty('--color-neutral', data.settings.backgroundColor);
        }
      })
      .catch(err => {
        console.error(err);
        setFetchError(true);
      });
  };

  useEffect(() => {
    fetchConfig();
      
    return () => {
      stopBGM();
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'UPDATE_CONFIG') {
        setConfig(event.data.config);
        if (event.data.config.settings) {
          const root = document.documentElement;
          if (event.data.config.settings.primaryColor) root.style.setProperty('--color-primary', event.data.config.settings.primaryColor);
          if (event.data.config.settings.secondaryColor) root.style.setProperty('--color-secondary', event.data.config.settings.secondaryColor);
          if (event.data.config.settings.tertiaryColor) root.style.setProperty('--color-tertiary', event.data.config.settings.tertiaryColor);
          if (event.data.config.settings.backgroundColor) root.style.setProperty('--color-neutral', event.data.config.settings.backgroundColor);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const validatePhone = (p: string) => {
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
    return phoneRegex.test(p);
  };

  const [isZaloLoading, setIsZaloLoading] = useState(false);
  const [zaloError, setZaloError] = useState("");

  const processPhone = async (phoneNumber: string) => {
    setIsCheckingPhone(true);
    try {
      const res = await fetch("/api/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, configId: config.configId })
      });
      const data = await res.json();
      
      if (data.exists) {
        if (data.hasSpun) {
          if (data.previousPrize) {
            setUser(data.user);
            setPrizeId(data.previousPrize.id);
            setPrizeName(data.previousPrize.name);
            setHasAlreadySpun(true);
            setStep("result");
          } else {
            setPhoneError("Số điện thoại này đã tham gia quay thưởng rồi.");
          }
          setIsCheckingPhone(false);
          return;
        }
        setUser(data.user);
        playBGM();
        
        setStep("spin");
      } else {
        playBGM();
        setStep("permission");
      }
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra!");
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");
    setZaloError("");
    if (!phone) return;
    
    if (!validatePhone(phone)) {
      setPhoneError("Số điện thoại không hợp lệ");
      return;
    }

    await processPhone(phone);
  };

  const handleZaloConsent = () => {
    setIsZaloLoading(true);
    setZaloError("");
    setPhoneError("");
    
    // Simulate Zalo SDK Consent Flow
    setTimeout(() => {
      const consented = window.confirm("Zalo:\nỨng dụng HMK Eyewear muốn truy cập số điện thoại của bạn để đăng ký tham gia chương trình. Bạn có đồng ý không?");
      setIsZaloLoading(false);
      
      if (consented) {
        // Mock a real-looking phone number
        const mockPhone = "090" + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
        setPhone(mockPhone);
        processPhone(mockPhone);
      } else {
        setZaloError("Rất tiếc! Để tham gia quay thưởng nhanh chóng bạn cần cho phép Zalo chia sẻ số điện thoại. Đừng lo, bạn vẫn có thể nhập số điện thoại thủ công ở ô bên dưới nhé!");
      }
    }, 600);
  };

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, configId: config.configId })
      });
      const data = await res.json();
      
      if (data.success) {
        setUser(data.user);
        if (data.previousPrize) {
           setPrizeId(data.previousPrize.id);
           setPrizeName(data.previousPrize.name);
           setHasAlreadySpun(true);
           setStep("result");
        } else {
           setStep("spin");
        }
      }
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi đăng ký!");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSpin = async () => {
    if (spinning || isAssigningPrize || !user || !config.configId) return;
    
    setIsAssigningPrize(true);
    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, configId: config.configId })
      });
      const data = await res.json();
      
      if (data.success) {
        setPrizeId(data.prize.id);
        setPrizeName(data.prize.name);
        setSpinning(true);
        startSpinSound();
      } else {
        alert(data.error || "Có lỗi xảy ra!");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối. Vui lòng kiểm tra lại mạng!");
    } finally {
      setIsAssigningPrize(false);
    }
  };

  const handleSpinEnd = () => {
    setSpinning(false);
    setStep("result");
    stopSpinSound();
    
    if (prizeName.toLowerCase().includes("may mắn")) {
      playLose();
      return;
    }
    
    playWin();
    
    // Celebratory realistic confetti
    const duration = 4000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 45, spread: 360, ticks: 100, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    // Initial big blast
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      zIndex: 9999,
      colors: ['#3A1F5C', '#B794D6', '#FF5AAD', '#FFF5FB', '#FFD700']
    });

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#3A1F5C', '#B794D6', '#FF5AAD', '#FFF5FB', '#FFD700']
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#3A1F5C', '#B794D6', '#FF5AAD', '#FFF5FB', '#FFD700']
      });
    }, 250);
  };

  const resetGame = () => {
    setPhone("");
    setUser(null);
    setPrizeId(null);
    setPrizeName("");
    setStep("phone");
  };

  const handleShare = async () => {
    if (!config?.settings) return;
    const { metaTitle, metaDescription } = config.settings;
    
    try {
        if (navigator.share) {
            await navigator.share({
                title: metaTitle || 'Vòng Quay May Mắn',
                text: metaDescription || 'Tham gia ngay để nhận hàng ngàn phần quà hấp dẫn!',
                url: window.location.origin,
            });
        } else {
            alert('Đã copy link! Bạn có thể gửi cho bạn bè.');
            navigator.clipboard.writeText(window.location.origin);
        }
    } catch (err) {
        console.error('Error sharing:', err);
    }
  };

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <p className="text-red-500 mb-4">Không thể tải dữ liệu. Vui lòng kiểm tra kết nối mạng.</p>
        <button 
          onClick={fetchConfig}
          className="bg-primary text-white px-6 py-2 rounded-full font-bold hover:bg-opacity-90 transition-colors shadow-md"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary mb-4" size={32} />
        <p className="text-gray-500 font-medium">Đang tải cấu hình...</p>
      </div>
    );
  }

  const isPreview = new URLSearchParams(window.location.search).get("preview") === "true";

  if (!isPreview && !config.configId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border-t-4 border-gray-400">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Không có chương trình</h2>
          <p className="text-gray-600 mb-6">Hiện tại không có chương trình vòng quay may mắn nào đang diễn ra. Vui lòng quay lại sau!</p>
        </div>
      </div>
    );
  }

  const checkTimeframe = () => {
    if (!config.settings) return true;
    const now = new Date().getTime();
    if (config.settings.startDate && new Date(config.settings.startDate).getTime() > now) {
      return false;
    }
    if (config.settings.endDate && new Date(config.settings.endDate).getTime() < now) {
      return false;
    }
    return true;
  };

  const isTimeValid = isPreview || checkTimeframe();

  if (!isTimeValid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border-t-4 border-primary">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Chưa đến lúc!</h2>
          <p className="text-gray-600 mb-6">Chương trình vòng quay may mắn hiện chưa diễn ra hoặc đã kết thúc. Vui lòng quay lại sau!</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center py-6 px-4 relative overflow-hidden w-full max-w-md mx-auto sm:py-12 shadow-2xl"
      style={{
        background: `radial-gradient(circle at center top, var(--color-tertiary), var(--color-primary))`
      }}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-20%] w-[70%] h-[50%] bg-white rounded-full mix-blend-overlay filter blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[60%] bg-white rounded-full mix-blend-overlay filter blur-[120px]"></div>
      </div>

      <button 
        onClick={handleShare}
        className="absolute top-4 left-4 text-white opacity-80 hover:opacity-100 text-xs sm:text-sm font-bold z-20 flex items-center gap-1 bg-white/20 backdrop-blur-md py-2 px-3 rounded-full shadow-md transition-all transform hover:scale-105"
      >
        <Share2 size={16} /> Chia sẻ
      </button>

      <Link to="/admin" className="absolute top-4 right-4 text-white opacity-40 hover:opacity-100 text-xs sm:text-sm font-bold z-20">
        Admin
      </Link>

      <div className="w-full relative z-10 flex flex-col h-full items-center mt-8">
        
        {/* Logo / Brand header */}
        <div className="mb-6 flex flex-col items-center">
          {config.settings?.logoUrl ? (
            <img src={config.settings.logoUrl} alt="Brand Logo" className="max-h-20 object-contain drop-shadow-md" />
          ) : (
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm rounded-lg py-2 px-6 text-white font-black tracking-widest text-xl opacity-90 uppercase">
              BRAND NAME
            </div>
          )}
        </div>

        {/* Campaign Titles */}
        <div className="text-center mb-8 drop-shadow-lg">
          <h1 className="text-white font-black text-4xl sm:text-5xl leading-tight italic">
            {config.name || "Vòng Quay May Mắn"}
          </h1>
          <div className="mt-2 inline-block bg-white text-[var(--color-primary)] font-black uppercase px-6 py-2 rounded-full shadow-lg transform -rotate-2">
            Chơi ngay là trúng
          </div>
        </div>

        {step === "phone" && (
          <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 p-6 sm:p-8 rounded-3xl shadow-2xl mt-4">
            
            {zaloError && (
              <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl mb-6 backdrop-blur-sm">
                <p className="text-white text-sm text-center leading-relaxed font-medium shadow-sm drop-shadow-md">{zaloError}</p>
              </div>
            )}
            
            <button
              type="button"
              onClick={handleZaloConsent}
              disabled={isZaloLoading || isCheckingPhone}
              className="w-full bg-[#0068FF] text-white font-bold text-lg py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-1 disabled:opacity-70 flex items-center justify-center gap-3 mb-6"
            >
              {isZaloLoading ? <Loader2 className="animate-spin" size={24} /> : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M21.822 10.158c-.144-4.887-4.475-8.528-9.458-8.528-4.996 0-9.284 3.755-9.332 8.673-.03 2.923 1.572 5.56 4.12 7.042.476.277.65.864.555 1.397l-.612 3.42c-.085.474.453.842.873.593l3.722-2.222c.382-.228.847-.25 1.25-.062 1.332.617 2.805.952 4.318.952 5.034 0 9.336-3.882 9.384-8.865.01-.98-.158-1.954-.486-2.883l-.334-.517zm-11.45 2.155c-.29.288-.665.452-1.07.452-.405 0-.78-.164-1.07-.452-.288-.29-.452-.665-.452-1.07 0-.405.164-.78.452-1.07.29-.288.665-.452 1.07-.452.405 0 .78.164 1.07.452.288.29.452.665.452 1.07 0 .405-.164.78-.452 1.07zm4.72 0c-.29.288-.665.452-1.07.452-.405 0-.78-.164-1.07-.452-.288-.29-.452-.665-.452-1.07 0-.405.164-.78.452-1.07.29-.288.665-.452 1.07-.452.405 0 .78.164 1.07.452.288.29.452.665.452 1.07 0 .405-.164.78-.452 1.07z"/>
                </svg>
              )}
              {isZaloLoading ? "ĐANG XỬ LÝ..." : "ĐĂNG NHẬP QUA ZALO"}
            </button>

            <div className="flex items-center gap-4 mb-6 opacity-70">
              <div className="flex-1 h-px bg-white/40"></div>
              <span className="text-white text-sm font-medium">HOẶC</span>
              <div className="flex-1 h-px bg-white/40"></div>
            </div>

            <p className="text-white/90 mb-6 text-center text-sm font-medium">Nhập số điện thoại thủ công</p>
            <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
              <div>
                <input 
                  type="tel" 
                  placeholder="09xx xxx xxx" 
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneError("");
                  }}
                  className={`w-full px-5 py-4 rounded-full bg-white/95 border-2 transition-colors text-center text-xl font-bold focus:outline-none shadow-inner ${phoneError ? 'border-red-500 focus:border-red-500 text-red-600' : 'border-transparent focus:border-[var(--color-tertiary)] text-[var(--color-primary)]'}`}
                  required
                />
                {phoneError && <p className="text-white text-sm mt-2 text-center font-bold drop-shadow-md">{phoneError}</p>}
              </div>
              <button 
                type="submit" 
                disabled={isCheckingPhone}
                className="mt-2 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#8B4513] font-black text-xl py-4 px-6 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 active:translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2 uppercase tracking-wide border-2 border-white/50"
              >
                {isCheckingPhone ? <Loader2 className="animate-spin" size={24} /> : "Bắt Đầu"}
              </button>
            </form>
          </div>
        )}

        {step === "permission" && (
          <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 p-6 sm:p-8 rounded-3xl shadow-2xl mt-4 text-center">
            <div className="bg-white/20 p-6 rounded-2xl mb-6 backdrop-blur-sm border border-white/20">
              <p className="text-white text-xl font-black mb-2">Chưa là thành viên!</p>
              <p className="text-white/90">Bạn có đồng ý tạo thẻ thành viên để nhận voucher, tích điểm và tham gia quay thưởng?</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleRegister}
                disabled={isRegistering}
                className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#8B4513] font-black text-lg py-4 px-6 rounded-full shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-1 disabled:opacity-70 flex items-center justify-center gap-2 uppercase border-2 border-white/50"
              >
                {isRegistering ? <Loader2 className="animate-spin" size={24} /> : "Đồng ý & Tạo thẻ"}
              </button>
              <button 
                onClick={() => setStep("phone")}
                className="w-full bg-transparent border-2 border-white/50 text-white font-bold text-lg py-3 px-6 rounded-full hover:bg-white/10 transition-colors"
              >
                Từ chối
              </button>
            </div>
          </div>
        )}

        {(step === "spin" || step === "result") && (
          <motion.div 
            className="flex flex-col items-center w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          >
            <div className="relative mt-4 mb-8 filter drop-shadow-2xl">
              {/* Outer decorative ring for the wheel */}
              <div className="absolute inset-[-15px] bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full z-0 opacity-80 blur-sm"></div>
              <div className="absolute inset-[-10px] bg-gradient-to-br from-[#FFF] to-[#FFD700] rounded-full z-0 shadow-inner border border-[#FFA500]/50"></div>
              
              <Wheel 
                prizes={config.prizes} 
                spinning={spinning} 
                prizeId={prizeId} 
                onSpinEnd={handleSpinEnd} 
              />
            </div>
            
            <div className="mt-4 w-full px-4">
              {step === "spin" && !spinning && (
                <button 
                  onClick={handleSpin}
                  disabled={isAssigningPrize}
                  className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#8B4513] font-black text-2xl py-5 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 active:translate-y-1 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0 disabled:animate-none animate-pulse border-2 border-white/50 uppercase tracking-widest"
                >
                  {isAssigningPrize ? <><Loader2 className="animate-spin" size={28} /> ĐANG XỬ LÝ...</> : "QUAY NGAY"}
                </button>
              )}
              {spinning && (
                <p className="text-white font-black text-2xl animate-pulse drop-shadow-md text-center bg-black/20 py-4 rounded-full backdrop-blur-sm border border-white/10">Đang quay...</p>
              )}
            </div>
          </motion.div>
        )}

        {step === "result" && (
          <div className="absolute inset-0 bg-[var(--color-primary)]/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-8 z-30 animate-in zoom-in-95 duration-300 border border-white/20 shadow-2xl">
            <div className="bg-white/10 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/30">
               <Gift className="text-[#FFD700]" size={48} />
            </div>
            
            {hasAlreadySpun ? (
              <>
                <h2 className="text-3xl font-black text-white mb-2 drop-shadow-md text-center">Bạn Đã Tham Gia!</h2>
                <p className="text-white/90 mb-6 text-center text-lg">Phần quà của bạn là:</p>
                
                <div className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] border border-white rounded-2xl p-6 w-full mb-8 transform scale-105 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full mix-blend-overlay filter blur-xl transform translate-x-10 -translate-y-10"></div>
                  <p className="text-3xl sm:text-4xl font-black text-[#8B4513] text-center drop-shadow-sm relative z-10">{prizeName}</p>
                </div>
                
                <p className="text-sm text-white/80 mb-8 text-center bg-black/20 p-4 rounded-xl border border-white/10 leading-relaxed">
                  Mỗi số điện thoại chỉ được nhận thưởng 1 lần. Quà của bạn đã được gửi qua Zalo số <span className="font-bold text-[#FFD700]">{phone}</span>.<br/><br/>
                  Cảm ơn bạn đã đồng hành cùng HMK Eyewear! Hẹn gặp bạn ở những chương trình ưu đãi hấp dẫn tiếp theo nhé.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-black text-white mb-2 drop-shadow-md">Chúc Mừng!</h2>
                <p className="text-white/90 mb-8 text-lg">Bạn đã quay trúng phần quà:</p>
                
                <div className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] border border-white rounded-2xl p-6 w-full mb-10 transform scale-105 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full mix-blend-overlay filter blur-xl transform translate-x-10 -translate-y-10"></div>
                  <p className="text-3xl sm:text-4xl font-black text-[#8B4513] text-center drop-shadow-sm relative z-10">{prizeName}</p>
                </div>
                
                <p className="text-sm text-white/80 mb-8 text-center bg-black/20 p-4 rounded-xl border border-white/10">
                  Voucher và tin nhắn xác nhận đã được gửi qua Zalo số điện thoại <br/><span className="font-bold text-[#FFD700] text-lg">{phone}</span>
                </p>
              </>
            )}

            <button 
              onClick={resetGame}
              className="bg-white text-[var(--color-primary)] font-black text-lg py-4 px-10 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 uppercase border border-white/50 w-full"
            >
              Quay lại
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
