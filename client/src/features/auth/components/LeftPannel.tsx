import { Pill, PackageCheck, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

const LeftPannel = () => {
  const { t } = useTranslation();

  return (
    <div className="hidden w-1/2 bg-linear-to-br from-emerald-600 via-emerald-700 to-blue-700 p-16 text-white lg:flex lg:flex-col lg:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/20 p-3 backdrop-blur">
            <Pill className="h-8 w-8" />
          </div>

          <div>
            <h1 className="text-3xl font-bold">SPIMS</h1>
            <p className="text-emerald-100">{t("auth.brand.tagline")}</p>
          </div>
        </div>

        <div className="mt-20 max-w-lg">
          <h2 className="text-5xl font-bold leading-tight">
            {t("auth.brand.headline")}
          </h2>

          <p className="mt-6 text-lg text-emerald-100">
            {t("auth.brand.description")}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <Feature
          icon={<PackageCheck />}
          title={t("auth.brand.inventoryTracking")}
          text={t("auth.brand.inventoryTrackingText")}
        />

        <Feature
          icon={<ShieldCheck />}
          title={t("auth.brand.secureAuth")}
          text={t("auth.brand.secureAuthText")}
        />

        <Feature
          icon={<Pill />}
          title={t("auth.brand.batchExpiry")}
          text={t("auth.brand.batchExpiryText")}
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
