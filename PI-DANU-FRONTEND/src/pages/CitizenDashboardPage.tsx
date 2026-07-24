import { useEffect, useState, useRef } from "react";
import api from "../api/client";

interface ChatMsg {
  role: "user" | "assistant";
  text: string;
  textLocal?: string;
  language?: string;
  form_progress?: any;
}

interface Application {
  id: string;
  request_code: string;
  status: string;
  notes: string;
  documents: any[];
  created_at: string;
}

interface UserProfile {
  id: string;
  nin: string;
  full_name: string;
  phone_number: string;
  parish: string;
  village: string;
  district: string;
  language_preference: string;
  created_at: string;
  application_count: number;
}

const DOC_TYPES = [
  { type: "national_id", label: "National ID (NIN)", icon: "ID", required: true },
  { type: "passport_photo", label: "Passport Photo", icon: "PH", required: true },
  { type: "land_title", label: "Land Title", icon: "LT", required: false },
  { type: "bank_details", label: "Bank Details", icon: "BK", required: true },
  { type: "group_cert", label: "Group Certificate", icon: "GC", required: false },
];

const STATUS_STEPS = [
  { key: "in_progress", label: "Filling Form", icon: "1" },
  { key: "pending", label: "Under Review", icon: "2" },
  { key: "approved", label: "Approved", icon: "3" },
];

export default function CitizenDashboardPage() {
  const user = JSON.parse(localStorage.getItem("citizen_user") || "{}");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"chat" | "documents" | "status" | "profile">("profile");

  useEffect(() => {
    loadProfile();
    loadApplications();
  }, []);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const loadProfile = async () => {
    try {
      const { data } = await api.get("/api/citizen/me");
      setProfile(data);
    } catch {}
  };

  const loadApplications = async () => {
    try {
      const { data } = await api.get("/api/citizen/my-applications");
      setApplications(data.data);
      if (data.data.length > 0) {
        setActiveApp(data.data.find((a: Application) => a.status === "in_progress") || data.data[0]);
      }
    } catch {}
  };

  const startApplication = async () => {
    try {
      const { data } = await api.post("/api/citizen/start-application");
      await loadApplications();
      addBotMessage(`Application started! Your request code is ${data.request_code}.\n\nLet's begin! Please tell me about yourself so I can help fill your PDM registration form. We can also go to the Documents tab to upload your files.`);
    } catch (err: any) {
      addBotMessage(err.response?.data?.detail || "Could not start application.");
    }
  };

  const addBotMessage = (text: string, textLocal?: string, language?: string, form_progress?: any) => {
    setChat((prev) => [...prev, { role: "assistant", text, textLocal, language, form_progress }]);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setChat((prev) => [...prev, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const { data } = await api.post("/api/citizen/chat", {
        message: msg,
        language: user.language_preference || "eng",
      });
      addBotMessage(data.reply, data.reply_local, data.language, data.form_progress);
      if (data.form_data) await loadApplications();
    } catch (err: any) {
      addBotMessage(err.response?.data?.detail || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleFileUpload = async (docType: string) => {
    if (!activeApp) return;
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/jpeg,image/png,image/webp,application/pdf";
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", docType);
      try {
        await api.post(`/api/citizen/applications/${activeApp.id}/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        addBotMessage(`Uploaded ${docType.replace(/_/g, " ")} successfully!`);
        await loadApplications();
      } catch (err: any) {
        addBotMessage(err.response?.data?.detail || "Upload failed.");
      }
      setUploading(false);
    };
    fileInput.click();
  };

  const submitApplication = async () => {
    if (!activeApp) return;
    try {
      await api.post(`/api/citizen/applications/${activeApp.id}/submit`);
      addBotMessage("Application submitted successfully! Your Parish Chief will review it.");
      await loadApplications();
      setTab("status");
    } catch (err: any) {
      addBotMessage(err.response?.data?.detail || "Could not submit.");
    }
  };

  const logout = () => {
    localStorage.removeItem("citizen_token");
    localStorage.removeItem("citizen_user");
    window.location.href = "/citizen/login";
  };

  const currentStep = activeApp
    ? STATUS_STEPS.findIndex((s) => s.key === activeApp.status)
    : -1;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-green-700 font-bold">PI</span>
          </div>
          <div>
            <h1 className="font-bold text-lg">PI-DANU</h1>
            <p className="text-green-200 text-xs">Welcome, {profile?.full_name || user.name || "Citizen"}</p>
          </div>
        </div>
        <button onClick={logout} className="text-sm bg-green-800 hover:bg-green-900 px-4 py-2 rounded-lg">
          Logout
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content */}
          <div className="lg:col-span-3">
            <div className="flex gap-2 mb-4 flex-wrap">
              {[
                { key: "profile", label: "My Profile" },
                { key: "chat", label: "AI Assistant" },
                { key: "documents", label: "Documents" },
                { key: "status", label: "Status" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === t.key ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* PROFILE TAB */}
            {tab === "profile" && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-green-700">
                        {profile?.full_name?.charAt(0) || user.name?.charAt(0) || "C"}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{profile?.full_name || user.name}</h2>
                      <p className="text-gray-500 text-sm">NIN: <span className="font-mono">{profile?.nin || user.nin}</span></p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Full Name", value: profile?.full_name },
                      { label: "NIN", value: profile?.nin, mono: true },
                      { label: "Phone Number", value: profile?.phone_number },
                      { label: "Village", value: profile?.village },
                      { label: "Parish", value: profile?.parish },
                      { label: "District", value: profile?.district },
                      { label: "Language", value: profile?.language_preference === "eng" ? "English" : profile?.language_preference === "lug" ? "Luganda" : profile?.language_preference === "nyn" ? "Runyankole" : profile?.language_preference === "teo" ? "Ateso" : profile?.language_preference },
                      { label: "Registered", value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "" },
                    ].map((item) => (
                      <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                        <p className={`text-sm font-medium text-gray-800 ${item.mono ? "font-mono" : ""}`}>
                          {item.value || "Not set"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {!activeApp && (
                  <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-xl shadow-sm p-6 text-white text-center">
                    <h3 className="text-lg font-bold mb-2">Ready to register for PDM?</h3>
                    <p className="text-green-100 text-sm mb-4">Start your application and our AI assistant will guide you through the process.</p>
                    <button onClick={startApplication} className="bg-white text-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors">
                      Start PDM Registration
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* CHAT TAB */}
            {tab === "chat" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col" style={{ height: "520px" }}>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chat.length === 0 && (
                    <div className="text-center text-gray-400 mt-16">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">💬</span>
                      </div>
                      <p className="text-lg font-medium text-gray-600">PI-DANU AI Assistant</p>
                      <p className="text-sm mt-1 text-gray-400">Ask me anything about PDM registration</p>
                      {!activeApp && (
                        <button onClick={startApplication} className="mt-4 bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                          Start Registration
                        </button>
                      )}
                    </div>
                  )}
                  {chat.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                          m.role === "user"
                            ? "bg-green-600 text-white rounded-br-sm"
                            : "bg-gray-100 text-gray-800 rounded-bl-sm"
                        }`}
                      >
                        {m.text}
                        {m.textLocal && m.textLocal !== m.text && m.language && m.language !== "eng" && (
                          <div className="mt-2 pt-2 border-t border-gray-300 text-xs text-gray-500 italic whitespace-pre-wrap">
                            {m.textLocal}
                          </div>
                        )}
                        {m.form_progress && (
                          <div className="mt-3 bg-white/20 rounded-lg p-2 text-xs">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex-1 bg-gray-300 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${m.form_progress.completion_pct || 0}%` }} />
                              </div>
                              <span>{m.form_progress.completion_pct || 0}%</span>
                            </div>
                            <p>{m.form_progress.documents_uploaded} docs uploaded, {m.form_progress.documents_missing?.length || 0} remaining</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm text-sm text-gray-500">
                        Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={chatEnd} />
                </div>
                <div className="border-t border-gray-200 p-3 flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                  <button onClick={sendMessage} disabled={loading} className="bg-green-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* DOCUMENTS TAB */}
            {tab === "documents" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-lg mb-4">Upload Documents</h3>
                {!activeApp ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Start an application first to upload documents.</p>
                    <button onClick={startApplication} className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700">
                      Start Application
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {DOC_TYPES.map((doc) => {
                        const uploaded = activeApp.documents?.some((d: any) => d.type === doc.type);
                        return (
                          <div key={doc.type} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${uploaded ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                {doc.icon}
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {doc.label}
                                  {doc.required && <span className="text-red-500 ml-1">*</span>}
                                </p>
                                <p className={`text-xs ${uploaded ? "text-green-600" : "text-gray-400"}`}>
                                  {uploaded ? "Uploaded" : doc.required ? "Required" : "Optional"}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleFileUpload(doc.type)}
                              disabled={uploading}
                              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                uploaded ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-green-600 text-white hover:bg-green-700"
                              }`}
                            >
                              {uploading ? "..." : uploaded ? "Replace" : "Upload"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {activeApp.documents && activeApp.documents.length >= 2 && (
                      <button onClick={submitApplication} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 mt-2">
                        Submit Application
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* STATUS TAB */}
            {tab === "status" && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-lg mb-6">Application Progress</h3>
                  {!activeApp ? (
                    <p className="text-gray-500 text-center py-8">No applications yet.</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        {STATUS_STEPS.map((step, idx) => (
                          <div key={step.key} className="flex-1 flex flex-col items-center relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                              idx < currentStep ? "bg-green-500 text-white" :
                              idx === currentStep ? "bg-green-600 text-white ring-4 ring-green-200" :
                              "bg-gray-200 text-gray-500"
                            }`}>
                              {idx < currentStep ? "✓" : step.icon}
                            </div>
                            <p className={`text-xs mt-2 text-center ${idx <= currentStep ? "text-green-700 font-medium" : "text-gray-400"}`}>
                              {step.label}
                            </p>
                            {idx < STATUS_STEPS.length - 1 && (
                              <div className={`absolute top-5 left-1/2 w-full h-0.5 ${idx < currentStep ? "bg-green-500" : "bg-gray-200"}`} />
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Request Code</span>
                          <span className="font-mono font-bold">{activeApp.request_code}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Status</span>
                          <span className={`font-medium capitalize ${
                            activeApp.status === "pending" ? "text-yellow-600" :
                            activeApp.status === "in_progress" ? "text-blue-600" :
                            activeApp.status === "approved" ? "text-green-600" : "text-gray-600"
                          }`}>{activeApp.status.replace("_", " ")}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Documents</span>
                          <span>{activeApp.documents?.length || 0} uploaded</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Created</span>
                          <span>{new Date(activeApp.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {applications.length > 1 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-lg mb-4">All Applications</h3>
                    <div className="space-y-3">
                      {applications.map((app) => (
                        <div key={app.id} className="border rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <p className="font-mono text-sm font-bold">{app.request_code}</p>
                            <p className="text-xs text-gray-500">{app.documents?.length || 0} documents</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            app.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                            app.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                            app.status === "approved" ? "bg-green-100 text-green-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>{app.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-green-700">
                  {profile?.full_name?.charAt(0) || user.name?.charAt(0) || "C"}
                </span>
              </div>
              <p className="text-center font-semibold text-sm">{profile?.full_name || user.name}</p>
              <p className="text-center text-xs text-gray-500 font-mono mt-1">{profile?.nin || user.nin}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-sm mb-3">Quick Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Parish</span>
                  <span className="font-medium">{profile?.parish || user.parish}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">District</span>
                  <span className="font-medium">{profile?.district || user.district}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-medium">{profile?.phone_number || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Applications</span>
                  <span className="font-medium">{profile?.application_count || applications.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {!activeApp && (
                  <button onClick={startApplication} className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700">
                    Start PDM Registration
                  </button>
                )}
                <button onClick={() => setTab("documents")} className="w-full border border-gray-200 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Upload Documents
                </button>
                <button onClick={() => setTab("status")} className="w-full border border-gray-200 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Check Status
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
