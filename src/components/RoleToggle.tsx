"use client";

interface RoleToggleProps {
    role: string;
    setRole: (role: string) => void;
}

/**
 * Shared role toggle component used on login and register pages.
 */
export function RoleToggle({ role, setRole }: RoleToggleProps) {
    const roles = [
        { value: "investor", label: "Investor" },
        { value: "startup", label: "Startup" },
        { value: "incubation", label: "Student" },
    ];

    return (
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mb-6 mx-auto w-fit">
            {roles.map((r) => (
                <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${role === r.value ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                    {r.label}
                </button>
            ))}
        </div>
    );
}
