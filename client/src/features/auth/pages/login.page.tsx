import LoginForm from "../components/LoginForm";
import LeftPannel from "../components/LeftPannel";

export default function Login() {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-slate-100">
      {/* Background Blur */}
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />

      {/* Left Panel */}
      <LeftPannel />

      {/* Right Side */}
      <div className="flex flex-1 items-center justify-center p-6">
        <LoginForm />
      </div>
    </div>
  );
}
