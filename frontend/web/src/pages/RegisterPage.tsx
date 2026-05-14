import { useState } from "react";
import { BarChart3, Mail, Lock, User, ArrowRight } from "lucide-react";

interface AuthProps {
  onAuth: () => void;
}

export function RegisterPage({ onAuth, goLogin }: AuthProps & { goLogin: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });

  return (
    <div className="size-full min-h-screen bg-[#050a1a] text-slate-200 relative overflow-hidden flex items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-500/8 blur-[140px]" />
        <div className="absolute bottom-0 -right-40 w-[700px] h-[700px] rounded-full bg-blue-600/8 blur-[160px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[140px]" />
      </div>

      <button
        onClick={goLogin}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-300 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_18px_rgba(56,189,248,0.5)] flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        MATF
      </button>

      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-cyan-400/15 via-blue-500/10 to-indigo-600/15 blur-2xl" />
        <div className="relative rounded-3xl bg-gradient-to-br from-[#0f1a35]/95 to-[#0a1224]/95 border border-white/10 shadow-[0_0_24px_rgba(56,189,248,0.1)] p-8 backdrop-blur-xl">
          <div className="text-xs text-slate-500 uppercase tracking-wider">Get started</div>
          <h2 className="text-white mt-1 mb-1" style={{ textShadow: "0 0 10px rgba(34,211,238,0.2)" }}>
            Create your account
          </h2>
          <p className="text-sm text-slate-400 mb-6">Start tracking your portfolio in seconds.</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onAuth();
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Full name</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 h-11 text-sm text-slate-200 outline-none focus:border-cyan-400/50 focus:shadow-[0_0_10px_rgba(56,189,248,0.12)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@matf.io"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 h-11 text-sm text-slate-200 outline-none focus:border-cyan-400/50 focus:shadow-[0_0_10px_rgba(56,189,248,0.12)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 h-11 text-sm text-slate-200 outline-none focus:border-cyan-400/50 focus:shadow-[0_0_10px_rgba(56,189,248,0.12)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Confirm password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  placeholder="Repeat password"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 h-11 text-sm text-slate-200 outline-none focus:border-cyan-400/50 focus:shadow-[0_0_10px_rgba(56,189,248,0.12)] transition-all"
                />
              </div>
              {form.confirm && form.confirm !== form.password && (
                <div className="text-xs text-rose-300 mt-1">Passwords don't match</div>
              )}
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-400">
              <input type="checkbox" required className="accent-cyan-400 mt-0.5" />
              <span>
                I agree to the{" "}
                <a className="text-cyan-300 cursor-pointer">Terms</a> and{" "}
                <a className="text-cyan-300 cursor-pointer">Privacy Policy</a>.
              </span>
            </label>

            <button
              type="submit"
              disabled={!!form.confirm && form.confirm !== form.password}
              className="w-full h-11 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(56,189,248,0.25)] hover:shadow-[0_0_18px_rgba(56,189,248,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Create account <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <button onClick={goLogin} className="text-cyan-300 hover:text-cyan-200">
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
