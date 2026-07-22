import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  User, 
  Lock, 
  Bell, 
  Key, 
  Cpu, 
  Satellite, 
  Brain, 
  Globe, 
  Info,
  Check,
  Copy,
  AlertCircle
} from 'lucide-react'

type TabType = 'profile' | 'security' | 'api' | 'hardware' | 'preferences'

export default function Settings() {
  const [activeTab, setActiveTab] = React.useState<TabType>('profile')
  
  // Profile settings state
  const [name, setName] = React.useState('Demo Farmer')
  const [email, setEmail] = React.useState('demo@kairos.ag')
  const [role, setRole] = React.useState('Farm Owner')
  const [profileSuccess, setProfileSuccess] = React.useState(false)

  // Security settings state
  const [currentPw, setCurrentPw] = React.useState('')
  const [newPw, setNewPw] = React.useState('')
  const [confirmPw, setConfirmPw] = React.useState('')
  const [securityErrors, setSecurityErrors] = React.useState<Record<string, string>>({})
  const [securitySuccess, setSecuritySuccess] = React.useState(false)

  // Notifications settings state
  const [emailAlerts, setEmailAlerts] = React.useState(true)
  const [smsAlerts, setSmsAlerts] = React.useState(false)
  const [notifSuccess, setNotifSuccess] = React.useState(false)

  // API credentials keys state
  const [apiKey, setApiKey] = React.useState('krs_live_7x8f9a2b5d4e3c1a')
  const [copied, setCopied] = React.useState(false)

  // ESP32 hardware credentials state
  const [frequency, setFrequency] = React.useState('868 MHz')
  const [transmitInterval, setTransmitInterval] = React.useState(30)
  const [hardwareErrors, setHardwareErrors] = React.useState<Record<string, string>>({})
  const [hardwareSuccess, setHardwareSuccess] = React.useState(false)

  // Space & Weather API credentials state
  const [sentinelToken, setSentinelToken] = React.useState('snt2_auth_8x92a3f7d2')
  const [openWeatherKey, setOpenWeatherKey] = React.useState('owm_key_f9a8b7c6d5')
  const [apiCredsSuccess, setApiCredsSuccess] = React.useState(false)

  // AI model configurations state
  const [modelType, setModelType] = React.useState('MobileNetV3-Small')
  const [confidenceThreshold, setConfidenceThreshold] = React.useState(85)
  const [modelSuccess, setModelSuccess] = React.useState(false)

  // General Preferences state
  const [darkMode, setDarkMode] = React.useState(false)
  const [language, setLanguage] = React.useState('English')
  const [prefSuccess, setPrefSuccess] = React.useState(false)

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSuccess(true)
    setTimeout(() => setProfileSuccess(false), 3000)
  }

  const handleSecuritySave = (e: React.FormEvent) => {
    e.preventDefault()
    setSecurityErrors({})
    setSecuritySuccess(false)
    const errs: Record<string, string> = {}
    let isValid = true

    if (!currentPw) {
      errs.currentPw = 'Current password is required'
      isValid = false
    }
    if (newPw.length < 8) {
      errs.newPw = 'New password must be at least 8 characters'
      isValid = false
    }
    if (newPw !== confirmPw) {
      errs.confirmPw = 'Passwords do not match'
      isValid = false
    }

    if (!isValid) {
      setSecurityErrors(errs)
      return
    }

    setSecuritySuccess(true)
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    setTimeout(() => setSecuritySuccess(false), 3000)
  }

  const handleNotifSave = (e: React.FormEvent) => {
    e.preventDefault()
    setNotifSuccess(true)
    setTimeout(() => setNotifSuccess(false), 3000)
  }

  const handleHardwareSave = (e: React.FormEvent) => {
    e.preventDefault()
    setHardwareErrors({})
    setHardwareSuccess(false)

    if (transmitInterval < 10) {
      setHardwareErrors({ transmitInterval: 'Transmission interval must be at least 10 seconds' })
      return
    }

    setHardwareSuccess(true)
    setTimeout(() => setHardwareSuccess(false), 3000)
  }

  const handleApiCredsSave = (e: React.FormEvent) => {
    e.preventDefault()
    setApiCredsSuccess(true)
    setTimeout(() => setApiCredsSuccess(false), 3000)
  }

  const handleModelSave = (e: React.FormEvent) => {
    e.preventDefault()
    setModelSuccess(true)
    setTimeout(() => setModelSuccess(false), 3000)
  }

  React.useEffect(() => {
    const isDark = localStorage.getItem('kairos_dark_mode') === 'true'
    setDarkMode(isDark)
  }, [])

  const handlePrefsSave = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('kairos_dark_mode', String(darkMode))
    document.documentElement.classList.toggle('dark', darkMode)
    setPrefSuccess(true)
    setTimeout(() => setPrefSuccess(false), 3000)
  }

  const handleGenerateApiKey = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let token = 'krs_live_'
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setApiKey(token)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="border-b border-[#EDF1EA]/80 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">System Settings</h1>
        <p className="text-xs text-slate-500">
          Configure profile details, hardware interfaces, third-party APIs, and system preferences.
        </p>
      </div>

      {/* Settings Grid Panel */}
      <div className="grid gap-6 md:grid-cols-4">
        
        {/* Left Side: Category tabs menu */}
        <div className="space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex w-full items-center space-x-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition ${
              activeTab === 'profile'
                ? 'bg-white border border-[#DCE3D6] text-[#2E7D32] shadow-sm'
                : 'text-slate-500 hover:bg-[#EDF1EA]/50 hover:text-slate-800'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Profile & Security</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`flex w-full items-center space-x-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition ${
              activeTab === 'api'
                ? 'bg-white border border-[#DCE3D6] text-[#2E7D32] shadow-sm'
                : 'text-slate-500 hover:bg-[#EDF1EA]/50 hover:text-slate-800'
            }`}
          >
            <Key className="h-4 w-4" />
            <span>API & Connection Keys</span>
          </button>

          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex w-full items-center space-x-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition ${
              activeTab === 'hardware'
                ? 'bg-white border border-[#DCE3D6] text-[#2E7D32] shadow-sm'
                : 'text-slate-500 hover:bg-[#EDF1EA]/50 hover:text-slate-800'
            }`}
          >
            <Cpu className="h-4 w-4" />
            <span>ESP32 Hardware Grid</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex w-full items-center space-x-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition ${
              activeTab === 'preferences'
                ? 'bg-white border border-[#DCE3D6] text-[#2E7D32] shadow-sm'
                : 'text-slate-500 hover:bg-[#EDF1EA]/50 hover:text-slate-800'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>System Preferences</span>
          </button>
        </div>

        {/* Right Side: Configurations Config space */}
        <div className="md:col-span-3 space-y-6">
          
          {/* TAB 1: Profile & Security */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Config Card */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="border-b border-[#EDF1EA]/50 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center">
                      <User className="h-4.5 w-4.5 mr-1.5 text-[#2E7D32]" /> General Profile Parameters
                    </h3>
                  </div>

                  <form onSubmit={handleProfileSave} className="space-y-4">
                    {profileSuccess && (
                      <div className="rounded-lg bg-green-50 border border-green-100 p-2.5 text-xs font-semibold text-green-800 flex items-center">
                        <Check className="h-4 w-4 mr-1.5" /> Profile successfully saved
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Farmer Name</label>
                        <Input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Agricultural Role</label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-[#DCE3D6] bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-600"
                        >
                          <option value="Farm Owner">Farm Owner</option>
                          <option value="Agronomist">Agronomist</option>
                          <option value="Operator">Operator</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <Button type="submit" className="bg-[#2E7D32] hover:bg-[#1B5E20] text-xs font-bold py-2 px-4 shadow">
                      Save Profile
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Password credentials Security Card */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="border-b border-[#EDF1EA]/50 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center">
                      <Lock className="h-4.5 w-4.5 mr-1.5 text-[#2E7D32]" /> Credentials Security
                    </h3>
                  </div>

                  <form onSubmit={handleSecuritySave} className="space-y-4">
                    {securitySuccess && (
                      <div className="rounded-lg bg-green-50 border border-green-100 p-2.5 text-xs font-semibold text-green-800 flex items-center">
                        <Check className="h-4 w-4 mr-1.5" /> Password reset successfully validated.
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Current Password</label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        error={securityErrors.currentPw}
                        required
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">New Password</label>
                        <Input
                          type="password"
                          placeholder="At least 8 characters"
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                          error={securityErrors.newPw}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Confirm New Password</label>
                        <Input
                          type="password"
                          placeholder="Re-enter password"
                          value={confirmPw}
                          onChange={(e) => setConfirmPw(e.target.value)}
                          error={securityErrors.confirmPw}
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="bg-[#2E7D32] hover:bg-[#1B5E20] text-xs font-bold py-2 px-4 shadow">
                      Update Security Password
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Notification Configuration Card */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="border-b border-[#EDF1EA]/50 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center">
                      <Bell className="h-4.5 w-4.5 mr-1.5 text-[#2E7D32]" /> Alert Notifications
                    </h3>
                  </div>

                  <form onSubmit={handleNotifSave} className="space-y-4">
                    {notifSuccess && (
                      <div className="rounded-lg bg-green-50 border border-green-100 p-2.5 text-xs font-semibold text-green-800 flex items-center">
                        <Check className="h-4 w-4 mr-1.5" /> Notification settings successfully saved
                      </div>
                    )}

                    <div className="space-y-3">
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={emailAlerts}
                          onChange={(e) => setEmailAlerts(e.target.checked)}
                          className="sr-only peer cursor-pointer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E7D32]"></div>
                        <span className="ml-3 text-xs font-semibold text-slate-700">Email alerts for crop disease warnings</span>
                      </label>

                      <label className="relative inline-flex items-center cursor-pointer select-none block pt-2">
                        <input
                          type="checkbox"
                          checked={smsAlerts}
                          onChange={(e) => setSmsAlerts(e.target.checked)}
                          className="sr-only peer cursor-pointer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E7D32]"></div>
                        <span className="ml-3 text-xs font-semibold text-slate-700">SMS critical soil warnings (cellular gateway)</span>
                      </label>
                    </div>

                    <Button type="submit" className="bg-[#2E7D32] hover:bg-[#1B5E20] text-xs font-bold py-2 px-4 shadow mt-2">
                      Save Notification Settings
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: API & Connection Keys */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              
              {/* API Client Keys */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="border-b border-[#EDF1EA]/50 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center">
                      <Key className="h-4.5 w-4.5 mr-1.5 text-[#2E7D32]" /> Developer API Client Token
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <p className="text-slate-500 leading-normal">
                      Generate secret client tokens to request canopy telemetry streams and NDVI averages through our endpoints.
                    </p>

                    <div className="flex items-center space-x-2 pt-2">
                      <Input
                        type="text"
                        value={apiKey}
                        readOnly
                        className="font-mono text-xs bg-slate-50 border-[#DCE3D6] text-slate-700 flex-1"
                      />
                      <Button onClick={copyToClipboard} variant="outline" className="h-10 px-3">
                        {copied ? <Check className="h-4.5 w-4.5 text-green-600" /> : <Copy className="h-4.5 w-4.5 text-slate-600" />}
                      </Button>
                    </div>

                    <div className="flex space-x-2 pt-1">
                      <Button onClick={handleGenerateApiKey} variant="outline" className="text-xs">
                        Regenerate Client Token
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 3rd Party APIs Satellite & Weather */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="border-b border-[#EDF1EA]/50 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center">
                      <Satellite className="h-4.5 w-4.5 mr-1.5 text-[#2E7D32]" /> Third-Party API Configuration
                    </h3>
                  </div>

                  <form onSubmit={handleApiCredsSave} className="space-y-4">
                    {apiCredsSuccess && (
                      <div className="rounded-lg bg-green-50 border border-green-100 p-2.5 text-xs font-semibold text-green-800 flex items-center">
                        <Check className="h-4 w-4 mr-1.5" /> API configuration successfully persisted
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sentinel Copernicus API Secret Token</label>
                      <Input
                        type="password"
                        value={sentinelToken}
                        onChange={(e) => setSentinelToken(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">OpenWeatherMap API Authentication Key</label>
                      <Input
                        type="password"
                        value={openWeatherKey}
                        onChange={(e) => setOpenWeatherKey(e.target.value)}
                        required
                      />
                    </div>

                    <Button type="submit" className="bg-[#2E7D32] hover:bg-[#1B5E20] text-xs font-bold py-2 px-4 shadow">
                      Save API Credentials
                    </Button>
                  </form>
                </CardContent>
              </Card>

            </div>
          )}

          {/* TAB 3: ESP32 Hardware Grid */}
          {activeTab === 'hardware' && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="border-b border-[#EDF1EA]/50 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center">
                    <Cpu className="h-4.5 w-4.5 mr-1.5 text-[#2E7D32]" /> ESP32 Edge Mesh Configuration
                  </h3>
                </div>

                <form onSubmit={handleHardwareSave} className="space-y-4">
                  {hardwareSuccess && (
                    <div className="rounded-lg bg-green-50 border border-green-100 p-2.5 text-xs font-semibold text-green-800 flex items-center">
                      <Check className="h-4 w-4 mr-1.5" /> Hardware mesh configuration saved
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">LoRa Frequency Band</label>
                      <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-[#DCE3D6] bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-600"
                      >
                        <option value="868 MHz">868 MHz (Europe / India)</option>
                        <option value="915 MHz">915 MHz (North America)</option>
                        <option value="433 MHz">433 MHz (Sub-band)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Transmission Interval Rate (Seconds)</label>
                      <Input
                        type="number"
                        value={transmitInterval}
                        onChange={(e) => setTransmitInterval(parseInt(e.target.value) || 0)}
                        error={hardwareErrors.transmitInterval}
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-[#EDF1EA]/30 border border-[#DCE3D6]/50 rounded-xl p-3.5 text-[10px] text-slate-500 leading-normal flex items-start space-x-2">
                    <Info className="h-4.5 w-4.5 text-[#2E7D32] shrink-0 mt-0.5" />
                    <span>
                      Hardware interval rates define how frequently ESP32 capacitance moisture sensor nodes broadcast. Settings under 10 seconds exhaust battery nodes within 60 days.
                    </span>
                  </div>

                  <Button type="submit" className="bg-[#2E7D32] hover:bg-[#1B5E20] text-xs font-bold py-2 px-4 shadow">
                    Save Hardware Interface Specs
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: System Preferences & AI Model */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              
              {/* AI Model Settings */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="border-b border-[#EDF1EA]/50 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center">
                      <Brain className="h-4.5 w-4.5 mr-1.5 text-[#2E7D32]" /> Convolutional AI Model Configurations
                    </h3>
                  </div>

                  <form onSubmit={handleModelSave} className="space-y-4">
                    {modelSuccess && (
                      <div className="rounded-lg bg-green-50 border border-green-100 p-2.5 text-xs font-semibold text-green-800 flex items-center">
                        <Check className="h-4 w-4 mr-1.5" /> Model configuration saved
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Neural Backbone</label>
                        <select
                          value={modelType}
                          onChange={(e) => setModelType(e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-[#DCE3D6] bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-600"
                        >
                          <option value="MobileNetV3-Small">MobileNetV3-Small (Fast / Efficient)</option>
                          <option value="MobileNetV3-Large">MobileNetV3-Large (High Precision)</option>
                          <option value="ResNet50">ResNet50-V2 (Heavier weights)</option>
                        </select>
                      </div>

                      {/* Confidence Threshold slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
                          <span>Confidence threshold</span>
                          <span className="text-[#2E7D32]">{confidenceThreshold}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="98"
                          value={confidenceThreshold}
                          onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                          className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#2E7D32] mt-3"
                        />
                      </div>
                    </div>

                    <Button type="submit" className="bg-[#2E7D32] hover:bg-[#1B5E20] text-xs font-bold py-2 px-4 shadow">
                      Persist AI Parameters
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* General localization settings */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="border-b border-[#EDF1EA]/50 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center">
                      <Globe className="h-4.5 w-4.5 mr-1.5 text-[#2E7D32]" /> UI Localization & Display
                    </h3>
                  </div>

                  <form onSubmit={handlePrefsSave} className="space-y-4">
                    {prefSuccess && (
                      <div className="rounded-lg bg-green-50 border border-green-100 p-2.5 text-xs font-semibold text-green-800 flex items-center">
                        <Check className="h-4 w-4 mr-1.5" /> General preferences updated
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Language */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Language Localization</label>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-[#DCE3D6] bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-600"
                        >
                          <option value="English">English</option>
                          <option value="Spanish">Español (Spanish)</option>
                          <option value="French">Français (French)</option>
                          <option value="Hindi">हिन्दी (Hindi)</option>
                        </select>
                      </div>

                      {/* Dark Mode Toggle */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Display Color Theme</label>
                        <div className="flex items-center space-x-3 pt-2">
                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={darkMode}
                              onChange={(e) => setDarkMode(e.target.checked)}
                              className="sr-only peer cursor-pointer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E7D32]"></div>
                            <span className="ml-3 text-xs font-semibold text-slate-700">Dark Mode theme</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="bg-[#2E7D32] hover:bg-[#1B5E20] text-xs font-bold py-2 px-4 shadow">
                      Save Localization Preferences
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* About Card Panel */}
              <Card>
                <CardContent className="p-6 space-y-3.5 text-xs">
                  <div className="border-b border-[#EDF1EA]/50 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center">
                      <Info className="h-4.5 w-4.5 mr-1.5 text-[#2E7D32]" /> System Specifications
                    </h3>
                  </div>

                  <div className="space-y-1 leading-relaxed text-slate-500">
                    <p>• Build Core Version: <strong>1.2.0-sih</strong></p>
                    <p>• Database Driver: <strong>SQLite Mock-Fallback v3.45</strong></p>
                    <p>• Sentinel spacecraft pass: <strong>Scheduled in 3 days</strong></p>
                    <p className="text-[10px] text-slate-400 mt-2">© 2026 KAIROS Platform. SIH Precision Agriculture Panel.</p>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

        </div>

      </div>

    </div>
  )
}
export { AlertCircle }
