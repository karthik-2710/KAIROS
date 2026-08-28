import React, { useEffect, useState } from 'react';
import { useFarmStore } from '@/store/farmStore';
import api from '@/services/api';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { Bell, Smartphone, Mail, MessageSquare, Settings2, ShieldCheck, CloudLightning, Activity, Droplets, Leaf } from 'lucide-react';

export default function NotificationPreferences() {
  const { selectedFarm } = useFarmStore();
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedFarm) {
      setLoading(true);
      api.get(`/notifications/preferences/${selectedFarm.id}`)
        .then(res => setPrefs(res.data))
        .catch(err => toast.error("Failed to load preferences"))
        .finally(() => setLoading(false));
    }
  }, [selectedFarm]);

  const handleToggle = (key) => {
    if (prefs) {
      setPrefs({ ...prefs, [key]: prefs[key] ? 0 : 1 });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/notifications/preferences/${selectedFarm.id}`, prefs);
      toast.success("Preferences updated successfully");
    } catch (err) {
      toast.error("Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  if (!selectedFarm) {
    return <div className="p-8 text-center text-[var(--color-text-muted)]">Please select a farm first.</div>;
  }

  if (loading) {
    return <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin inline-block" /></div>;
  }

  const sections = [
    {
      title: "Delivery Channels",
      icon: <Smartphone className="w-5 h-5 text-blue-400" />,
      items: [
        { key: 'dashboard', label: 'In-App Dashboard', icon: <Bell className="w-4 h-4" /> },
        { key: 'whatsapp', label: 'WhatsApp Messages', icon: <MessageSquare className="w-4 h-4" /> },
        { key: 'email', label: 'Email Notifications', icon: <Mail className="w-4 h-4" /> },
        { key: 'sms', label: 'SMS Alerts', icon: <Smartphone className="w-4 h-4" /> },
      ]
    },
    {
      title: "Alert Categories",
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      items: [
        { key: 'disease_detection', label: 'Disease Detection', icon: <Activity className="w-4 h-4" /> },
        { key: 'weather_alerts', label: 'Weather Alerts', icon: <CloudLightning className="w-4 h-4" /> },
        { key: 'ndvi_alerts', label: 'Vegetation Health (NDVI)', icon: <Leaf className="w-4 h-4" /> },
        { key: 'irrigation_alerts', label: 'Irrigation & Moisture', icon: <Droplets className="w-4 h-4" /> },
      ]
    },
    {
      title: "Reports",
      icon: <Settings2 className="w-5 h-5 text-purple-400" />,
      items: [
        { key: 'weekly_summary', label: 'Weekly Summary', icon: <Bell className="w-4 h-4" /> },
        { key: 'monthly_report', label: 'Monthly Report', icon: <Bell className="w-4 h-4" /> },
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-[var(--color-text-primary)]">Notification Settings</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Manage how and when you receive alerts for {selectedFarm.name}</p>
        </div>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map(section => (
          <div key={section.title} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-bg)] flex items-center justify-center border border-[var(--color-border)]">
                {section.icon}
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{section.title}</h3>
            </div>
            
            <div className="space-y-4">
              {section.items.map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--color-bg)] transition-colors border border-transparent hover:border-[var(--color-border)]">
                  <div className="flex items-center gap-3">
                    <div className="text-[var(--color-text-muted)]">{item.icon}</div>
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{item.label}</span>
                  </div>
                  
                  {/* Toggle Switch */}
                  <button 
                    onClick={() => handleToggle(item.key)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${prefs?.[item.key] ? 'bg-brand-500' : 'bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${prefs?.[item.key] ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
