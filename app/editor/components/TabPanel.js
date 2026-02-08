import { useState } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa"; // Assuming react-icons is/will be installed

export default function TabPanel({ title, children, defaultOpen = false, icon: Icon }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-gray-200/60 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors focus:outline-none"
            >
                <span className="mr-2 text-gray-400">
                    {isOpen ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                </span>
                {Icon && <Icon className="mr-2 text-gray-500" />}
                {title}
            </button>

            {isOpen && (
                <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}
