"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Star, MapPin, Phone, Wifi, MessageSquare, BadgeCheck, ChevronDown } from "lucide-react";
import MockChatModal from "@/components/MockChatModal";

interface CAProfile {
  id: string;
  full_name: string;
  icai_number: string;
  city: string;
  expertise_tags: string[];
  aggregate_rating: number;
  phone_number: string;
  remote_available: boolean;
}

const TAG_COLORS = [
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
];

export default function CADirectoryPage() {
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [caList, setCaList] = useState<CAProfile[]>([]);
  const [activeChat, setActiveChat] = useState<CAProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load city list on mount
  useEffect(() => {
    axios.get("/api/ca/cities")
      .then(res => setCities(res.data))
      .catch(() => setError("Unable to load cities."));
  }, []);

  // Fetch CAs when city is selected
  useEffect(() => {
    if (!selectedCity) { setCaList([]); return; }
    setLoading(true);
    setError("");
    axios.get(`/api/ca/mock-directory?city=${encodeURIComponent(selectedCity)}`)
      .then(res => setCaList(res.data))
      .catch(() => setError("Unable to load CA directory at this time."))
      .finally(() => setLoading(false));
  }, [selectedCity]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600">
            CA Finder
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Connect with verified Chartered Accountants across India
          </p>
        </div>

        {/* City Selector */}
        <div className="flex justify-center mb-10">
          <div className="relative w-full max-w-sm">
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="w-full appearance-none px-5 py-3.5 pr-10 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-100 font-semibold text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">📍 Select your city...</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Empty state — no city selected */}
        {!selectedCity && !loading && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏙️</div>
            <p className="text-gray-500 dark:text-gray-400 font-semibold text-lg">Select a city to find CAs near you</p>
            <p className="text-gray-400 dark:text-gray-600 text-sm mt-1">We have verified CAs across 10 major Indian cities</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <svg className="animate-spin h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {error && <div className="text-center py-10 text-red-500 font-semibold">{error}</div>}

        {/* Results header */}
        {selectedCity && !loading && caList.length > 0 && (
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              <span className="text-gray-800 dark:text-gray-100 font-bold">{caList.length} CAs</span> found in {selectedCity}
            </p>
          </div>
        )}

        {/* CA Grid */}
        {!loading && caList.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {caList.map(ca => (
              <div key={ca.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">

                {/* Card Header */}
                <div className="p-5 border-b border-gray-50 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {ca.full_name.split(' ').pop()?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{ca.full_name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <BadgeCheck size={13} className="text-indigo-500" />
                          <span className="text-xs text-indigo-500 font-semibold">ICAI #{ca.icai_number}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg flex-shrink-0">
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{ca.aggregate_rating}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin size={14} className="flex-shrink-0" />
                    <span>{ca.city}</span>
                    {ca.remote_available && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Wifi size={11} /> Remote
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Phone size={14} className="flex-shrink-0" />
                    <span>{ca.phone_number}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ca.expertise_tags.map((tag, i) => (
                      <span key={tag} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TAG_COLORS[i % TAG_COLORS.length]}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="px-5 pb-5">
                  <button
                    onClick={() => setActiveChat(ca)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm"
                  >
                    <MessageSquare size={15} />
                    Message CA
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeChat && (
        <MockChatModal ca={activeChat} onClose={() => setActiveChat(null)} />
      )}
    </div>
  );
}
