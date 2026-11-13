import { getPromo } from "@/lib/promo";
import PromoManager from "@/components/admin/PromoManager";

export default async function PromoPage() {
  const promo = await getPromo();
  return (
    <>
      <div className="admin-head"><h1>Home banner</h1></div>
      <PromoManager promo={promo} />
    </>
  );
}
