import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
    onSave: (base64: string) => void;
    onClear?: () => void;
}

export default function SignaturePad({ onSave, onClear }: SignaturePadProps) {
    const sigRef = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    const handleClear = () => {
        sigRef.current?.clear();
        setIsEmpty(true);
        onClear?.();
    };

    const handleSave = () => {
        if (!sigRef.current || sigRef.current.isEmpty()) return;
        const base64 = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
        onSave(base64);
    };

    return (
        <div>
            <div className="flex gap-3 mb-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                    Clear
                </Button>

                <Button
                    type="button"
                    variant="default"
                    onClick={handleSave}
                    disabled={isEmpty}
                    className="bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                >
                    Save Signature
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