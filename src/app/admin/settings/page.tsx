import { getSettings, razorpayEnabled } from "@/lib/settings";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <>
      <div className="admin-head"><h1>Store settings</h1></div>
      <SettingsForm settings={s} />
      <div className="form-section" style={{ maxWidth: 760 }}>
        <h3>Connections</h3>
        <p className="hint">These are set in the <code>.env</code> file on the server (see README).</p>
        <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
          <li>Razorpay online payments: <b>{razorpayEnabled() ? "Connected" : "Not connected"}</b>{process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test") ? " (TEST mode)" : ""}</li>
          <li>Order emails: <b>{process.env.SMTP_HOST ? "Connected" : "Not connected (emails are only printed in the server log)"}</b></li>
          <li>New-order alerts go to: <b>{process.env.ADMIN_NOTIFY_EMAIL || "not set"}</b></li>
          <li>Image storage: <b>{process.env.CLOUDINARY_CLOUD_NAME ? "Cloudinary" : "Local uploads folder"}</b></li>
        </ul>
      </div>
    </>
  );
}
