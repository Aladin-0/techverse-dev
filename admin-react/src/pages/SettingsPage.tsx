import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Building,
  Mail,
  Bell,
  Shield,
  CreditCard,
  Code,
  Save,
  RotateCcw,
  ImageIcon,
  Send,
  Database,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { adminApi } from '@/services/api';
import { useToast } from '@/components/ui/Toast';

/* ── Design Tokens ──────────────────────────────────────────────────── */
const C = {
  bg: '#0a0b14',
  surface: 'rgba(15, 17, 30, 0.7)',
  elevated: 'rgba(20, 22, 38, 0.8)',
  high: 'rgba(30, 32, 50, 0.9)',
  violet: '#8b5cff',
  violetDim: '#6d28d9',
  cyan: '#38bdf8',
  text: '#f0f0f5',
  muted: '#a3a3b5',
  faint: '#4b4b66',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#ff5a5a',
};

/* ── Types ──────────────────────────────────────────────────────────── */
type SettingsTab = 'general' | 'business' | 'email' | 'notifications' | 'security' | 'payment' | 'advanced';
interface NavItem { id: SettingsTab; label: string; icon: LucideIcon; }

const navItems: NavItem[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'business', label: 'Business Info', icon: Building },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'advanced', label: 'Advanced', icon: Code },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 14,
  background: C.high, color: C.text, fontSize: 12, fontWeight: 500,
  border: 'none', outline: 'none',
};

/* ── Sub-components ────────────────────────────────────────────────── */
function ToggleSwitch({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
      <div style={{ paddingRight: 16 }}>
        <p style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{label}</p>
        {description && <p style={{ color: C.faint, fontSize: 10, marginTop: 2 }}>{description}</p>}
      </div>
      <motion.button whileTap={{ scale: 0.95 }} onClick={() => onChange(!checked)}
        style={{ position: 'relative', width: 42, height: 24, borderRadius: 99, background: checked ? C.violet : C.elevated, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
        <motion.div
          animate={{ left: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{ position: 'absolute', top: 2, width: 20, height: 20, borderRadius: 99, background: checked ? '#fff' : C.muted }}
        />
      </motion.button>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ ...inputStyle, resize: 'none' }} />
    </div>
  );
}

function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function SectionCard({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div style={{ background: C.surface, borderRadius: 24, padding: 24 }}>
      {title && <h3 style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 18 }}>{title}</h3>}
      {children}
    </div>
  );
}

/* ── Component ──────────────────────────────────────────────────────── */
export const pageTitle = 'Settings';

export default function SettingsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saving, setSaving] = useState(false);

  // General
  const [siteTitle, setSiteTitle] = useState('TechVerse');
  const [siteDescription, setSiteDescription] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Business
  const [businessName, setBusinessName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [supportHours, setSupportHours] = useState('9 AM - 6 PM');
  const [supportDays, setSupportDays] = useState('Mon - Sat');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Email
  const [smtpServer, setSmtpServer] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpTls, setSmtpTls] = useState(true);

  // Notifications
  const [notifyNewOrder, setNotifyNewOrder] = useState(true);
  const [notifyServiceRequest, setNotifyServiceRequest] = useState(true);
  const [notifyReviews, setNotifyReviews] = useState(false);
  const [notifySystemUpdates, setNotifySystemUpdates] = useState(true);
  const [dailyReportTime, setDailyReportTime] = useState('09:00');

  // Security
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [loginMonitoring, setLoginMonitoring] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [minPasswordLength, setMinPasswordLength] = useState('8');
  const [requireUppercase, setRequireUppercase] = useState(true);
  const [requireLowercase, setRequireLowercase] = useState(true);
  const [requireNumbers, setRequireNumbers] = useState(true);
  const [requireSpecial, setRequireSpecial] = useState(false);

  // Payment
  const [defaultTaxRate, setDefaultTaxRate] = useState('18');
  const [taxDisplay, setTaxDisplay] = useState('inclusive');

  const showAutoSave = useCallback(() => { toast.info('Setting updated'); }, [toast]);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await adminApi.saveSettings({
        site_title: siteTitle, site_description: siteDescription, currency, timezone,
        business_name: businessName, contact_email: contactEmail, phone_number: phoneNumber,
        gst_number: gstNumber, business_address: businessAddress,
        support_hours: supportHours, support_days: supportDays, emergency_contact: emergencyContact,
        smtp_server: smtpServer, smtp_port: smtpPort, smtp_username: smtpUsername, smtp_password: smtpPassword,
        smtp_tls: smtpTls ? 'true' : 'false',
        notify_new_order: notifyNewOrder ? 'true' : 'false', notify_service_request: notifyServiceRequest ? 'true' : 'false',
        notify_system_updates: notifySystemUpdates ? 'true' : 'false',
        daily_report_time: dailyReportTime, two_factor_auth: twoFactorAuth ? 'true' : 'false',
        login_monitoring: loginMonitoring ? 'true' : 'false', session_timeout: sessionTimeout,
        min_password_length: minPasswordLength, require_uppercase: requireUppercase ? 'true' : 'false',
        require_lowercase: requireLowercase ? 'true' : 'false', require_numbers: requireNumbers ? 'true' : 'false',
        require_special: requireSpecial ? 'true' : 'false', default_tax_rate: defaultTaxRate, tax_display: taxDisplay,
      });
      toast.success('All settings saved');
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  const handleReset = () => {
    if (!window.confirm('Reset all to defaults?')) return;
    setSiteTitle('TechVerse'); setSiteDescription(''); setCurrency('INR'); setTimezone('Asia/Kolkata');
    setBusinessName(''); setContactEmail(''); setPhoneNumber(''); setGstNumber('');
    setBusinessAddress(''); setSupportHours('9 AM - 6 PM'); setSupportDays('Mon - Sat'); setEmergencyContact('');
    setSmtpServer(''); setSmtpPort('587'); setSmtpUsername(''); setSmtpPassword(''); setSmtpTls(true);
    setNotifyNewOrder(true); setNotifyServiceRequest(true); setNotifyReviews(false); setNotifySystemUpdates(true);
    setDailyReportTime('09:00'); setTwoFactorAuth(false); setLoginMonitoring(true);
    setSessionTimeout('30'); setMinPasswordLength('8'); setRequireUppercase(true); setRequireLowercase(true);
    setRequireNumbers(true); setRequireSpecial(false); setDefaultTaxRate('18'); setTaxDisplay('inclusive');
    toast.info('Settings reset');
  };

  const renderSection = () => {
    switch (activeTab) {
      case 'general':
        return (
          <motion.div key="general" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <SectionCard title="General Settings">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <TextInput label="Site Title" value={siteTitle} onChange={setSiteTitle} placeholder="TechVerse" />
                <TextArea label="Site Description" value={siteDescription} onChange={setSiteDescription} placeholder="Description..." />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <SelectInput label="Currency" value={currency} onChange={setCurrency}
                    options={[{ value: 'INR', label: 'INR - Indian Rupee' }, { value: 'USD', label: 'USD - US Dollar' }, { value: 'EUR', label: 'EUR - Euro' }]} />
                  <SelectInput label="Timezone" value={timezone} onChange={setTimezone}
                    options={[{ value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' }, { value: 'America/New_York', label: 'America/New_York (EST)' }, { value: 'Europe/London', label: 'Europe/London (GMT)' }]} />
                </div>
                <div>
                  <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Site Logo</label>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 100, borderRadius: 16, border: `2px dashed ${C.faint}`, background: C.high, cursor: 'pointer' }}>
                    <ImageIcon size={28} style={{ color: C.faint }} />
                    <p style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>Click to upload (SVG, PNG, JPG)</p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </motion.div>
        );

      case 'business':
        return (
          <motion.div key="business" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <SectionCard title="Business Information">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <TextInput label="Business Name" value={businessName} onChange={setBusinessName} placeholder="TechVerse Services" />
                  <TextInput label="Contact Email" value={contactEmail} onChange={setContactEmail} placeholder="contact@techverse.in" type="email" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <TextInput label="Phone" value={phoneNumber} onChange={setPhoneNumber} placeholder="+91 9876543210" />
                  <TextInput label="GST Number" value={gstNumber} onChange={setGstNumber} placeholder="29ABCDE1234F1Z5" />
                </div>
                <TextArea label="Address" value={businessAddress} onChange={setBusinessAddress} placeholder="Full address..." />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <TextInput label="Support Hours" value={supportHours} onChange={setSupportHours} />
                  <TextInput label="Support Days" value={supportDays} onChange={setSupportDays} />
                  <TextInput label="Emergency Contact" value={emergencyContact} onChange={setEmergencyContact} />
                </div>
              </div>
            </SectionCard>
          </motion.div>
        );

      case 'email':
        return (
          <motion.div key="email" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <SectionCard title="SMTP Configuration">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <TextInput label="SMTP Server" value={smtpServer} onChange={setSmtpServer} placeholder="smtp.gmail.com" />
                  <TextInput label="Port" value={smtpPort} onChange={setSmtpPort} placeholder="587" type="number" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <TextInput label="Username" value={smtpUsername} onChange={setSmtpUsername} placeholder="your@email.com" />
                  <TextInput label="Password" value={smtpPassword} onChange={setSmtpPassword} placeholder="App password" type="password" />
                </div>
                <ToggleSwitch checked={smtpTls} onChange={setSmtpTls} label="Use TLS/SSL" description="Encrypt email communication" />
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, background: 'rgba(96,165,250,0.1)', color: '#60a5fa', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', alignSelf: 'flex-start' }}>
                  <Send size={14} /> Send Test Email
                </button>
              </div>
            </SectionCard>
            <SectionCard title="Email Templates">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[{ name: 'Order Confirmation', desc: 'Sent on new order' }, { name: 'Service Request', desc: 'Sent on service booking' }, { name: 'Welcome Email', desc: 'Sent to new users' }].map(t => (
                  <div key={t.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 14, background: C.elevated }}>
                    <div>
                      <p style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{t.name}</p>
                      <p style={{ color: C.faint, fontSize: 10 }}>{t.desc}</p>
                    </div>
                    <button style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(139,92,255,0.08)', color: C.violet, fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Edit</button>
                  </div>
                ))}
              </div>
            </SectionCard>
          </motion.div>
        );

      case 'notifications':
        return (
          <motion.div key="notifications" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <SectionCard title="Notification Preferences">
              <ToggleSwitch checked={notifyNewOrder} onChange={v => { setNotifyNewOrder(v); showAutoSave(); }} label="New Orders" description="Get notified on new orders" />
              <ToggleSwitch checked={notifyServiceRequest} onChange={v => { setNotifyServiceRequest(v); showAutoSave(); }} label="Service Requests" description="Get notified on new service requests" />
              <ToggleSwitch checked={notifyReviews} onChange={v => { setNotifyReviews(v); showAutoSave(); }} label="Customer Reviews" description="Notified on new reviews" />
              <ToggleSwitch checked={notifySystemUpdates} onChange={v => { setNotifySystemUpdates(v); showAutoSave(); }} label="System Updates" description="Receive system update notifications" />
            </SectionCard>
            <SectionCard title="Notification Settings">
                <TextInput label="Daily Report Time" value={dailyReportTime} onChange={setDailyReportTime} type="time" />
            </SectionCard>
          </motion.div>
        );

      case 'security':
        return (
          <motion.div key="security" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <SectionCard title="Authentication">
              <ToggleSwitch checked={twoFactorAuth} onChange={v => { setTwoFactorAuth(v); showAutoSave(); }} label="Two-Factor Authentication" description="Require 2FA for admin login" />
              <ToggleSwitch checked={loginMonitoring} onChange={v => { setLoginMonitoring(v); showAutoSave(); }} label="Login Monitoring" description="Track suspicious login attempts" />
              <div style={{ marginTop: 14 }}>
                <SelectInput label="Session Timeout" value={sessionTimeout} onChange={setSessionTimeout}
                  options={[{ value: '15', label: '15 mins' }, { value: '30', label: '30 mins' }, { value: '60', label: '1 hour' }, { value: '120', label: '2 hours' }]} />
              </div>
            </SectionCard>
            <SectionCard title="Password Policy">
              <TextInput label="Minimum Password Length" value={minPasswordLength} onChange={setMinPasswordLength} type="number" />
              <p style={{ color: C.muted, fontSize: 11, fontWeight: 600, marginTop: 14, marginBottom: 8 }}>Requirements</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Uppercase letter', checked: requireUppercase, set: (v: boolean) => { setRequireUppercase(v); showAutoSave(); } },
                  { label: 'Lowercase letter', checked: requireLowercase, set: (v: boolean) => { setRequireLowercase(v); showAutoSave(); } },
                  { label: 'Numbers', checked: requireNumbers, set: (v: boolean) => { setRequireNumbers(v); showAutoSave(); } },
                  { label: 'Special characters', checked: requireSpecial, set: (v: boolean) => { setRequireSpecial(v); showAutoSave(); } },
                ].map(item => (
                  <label key={item.label} onClick={e => { e.preventDefault(); item.set(!item.checked); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 0' }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 6, border: `2px solid ${item.checked ? C.violet : C.faint}`,
                      background: item.checked ? C.violet : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {item.checked && <CheckCircle size={10} style={{ color: '#fff' }} />}
                    </div>
                    <span style={{ color: C.text, fontSize: 12 }}>{item.label}</span>
                  </label>
                ))}
              </div>
            </SectionCard>
          </motion.div>
        );

      case 'payment':
        return (
          <motion.div key="payment" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <SectionCard title="Payment Gateways">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { name: 'Razorpay', active: true }, { name: 'PayU', active: false }, { name: 'Cash on Delivery', active: true },
                ].map(gw => (
                  <div key={gw.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 16, background: C.elevated }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: gw.active ? 'rgba(139,92,255,0.1)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: gw.active ? C.violet : C.faint }}>
                        <CreditCard size={16} />
                      </div>
                      <div>
                        <p style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{gw.name}</p>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 9, fontWeight: 700, background: gw.active ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)', color: gw.active ? C.success : C.faint }}>
                          {gw.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <button style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(139,92,255,0.08)', color: C.violet, fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Configure</button>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Tax Settings">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <TextInput label="Default Tax Rate (%)" value={defaultTaxRate} onChange={setDefaultTaxRate} type="number" />
                <SelectInput label="Tax Display" value={taxDisplay} onChange={setTaxDisplay}
                  options={[{ value: 'inclusive', label: 'Tax Inclusive' }, { value: 'exclusive', label: 'Tax Exclusive' }]} />
              </div>
            </SectionCard>
          </motion.div>
        );

      case 'advanced':
        return (
          <motion.div key="advanced" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <SectionCard title="System Maintenance">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: 'Backup DB', icon: <Database size={18} />, color: '#60a5fa' },
                  { label: 'Clear Cache', icon: <Trash2 size={18} />, color: C.warning },
                  { label: 'Export Data', icon: <Download size={18} />, color: C.success },
                  { label: 'Maintenance', icon: <AlertTriangle size={18} />, color: C.error },
                ].map(a => (
                  <motion.button key={a.label} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 16, borderRadius: 16, background: `${a.color}08`, border: 'none', cursor: 'pointer', color: a.color }}>
                    {a.icon}
                    <span style={{ fontSize: 10, fontWeight: 600, textAlign: 'center' }}>{a.label}</span>
                  </motion.button>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="System Info">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { title: 'Server', items: [['Django', '5.0'], ['Python', '3.12'], ['Database', 'PostgreSQL 16'], ['Server', 'Gunicorn + Nginx']] },
                  { title: 'Application', items: [['Version', '1.0.0'], ['Environment', 'Production'], ['Debug', 'Off'], ['Updated', '2026-03-30']] },
                ].map(group => (
                  <div key={group.title}>
                    <p style={{ color: C.faint, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{group.title}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {group.items.map(([label, value]) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: C.elevated }}>
                          <span style={{ color: C.muted, fontSize: 11 }}>{label}</span>
                          <span style={{ color: C.text, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </motion.div>
        );

      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleReset}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, background: C.surface, color: C.muted, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          <RotateCcw size={14} /> Reset
        </motion.button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSaveAll} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #8b5cff, #38bdf8)', color: '#000', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
          <Save size={14} /> {saving ? 'Saving...' : 'Save All'}
        </motion.button>
      </div>

      {/* Layout */}
      <div style={{ display: 'flex', gap: 20, minHeight: 600 }}>
        {/* Sidebar */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          style={{ width: 220, flexShrink: 0 }}>
          <div style={{ background: C.surface, borderRadius: 24, padding: 8, position: 'sticky', top: 90 }}>
            {navItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <motion.button key={item.id} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab(item.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 14, fontSize: 12, fontWeight: 600,
                    background: active ? 'rgba(139,92,255,0.1)' : 'transparent',
                    color: active ? C.violet : C.muted,
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    borderLeft: active ? `3px solid ${C.violet}` : '3px solid transparent',
                    marginBottom: 2,
                  }}>
                  <Icon size={16} /> {item.label}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <AnimatePresence mode="wait">{renderSection()}</AnimatePresence>
        </div>
      </div>
    </div>
  );
}
