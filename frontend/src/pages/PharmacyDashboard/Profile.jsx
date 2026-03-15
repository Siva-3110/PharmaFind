import React, { useState, useEffect } from 'react';
import PharmacyDashboardLayout from '../../components/PharmacyDashboardLayout';
import { Save, UserCircle } from 'lucide-react';

const Profile = () => {
    const [profile, setProfile] = useState({
        name: "My Pharmacy",
        location: "",
        phone: "",
        opening_hours: ""
    });
    const [isSaving, setIsSaving] = useState(false);
    const userId = localStorage.getItem('user_id') || 1; // Fallback to 1 for demo purposes

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/pharmacy/profile?user_id=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setProfile({
                    name: data.name || "",
                    location: data.location || "",
                    phone: data.phone || "",
                    opening_hours: data.opening_hours || ""
                });
            }
        } catch (err) {
            console.error("Failed to fetch profile", err);
        }
    };

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await fetch(`http://localhost:8000/api/pharmacy/profile?user_id=${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile)
            });
            alert("Pharmacy profile updated successfully!");
        } catch (err) {
            console.error("Failed to save profile", err);
            alert("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <PharmacyDashboardLayout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-outfit text-white mb-2">Pharmacy Profile</h1>
                    <p className="text-slate-400">Update your pharmacy's public details and contact information.</p>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden p-8">
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-700/50">
                        <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/30">
                            <UserCircle size={48} className="text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{profile.name || "My Pharmacy"}</h2>
                            <p className="text-slate-400 mt-1">Pharmacy Owner Account</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Pharmacy Name</label>
                            <input
                                required
                                name="name"
                                value={profile.name}
                                onChange={handleChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="E.g., Apollo Pharmacy"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Phone Number</label>
                                <input
                                    required
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="E.g., +91 9876543210"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Opening Hours</label>
                                <input
                                    required
                                    name="opening_hours"
                                    value={profile.opening_hours}
                                    onChange={handleChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="E.g., 08:00 AM - 10:00 PM"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Complete Address Location</label>
                            <textarea
                                required
                                name="location"
                                value={profile.location}
                                onChange={handleChange}
                                rows="3"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                placeholder="Enter full pharmacy address..."
                            ></textarea>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex items-center justify-center w-full md:w-auto gap-2 px-8 py-4 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0"
                            >
                                <Save size={20} />
                                {isSaving ? "Saving details..." : "Save Profile Details"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </PharmacyDashboardLayout>
    );
};

export default Profile;
