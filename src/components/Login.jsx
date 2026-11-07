import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, ArrowRight, Eye, EyeOff, X } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { prefetchTables } from "../lib/useData";
import { saveMemberSession } from "../lib/auth";
import { getLastLogin, getSavedPassword, listLogins, removeLogin, saveLogin } from "../lib/savedLogin";
import AuthShell, { ORANGE_GRADIENT } from "./AuthShell";
import AuthInput from "./AuthInput";

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPwd, setShowPwd] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState([]);

  // Last credentials used on this device are prefilled, password shown.
  useEffect(() => {
    const last = getLastLogin();
    if (last) setForm({ username: last.username, password: last.password });
    setSaved(listLogins());
  }, []);

  // Typing a username saved earlier on this device fills in its password.
  function changeUsername(value) {
    const savedPwd = getSavedPassword(value);
    setForm(f => ({ ...f, username: value, ...(savedPwd ? { password: savedPwd } : {}) }));
  }

  function pickSaved(entry) {
    setShowPwd(true);
    setForm({ username: entry.username, password: entry.password });
  }

  function forgetSaved(entry) {
    removeLogin(entry.username);
    setSaved(listLogins());
    setForm(f => (f.username.trim().toLowerCase() === entry.username.trim().toLowerCase() ? { username: "", password: "" } : f));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error("Please enter username and password");
      return;
    }
    setBusy(true);
    try {
      const { data: members, error } = await supabase
        .from("members")
        .select("*")
        .eq("username", form.username)
        .limit(1);
      if (error) throw error;
      const member = members?.[0];
      if (!member || member.password !== form.password) {
        toast.error("Invalid username or password");
        setBusy(false);
        return;
      }
      saveMemberSession(member.id);
      saveLogin(form.username, form.password);
      prefetchTables(["members", "system_settings", "maintenance_codes", "transactions"]);
      toast.success(`Welcome back, ${member.full_name}!`);
      nav("/Dashboard");
    } catch (err) {
      toast.error(err.message || "Login failed. Please try again.");
    }
    setBusy(false);
  }

  return (
    <AuthShell title="Savings Pro Member Log In">
      <form onSubmit={submit} className="space-y-6">
        <AuthInput
          label="Username"
          required
          icon={User}
          name="username"
          autoComplete="username"
          value={form.username}
          onChange={e => changeUsername(e.target.value)}
          placeholder="Enter your username"
        />
        <AuthInput
          label="Password"
          required
          icon={Lock}
          type={showPwd ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          placeholder="Enter your password"
          trailing={
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="hover:opacity-80">
              {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          }
        />
        {saved.length > 0 && (
          <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/60 mb-2">Saved on this device</p>
            <div className="flex flex-wrap gap-2">
              {saved.map(entry => (
                <span key={entry.username} className="inline-flex items-center rounded-full bg-white/10 border border-white/25 pl-3 pr-1 py-1">
                  <button
                    type="button"
                    onClick={() => pickSaved(entry)}
                    className="text-sm text-white hover:text-orange-300 max-w-[160px] truncate"
                    title={`Use the saved login for ${entry.username}`}
                  >
                    {entry.username}
                  </button>
                  <button
                    type="button"
                    onClick={() => forgetSaved(entry)}
                    className="ml-1 p-1 text-white/50 hover:text-white"
                    aria-label={`Forget ${entry.username}`}
                    title={`Forget ${entry.username}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full h-[52px] rounded-xl text-white text-base font-medium flex items-center justify-center gap-3 shadow-lg hover:brightness-110 transition disabled:opacity-60"
          style={{ background: ORANGE_GRADIENT }}
        >
          {busy ? "Signing in..." : "Login"} <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-center text-white text-[17px]">
          Don't have an account? <Link to="/Register" className="text-orange-400 hover:underline">Register here</Link>
        </p>
      </form>
    </AuthShell>
  );
}
