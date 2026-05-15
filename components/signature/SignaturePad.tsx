import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
    onSave: (base64: string) => void | Promise<void>;
    onClear?: () => void;
    isSaving?: boolean;
}

export default function SignaturePad({
    onSave,
    onClear,
    isSaving = false,
}: SignaturePadProps) {
    const sigRef = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    const handleClear = () => {
        if (isSaving) return;
        sigRef.current?.clear();
        setIsEmpty(true);
        onClear?.();
    };

    const handleSave = async () => {
        if (!sigRef.current || sigRef.current.isEmpty()) return;
        const base64 = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
        await onSave(base64);
    };

    return (
        <div>
            <div className="flex gap-3 mb-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    disabled={isSaving}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                    Clear
                </Button>

                <Button
                    type="button"
                    variant="default"
                    onClick={() => {
                        void handleSave();
                    }}
                    disabled={isEmpty || isSaving}
                    className="bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                >
                    {isSaving ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                    {isSaving ? "Saving..." : "Save Signature"}
                </Button>
            </div>
            {/* Canvas Box */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-crosshair bg-white">
                <SignatureCanvas
                    ref={sigRef}
                    penColor="black"
                    onBegin={() => setIsEmpty(false)}
                    canvasProps={{
                        width: 560,
                        height: 200,
                        style: { display: "block", width: "100%", height: "200px" },
                    }}
                />
            </div>

            {/* Hint */}
            <p className="text-xs text-gray-400 mt-1.5">
                Draw your signature using mouse or touch
            </p>

            {/* Buttons */}
        </div>
    );
}
