import { useState } from "react";
import SignaturePad from "./SignaturePad";
import { Button } from "@/components/ui/button";
import { salesApi } from "@/lib/api";

interface SignatureModalProps {
    quoteId: number | string;
    signerName: string;
    signerEmail?: string;
    onClose: () => void;
    onSuccess?: (data: any) => void;
}

export default function SignatureModal({
    quoteId,
    signerName,
    signerEmail,
    onClose,
    onSuccess,
}: SignatureModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSignatureSave = async (base64: string) => {
        setLoading(true);
        setError("");

        const res = await salesApi.saveSignature({
            quote_id: quoteId,
            signer_name: signerName,
            signer_email: signerEmail,
            signature_base64: base64,
        });

        if (res.success) {
            setLoading(false);
            onSuccess?.(res.data ?? null);
            onClose();
        } else {
            setError(res.error || "Something went wrong, please try again");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-black/50">
            <div className="min-h-full flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-6 w-full max-w-2xl">

                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold m-0 text-black">
                                Sign Quote #{quoteId}
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">
                                {signerName} — please sign in the box below
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none"
                        >
                            ✕
                        </button>
                    </div>

                    <SignaturePad
                        onSave={handleSignatureSave}
                        onClear={() => setError("")}
                        isSaving={loading}
                    />

                    {error && (
                        <p className="text-red-500 text-sm mt-3">{error}</p>
                    )}

                </div>
            </div>
        </div>
    );
}
