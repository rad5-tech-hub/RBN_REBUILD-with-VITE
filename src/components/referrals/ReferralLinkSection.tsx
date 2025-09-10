import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Copy } from "lucide-react";

interface ReferralLinkSectionProps {
  sharableLink?: string;
}

export default function ReferralLinkSection({
  sharableLink,
}: ReferralLinkSectionProps) {
  const baseUrl = window.location.hostname;
  const referralLink = sharableLink
    ? `${baseUrl}/register/agent/${sharableLink}`
    : "";

  useEffect(() => {
    if (!sharableLink) return;

    const storedSharableLink = localStorage.getItem("rbn_sharable_link") || "";
    if (storedSharableLink && storedSharableLink !== sharableLink) {
      toast.success("Referral link updated to match your account.");
      localStorage.setItem("rbn_sharable_link", sharableLink);
      localStorage.setItem("rbn_referral_link", referralLink);
    } else if (!storedSharableLink) {
      localStorage.setItem("rbn_sharable_link", sharableLink);
      localStorage.setItem("rbn_referral_link", referralLink);
    }
  }, [sharableLink, referralLink]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Referral link copied!", { duration: 2000 });
    } catch (err) {
      console.error("Failed to copy referral link:", err);
      toast.error("Failed to copy link.");
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <label
        htmlFor="referralLink"
        className="text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        Your Referral Link
      </label>
      <div className="flex space-x-2">
        <Input
          id="referralLink"
          value={referralLink || "No referral link available"}
          readOnly
          className="text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
        />
        <Button
          onClick={handleCopy}
          disabled={!referralLink}
          className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          aria-label="Copy referral link"
        >
          <Copy className="h-5 w-5" />
        </Button>
      </div>
      {!referralLink && (
        <p className="text-sm text-red-500 dark:text-red-400">
          Please sign up or sign in to generate a referral link.
        </p>
      )}
    </div>
  );
}
