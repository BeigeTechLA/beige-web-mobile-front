
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useChangePasswordCrewMutation } from "@/lib/redux/features/auth/authApi";

const SecurityForm = ({ onSuccess }: { onSuccess: () => void }) => {
    const [changePasswordCrew, { isLoading }] = useChangePasswordCrewMutation();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        try {
            const userData = localStorage.getItem("revure_user");
            const parsedUser = userData ? JSON.parse(userData) : null;
            const userId = parsedUser?.id;

            if (!userId) {
                toast.error("User ID not found");
                return;
            }

            // Using the Crew specific endpoint as requested
            const response = await changePasswordCrew({
                currentPassword: currentPassword,
                newPassword: newPassword,
                user_id: Number(userId),
            }).unwrap();

            toast.success(response.message || "Password changed successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            onSuccess();
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to change password");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-white/60">Current Password</Label>
                    <div className="relative">
                        <Input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="bg-[#1A1A1A] border-white/10 text-white pr-10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                        >
                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-white/60">New Password</Label>
                    <div className="relative">
                        <Input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="bg-[#1A1A1A] border-white/10 text-white pr-10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                        >
                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-white/60">Confirm New Password</Label>
                    <div className="relative">
                        <Input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="bg-[#1A1A1A] border-white/10 text-white pr-10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                        >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-bold px-10 py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                    {isLoading ? "Updating..." : "Update Password"}
                </button>
            </div>
        </form>
    );
};

export default SecurityForm;
