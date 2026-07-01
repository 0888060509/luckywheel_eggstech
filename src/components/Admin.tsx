import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Settings, BarChart3, Users, Gift, Save, Trash2, Plus, Download, Eye, Smartphone, Trophy, History } from "lucide-react";

const THEME_TEMPLATES = [
  {
    id: "default",
    name: "Mặc định (Modern)",
    settings: { primaryColor: "#3A1F5C", secondaryColor: "#B794D6", tertiaryColor: "#FF5AAD", backgroundColor: "#FDFBF7", textColor: "#333333" },
    wheelColors: ["#3A1F5C", "#B794D6", "#FF5AAD", "#FFD700", "#4B5563", "#10B981"]
  },
  {
    id: "tet",
    name: "Tết Nguyên Đán",
    settings: { primaryColor: "#D32F2F", secondaryColor: "#FFC107", tertiaryColor: "#F44336", backgroundColor: "#FFF3E0", textColor: "#3E2723" },
    wheelColors: ["#D32F2F", "#FFC107", "#D84315", "#FF8F00", "#C62828", "#F9A825"]
  },
  {
    id: "women_day",
    name: "8/3 & 20/10 (Phụ Nữ)",
    settings: { primaryColor: "#E91E63", secondaryColor: "#F48FB1", tertiaryColor: "#C2185B", backgroundColor: "#FCE4EC", textColor: "#880E4F" },
    wheelColors: ["#E91E63", "#F48FB1", "#D81B60", "#F06292", "#AD1457", "#F8BBD0"]
  },
  {
    id: "summer",
    name: "Mùa Hè Sôi Động (30/4 - 1/5)",
    settings: { primaryColor: "#0288D1", secondaryColor: "#4FC3F7", tertiaryColor: "#0277BD", backgroundColor: "#E1F5FE", textColor: "#01579B" },
    wheelColors: ["#0288D1", "#4FC3F7", "#0277BD", "#81D4FA", "#01579B", "#B3E5FC"]
  },
  {
    id: "national_day",
    name: "Quốc Khánh 2/9",
    settings: { primaryColor: "#B71C1C", secondaryColor: "#FFD54F", tertiaryColor: "#D32F2F", backgroundColor: "#FFEBEE", textColor: "#4A148C" },
    wheelColors: ["#B71C1C", "#FFD54F", "#D32F2F", "#FFE082", "#C62828", "#FFCA28"]
  },
  {
    id: "mid_autumn",
    name: "Trung Thu",
    settings: { primaryColor: "#F57C00", secondaryColor: "#FFE082", tertiaryColor: "#E65100", backgroundColor: "#FFF8E1", textColor: "#3E2723" },
    wheelColors: ["#F57C00", "#FFE082", "#E65100", "#FFCA28", "#EF6C00", "#FFF3E0"]
  },
  {
    id: "christmas",
    name: "Giáng Sinh",
    settings: { primaryColor: "#1B5E20", secondaryColor: "#D32F2F", tertiaryColor: "#388E3C", backgroundColor: "#E8F5E9", textColor: "#B71C1C" },
    wheelColors: ["#1B5E20", "#D32F2F", "#388E3C", "#C62828", "#2E7D32", "#B71C1C"]
  }
];

export default function Admin() {
  const [stats, setStats] = useState<any>(null);
  const [configs, setConfigs] = useState<any[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  
  const [prizes, setPrizes] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [winners, setWinners] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "configs" | "settings" | "winners">("dashboard");
  const [saving, setSaving] = useState(false);
  const [filterConfigId, setFilterConfigId] = useState<string>("");

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    fetchStats(filterConfigId);
    fetchWinners(filterConfigId);
  }, [filterConfigId]);

  useEffect(() => {
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'UPDATE_CONFIG',
        config: { settings, prizes }
      }, '*');
    }
  }, [settings, prizes]);

  const fetchStats = async (configId: string = "") => {
    const res = await fetch(`/api/stats${configId ? `?configId=${configId}` : ''}`);
    const data = await res.json();
    setStats(data);
  };

  const fetchWinners = async (configId: string = "") => {
    const res = await fetch(`/api/winners${configId ? `?configId=${configId}` : ''}`);
    const data = await res.json();
    setWinners(data);
  };

  const fetchConfigs = async () => {
    const res = await fetch("/api/configs");
    const data = await res.json();
    setConfigs(data);
  };

  const loadConfig = (config: any) => {
    setSelectedConfig(config);
    setPrizes(config.prizes || []);
    setSettings(config.settings || {});
    
    // Apply colors to root for admin UI preview if needed
    if (config.settings) {
      const root = document.documentElement;
      if (config.settings.primaryColor) root.style.setProperty('--color-primary', config.settings.primaryColor);
      if (config.settings.secondaryColor) root.style.setProperty('--color-secondary', config.settings.secondaryColor);
      if (config.settings.tertiaryColor) root.style.setProperty('--color-tertiary', config.settings.tertiaryColor);
      if (config.settings.backgroundColor) root.style.setProperty('--color-neutral', config.settings.backgroundColor);
    }
    
    setActiveTab("settings");
  };

  const createNewConfig = () => {
    setSelectedConfig({ name: 'Chiến dịch mới', status: 'active' });
    setPrizes([
      { name: "Voucher 10%", label: "10%", probability: 0.5, color: "#3A1F5C", stock: 100 },
      { name: "Chúc bạn may mắn", label: "May mắn", probability: 0.5, color: "#FF5AAD", stock: -1 }
    ]);
    setSettings({
      primaryColor: '#3A1F5C',
      secondaryColor: '#B794D6',
      tertiaryColor: '#FF5AAD',
      backgroundColor: '#FFF5FB',
      startDate: '',
      endDate: ''
    });
    setActiveTab("settings");
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    
    // Validate probabilities sum to ~1
    const totalProb = prizes.reduce((sum, p) => sum + parseFloat(p.probability || 0), 0);
    if (Math.abs(totalProb - 1) > 0.01) {
      alert(`Tổng xác suất phải bằng 1 (hiện tại: ${totalProb.toFixed(2)})`);
      setSaving(false);
      return;
    }

    try {
      const payload = {
        name: selectedConfig.name,
        startDate: settings.startDate,
        endDate: settings.endDate,
        status: selectedConfig.status,
        settings,
        prizes
      };

      const res = await fetch(selectedConfig.id ? `/api/configs/${selectedConfig.id}` : "/api/configs", {
        method: selectedConfig.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || "Có lỗi xảy ra!");
      } else {
        alert("Lưu cấu hình thành công!");
        fetchConfigs();
        setActiveTab("configs");
      }
    } catch (e) {
      alert("Có lỗi xảy ra!");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfig = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chiến dịch này?")) return;
    try {
      await fetch(`/api/configs/${id}`, { method: "DELETE" });
      fetchConfigs();
    } catch (e) {
      alert("Xóa thất bại!");
    }
  };

  const addPrize = () => {
    setPrizes([...prizes, { name: "Giải thưởng mới", probability: 0, color: "#3A1F5C", stock: 10 }]);
  };

  const updatePrize = (index: number, field: string, value: any) => {
    const newPrizes = [...prizes];
    newPrizes[index] = { ...newPrizes[index], [field]: value };
    setPrizes(newPrizes);
  };

  const removePrize = (index: number) => {
    if (prizes.length <= 2) {
      alert("Cần ít nhất 2 giải thưởng!");
      return;
    }
    const newPrizes = [...prizes];
    newPrizes.splice(index, 1);
    setPrizes(newPrizes);
  };

  if (!stats) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white shadow-md flex-shrink-0">
        <div className="p-4 md:p-6 flex justify-between items-center">
          <h2 className="text-xl md:text-2xl font-black text-primary">Admin Panel</h2>
        </div>
        <nav className="flex md:flex-col gap-2 p-2 md:p-4 overflow-x-auto md:overflow-visible">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-md transition-colors whitespace-nowrap ${activeTab === "dashboard" ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <BarChart3 size={20} /> <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab("configs")}
            className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-md transition-colors whitespace-nowrap ${(activeTab === "configs" || activeTab === "settings") ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Settings size={20} /> <span className="hidden sm:inline">Chiến dịch</span>
          </button>
          <button 
            onClick={() => setActiveTab("winners")}
            className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-md transition-colors whitespace-nowrap ${activeTab === "winners" ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <History size={20} /> <span className="hidden sm:inline">Lịch sử trúng thưởng</span>
          </button>
          <div className="border-t my-2 md:my-4 hidden md:block"></div>
          <Link to="/" className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-md text-gray-600 hover:bg-gray-100 transition-colors whitespace-nowrap ml-auto md:ml-0">
            Về Minigame
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-800">Thống Kê</h1>
              <div className="flex items-center gap-4">
                <select 
                  value={filterConfigId}
                  onChange={(e) => setFilterConfigId(e.target.value)}
                  className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                >
                  <option value="">Tất cả chiến dịch</option>
                  {configs.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button 
                  onClick={() => window.open(`/api/export-csv${filterConfigId ? `?configId=${filterConfigId}` : ''}`, "_blank")}
                  className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-md font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm text-sm"
                >
                  <Download size={16} /> Xuất CSV
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="bg-blue-100 p-4 rounded-full text-blue-600"><Users size={24} /></div>
                <div>
                  <p className="text-gray-500 text-sm">Tổng Khách Hàng</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="bg-green-100 p-4 rounded-full text-green-600"><Users size={24} /></div>
                <div>
                  <p className="text-gray-500 text-sm">Thành Viên Mới</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalMembers} <span className="text-sm font-normal text-green-600">({stats.conversionRate}% CV)</span></p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="bg-purple-100 p-4 rounded-full text-purple-600"><Gift size={24} /></div>
                <div>
                  <p className="text-gray-500 text-sm">Lượt Quay</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalSpins}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Lượt quay 7 ngày qua</h3>
                <div className="h-72">
                  {stats.spinsByDate.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.spinsByDate}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3A1F5C" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">Chưa có dữ liệu</div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Phân bổ giải thưởng đã trao</h3>
                <div className="h-72">
                  {stats.prizeStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.prizeStats}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="name"
                          label={(entry) => entry.name.substring(0,10)}
                        >
                          {stats.prizeStats.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={["#3A1F5C", "#B794D6", "#FF5AAD", "#FFF5FB", "#gray-400"][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">Chưa có dữ liệu</div>
                  )}
                </div>
              </div>
            </div>

            {/* NEW CHART: Prize Distribution Over Time */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Phân bổ giải thưởng theo thời gian (7 ngày qua)</h3>
              <div className="h-96">
                {stats.prizeStatsByDate?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.prizeStatsByDate}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {stats.uniquePrizes?.map((prizeName: string, index: number) => (
                        <Bar 
                          key={prizeName} 
                          dataKey={prizeName} 
                          stackId="a" 
                          fill={["#3A1F5C", "#B794D6", "#FF5AAD", "#FFD700", "#4B5563", "#10B981"][index % 6]} 
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">Chưa có dữ liệu</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "configs" && (
          <div className="space-y-6 animate-in fade-in max-w-5xl">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-800">Danh sách Chiến dịch</h1>
              <button 
                onClick={createNewConfig}
                className="bg-primary text-white px-6 py-2 rounded-md font-bold flex items-center gap-2 hover:bg-opacity-90 transition-colors"
              >
                <Plus size={18} /> Thêm mới
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Tên chiến dịch</th>
                    <th className="p-4 font-semibold text-gray-600">Bắt đầu</th>
                    <th className="p-4 font-semibold text-gray-600">Kết thúc</th>
                    <th className="p-4 font-semibold text-gray-600">Trạng thái</th>
                    <th className="p-4 font-semibold text-gray-600 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {configs.map((config) => (
                    <tr key={config.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-800">{config.name}</td>
                      <td className="p-4 text-gray-600">{config.start_date ? new Date(config.start_date).toLocaleString() : '—'}</td>
                      <td className="p-4 text-gray-600">{config.end_date ? new Date(config.end_date).toLocaleString() : '—'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${config.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {config.status === 'active' ? 'Hoạt động' : 'Bản nháp'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => loadConfig(config)}
                          className="text-primary hover:text-opacity-80 font-medium px-3"
                        >
                          Chỉnh sửa
                        </button>
                        <button 
                          onClick={() => handleDeleteConfig(config.id)}
                          className="text-red-500 hover:text-red-700 font-medium px-3"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                  {configs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        Chưa có chiến dịch nào. Hãy tạo mới!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="animate-in fade-in h-full flex flex-col xl:flex-row gap-6">
            <div className="flex-1 space-y-6 max-w-4xl overflow-y-auto">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-primary transition-colors" onClick={() => setActiveTab("configs")}>
                  &larr; Quay lại danh sách
                </div>
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold text-gray-800">
                    <input 
                      type="text" 
                      value={selectedConfig?.name || ''} 
                      onChange={(e) => setSelectedConfig({...selectedConfig, name: e.target.value})}
                      className="bg-transparent border-b border-dashed border-gray-300 focus:border-primary focus:outline-none placeholder-gray-300 w-full max-w-md"
                      placeholder="Tên chiến dịch"
                    />
                  </h1>
                  <div className="flex items-center gap-4">
                    <select 
                      value={selectedConfig?.status || 'active'} 
                      onChange={(e) => setSelectedConfig({...selectedConfig, status: e.target.value})}
                      className="border rounded-md px-3 py-2 bg-white text-sm focus:outline-primary"
                    >
                      <option value="active">Hoạt động</option>
                      <option value="draft">Bản nháp</option>
                    </select>
                    <button 
                      onClick={handleSaveConfig}
                      disabled={saving}
                      className="bg-primary text-white px-6 py-2 rounded-md font-bold flex items-center gap-2 hover:bg-opacity-90 transition-colors disabled:opacity-50"
                    >
                      <Save size={18} /> {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Thời gian áp dụng</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Thời gian bắt đầu</label>
                    <input 
                      type="datetime-local" 
                      value={settings.startDate || ''}
                      onChange={(e) => setSettings({...settings, startDate: e.target.value})}
                      className="w-full px-3 py-2 border rounded text-sm focus:outline-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Thời gian kết thúc</label>
                    <input 
                      type="datetime-local" 
                      value={settings.endDate || ''}
                      onChange={(e) => setSettings({...settings, endDate: e.target.value})}
                      className="w-full px-3 py-2 border rounded text-sm focus:outline-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Màu sắc giao diện (Theme)</h2>
                  <select 
                    className="border rounded-md px-3 py-2 bg-white text-sm focus:outline-primary w-48"
                    onChange={(e) => {
                      const template = THEME_TEMPLATES.find(t => t.id === e.target.value);
                      if (template) {
                        setSettings({ ...settings, ...template.settings });
                        if (template.wheelColors) {
                           const newPrizes = prizes.map((p, index) => ({
                              ...p,
                              color: template.wheelColors![index % template.wheelColors!.length]
                           }));
                           setPrizes(newPrizes);
                        }
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Chọn Giao Diện Mẫu...</option>
                    {THEME_TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Màu chính (Primary)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={settings.primaryColor || '#3A1F5C'}
                      onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                      className="h-9 w-12 cursor-pointer border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={settings.primaryColor || '#3A1F5C'}
                      onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                      className="w-full px-3 py-2 border rounded text-sm uppercase focus:outline-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Màu phụ (Secondary)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={settings.secondaryColor || '#B794D6'}
                      onChange={(e) => setSettings({...settings, secondaryColor: e.target.value})}
                      className="h-9 w-12 cursor-pointer border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={settings.secondaryColor || '#B794D6'}
                      onChange={(e) => setSettings({...settings, secondaryColor: e.target.value})}
                      className="w-full px-3 py-2 border rounded text-sm uppercase focus:outline-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Màu nhấn (Accent/Tertiary)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={settings.tertiaryColor || '#FF5AAD'}
                      onChange={(e) => setSettings({...settings, tertiaryColor: e.target.value})}
                      className="h-9 w-12 cursor-pointer border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={settings.tertiaryColor || '#FF5AAD'}
                      onChange={(e) => setSettings({...settings, tertiaryColor: e.target.value})}
                      className="w-full px-3 py-2 border rounded text-sm uppercase focus:outline-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Màu nền (Background)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={settings.backgroundColor || '#FFF5FB'}
                      onChange={(e) => setSettings({...settings, backgroundColor: e.target.value})}
                      className="h-9 w-12 cursor-pointer border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={settings.backgroundColor || '#FFF5FB'}
                      onChange={(e) => setSettings({...settings, backgroundColor: e.target.value})}
                      className="w-full px-3 py-2 border rounded text-sm uppercase focus:outline-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Hình ảnh & Thương hiệu (Brand)</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Logo URL (Đường dẫn hình ảnh logo)</label>
                  <input 
                    type="url" 
                    value={settings.logoUrl || ''}
                    onChange={(e) => setSettings({...settings, logoUrl: e.target.value})}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                  {settings.logoUrl && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md border inline-block">
                      <img src={settings.logoUrl} alt="Logo Preview" className="h-16 object-contain" />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Dùng hình ảnh có nền trong suốt (PNG) để hiển thị đẹp nhất trên màn hình.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Thông tin chia sẻ (Zalo/Facebook)</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề (Meta Title)</label>
                  <input 
                    type="text" 
                    value={settings.metaTitle || ''}
                    onChange={(e) => setSettings({...settings, metaTitle: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-primary"
                    placeholder="VD: Vòng Quay May Mắn"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả (Meta Description)</label>
                  <textarea 
                    value={settings.metaDescription || ''}
                    onChange={(e) => setSettings({...settings, metaDescription: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-primary"
                    rows={2}
                    placeholder="VD: Tham gia vòng quay nhận quà cực lớn..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Hình ảnh (URL Ảnh bìa)</label>
                  <input 
                    type="text" 
                    value={settings.metaImage || ''}
                    onChange={(e) => setSettings({...settings, metaImage: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-primary"
                    placeholder="https://example.com/image.jpg"
                  />
                  {settings.metaImage && (
                    <div className="mt-2 relative h-40 w-full sm:w-80 rounded-md overflow-hidden border">
                      <img src={settings.metaImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Danh sách giải thưởng</h2>
                <button 
                  onClick={addPrize}
                  className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-200"
                >
                  <Plus size={16} /> Thêm giải thưởng
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-bold text-gray-500 uppercase px-2">
                  <div className="col-span-3">Tên giải thưởng</div>
                  <div className="col-span-3">Nhãn hiển thị vòng quay</div>
                  <div className="col-span-2">Xác suất (0-1)</div>
                  <div className="col-span-2">Màu sắc</div>
                  <div className="col-span-1">Kho (-1)</div>
                  <div className="col-span-1"></div>
                </div>
                
                {prizes.map((prize, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 md:items-center bg-gray-50 p-4 md:p-2 rounded-md relative border md:border-0 border-gray-200">
                    <div className="md:col-span-3">
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block md:hidden">Tên giải thưởng</label>
                      <input 
                        type="text" 
                        value={prize.name}
                        onChange={(e) => updatePrize(index, "name", e.target.value)}
                        className="w-full px-3 py-2 border rounded text-sm focus:outline-primary"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block md:hidden">Nhãn vòng quay</label>
                      <input 
                        type="text" 
                        value={prize.label || ''}
                        onChange={(e) => updatePrize(index, "label", e.target.value)}
                        className="w-full px-3 py-2 border rounded text-sm focus:outline-primary"
                        placeholder="VD: 100K"
                      />
                    </div>
                    <div className="md:col-span-2 flex gap-4 md:block">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block md:hidden">Xác suất (0-1)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          max="1"
                          value={prize.probability}
                          onChange={(e) => updatePrize(index, "probability", parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border rounded text-sm focus:outline-primary"
                        />
                      </div>
                      <div className="flex-1 block md:hidden">
                         <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Kho (-1=Vô hạn)</label>
                         <input 
                          type="number" 
                          value={prize.stock}
                          onChange={(e) => updatePrize(index, "stock", parseInt(e.target.value))}
                          className="w-full px-3 py-2 border rounded text-sm focus:outline-primary"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block md:hidden">Màu sắc</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={prize.color}
                          onChange={(e) => updatePrize(index, "color", e.target.value)}
                          className="h-9 w-12 cursor-pointer border-0 p-0"
                        />
                        <input 
                          type="text" 
                          value={prize.color}
                          onChange={(e) => updatePrize(index, "color", e.target.value)}
                          className="w-full px-2 py-2 border rounded text-xs uppercase focus:outline-primary min-w-0"
                        />
                      </div>
                    </div>
                    <div className="hidden md:block md:col-span-1">
                      <input 
                        type="number" 
                        value={prize.stock}
                        onChange={(e) => updatePrize(index, "stock", parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded text-sm focus:outline-primary min-w-0"
                      />
                    </div>
                    <div className="md:col-span-1 flex justify-end absolute top-2 right-2 md:relative md:top-0 md:right-0">
                      <button 
                        onClick={() => removePrize(index)}
                        className="text-red-500 p-2 hover:bg-red-50 rounded"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="p-4 bg-blue-50 text-blue-800 rounded-md text-sm mt-4">
                  <p><strong>Lưu ý (80/20 Rule):</strong> Màu sắc giải thưởng sẽ quyết định giao diện chính của vòng quay. Hãy chọn các màu sắc tương phản cao nhưng hòa hợp (VD: #3A1F5C, #B794D6, #FF5AAD).</p>
                  <p className="mt-1">Tổng xác suất của tất cả giải thưởng bắt buộc phải bằng <strong>1.0</strong>.</p>
                </div>
              </div>
            </div>
            
            </div>
            {/* Preview Panel */}
            <div className="w-full xl:w-[450px] flex flex-col items-center sticky top-0">
              <div className="flex items-center justify-between w-full mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Smartphone size={20} /> Xem Trước</h2>
                <a 
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md font-bold flex items-center gap-1 hover:bg-gray-50 transition-colors shadow-sm text-sm"
                >
                  <Eye size={14} /> Mở tab mới
                </a>
              </div>
              <div className="bg-gray-200 rounded-lg shadow-inner flex flex-col items-center justify-center p-4 w-full h-[750px] relative">
                 <div className="w-[340px] h-[720px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-8 border-gray-800 relative shrink-0">
                    {/* Phone notch */}
                    <div className="absolute top-0 inset-x-0 h-5 bg-gray-800 rounded-b-xl w-32 mx-auto z-50"></div>
                    <iframe 
                      src="/?preview=true"
                      className="w-full h-full border-0"
                      title="Minigame Preview"
                    />
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "winners" && (
          <div className="space-y-6 animate-in fade-in max-w-5xl">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-800">Lịch Sử Trúng Thưởng</h1>
              <div className="flex items-center gap-4">
                <select 
                  value={filterConfigId}
                  onChange={(e) => setFilterConfigId(e.target.value)}
                  className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                >
                  <option value="">Tất cả chiến dịch</option>
                  {configs.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Số điện thoại</th>
                    <th className="p-4 font-semibold text-gray-600">Giải thưởng</th>
                    <th className="p-4 font-semibold text-gray-600">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {winners.map((winner, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-800">{winner.phone}</td>
                      <td className="p-4 text-gray-600">
                        <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-sm font-medium">
                          {winner.prize_name}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 text-sm">
                        {new Date(winner.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {winners.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-500">
                        Chưa có người chơi trúng thưởng nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
