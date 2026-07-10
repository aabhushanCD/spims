import LeftPannel from "../components/LeftPannel";
import SignupForm from "../components/SignupForm";

export default function Signup() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* same SPIMS branding panel */}
      <LeftPannel />

      <div className="flex flex-1 items-center justify-center p-6 ">
        <SignupForm />
      </div>
    </div>
  );
}
