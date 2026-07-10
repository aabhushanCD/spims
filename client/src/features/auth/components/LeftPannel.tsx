import { Pill, PackageCheck, ShieldCheck } from "lucide-react";

const LeftPannel = () => {
  return (
    <div className="hidden w-1/2 bg-linear-to-br from-emerald-600 via-emerald-700 to-blue-700 p-16 text-white lg:flex lg:flex-col lg:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/20 p-3 backdrop-blur">
            <Pill className="h-8 w-8" />
          </div>

          <div>
            <h1 className="text-3xl font-bold">SPIMS</h1>
            <p className="text-emerald-100">Smart Pharmacy Inventory</p>
          </div>
        </div>

        <div className="mt-20 max-w-lg">
          <h2 className="text-5xl font-bold leading-tight">
            Manage Your Pharmacy Smarter.
          </h2>

          <p className="mt-6 text-lg text-emerald-100">
            Track inventory, manage medicine batches, suppliers, purchases,
            sales and reports from one intelligent platform.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <Feature
          icon={<PackageCheck />}
          title="Inventory Tracking"
          text="Know every medicine in stock in real time."
        />

        <Feature
          icon={<ShieldCheck />}
          title="Secure Authentication"
          text="Role-based access for administrators and staff."
        />

        <Feature
          icon={<Pill />}
          title="Batch & Expiry Monitoring"
          text="Never miss an expiry or low-stock alert."
        />
      </div>
    </div>
  );
};
type FeatureProps = {
  icon: React.ReactNode;
  title: string;
  text: string;
};

function Feature({ icon, title, text }: FeatureProps) {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-md">
      <div className="rounded-xl bg-white/20 p-3">{icon}</div>

      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-emerald-100">{text}</p>
      </div>
    </div>
  );
}
export default LeftPannel;
