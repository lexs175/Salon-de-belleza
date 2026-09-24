"use client";

import { useState } from "react";
import BookButton from "./BookButton";

type TeamMember = {
  id?: number;
  name: string;
  role: string;
  specialty: string;
  photo: string;
};

export default function TeamLookbook({ team }: { team: TeamMember[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  if (!team || team.length === 0) return null;
  const active = team[selectedIndex] || team[0];

  return (
    <div className="w-full">
      {/* Desktop Split View */}
      <div className="hidden lg:grid grid-cols-12 gap-10 lg:gap-14 items-start">
        
        {/* Left Column: Team List with Direct Booking Button in Each Row */}
        <div className="lg:col-span-7 flex flex-col divide-y divide-stone-200">
          {team.map((member, index) => {
            const num = String(index + 1).padStart(2, "0");
            const isSelected = selectedIndex === index;

            return (
              <div
                key={member.name}
                onClick={() => setSelectedIndex(index)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`group py-5 sm:py-6 px-4 sm:px-5 cursor-pointer transition-colors duration-150 rounded-[4px] ${
                  isSelected ? "bg-stone-950" : "hover:bg-stone-950"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
                    <span
                      className={`text-xs font-mono font-medium pt-1 shrink-0 ${
                        isSelected
                          ? "text-white font-bold"
                          : "text-stone-400 group-hover:text-white/70"
                      }`}
                    >
                      {num}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-serif text-xl sm:text-2xl font-medium leading-snug ${
                          isSelected ? "text-white" : "text-stone-950 group-hover:text-white"
                        }`}
                      >
                        {member.name}
                      </h3>
                      <p
                        className={`text-xs uppercase tracking-wider mt-1 font-medium ${
                          isSelected ? "text-white/70" : "text-stone-500 group-hover:text-white/70"
                        }`}
                      >
                        {member.role}
                      </p>
                      <p
                        className={`text-xs sm:text-sm font-light mt-1.5 line-clamp-1 leading-relaxed ${
                          isSelected ? "text-white/70" : "text-stone-600 group-hover:text-white/70"
                        }`}
                      >
                        {member.specialty}
                      </p>
                    </div>
                  </div>

                  {/* Real Booking Button Directly in the Row */}
                  <div className="shrink-0 pl-2">
                    <BookButton
                      staffId={member.id}
                      variant={isSelected ? "primary" : "dark"}
                      size="sm"
                    >
                      Reservar Cita
                    </BookButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Photo Preview Stage */}
        <div className="lg:col-span-5 sticky top-28">
          <div className="relative aspect-[3/4] w-full max-w-md mx-auto bg-stone-900 overflow-hidden border border-stone-300 rounded-[4px]">
            <img
              key={active.name}
              src={active.photo}
              alt={active.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent" />

            {/* Stage Info Bottom */}
            <div className="absolute bottom-6 inset-x-6 text-white">
              <p className="text-xs uppercase tracking-wider text-stone-300 font-medium mb-1">
                {active.role}
              </p>
              <h4 className="font-serif text-2xl sm:text-3xl font-medium text-white mb-2">
                {active.name}
              </h4>
              <p className="text-sm text-stone-300 font-light leading-relaxed">
                {active.specialty}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Mobile View: Cards with Photos and Direct Button */}
      <div className="lg:hidden flex flex-col divide-y divide-stone-200 border-y border-stone-200">
        {team.map((member) => (
          <div key={member.name} className="py-4 flex gap-3.5 items-center">
            {/* Photo Thumbnail */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-stone-200 shrink-0 border border-stone-300 rounded-[4px] overflow-hidden">
              <img
                src={member.photo}
                alt={member.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-base font-medium text-stone-950 leading-tight">
                  {member.name}
                </h3>
                <p className="text-xs uppercase tracking-wider text-stone-500 mt-0.5">
                  {member.role}
                </p>
                <p className="text-xs text-stone-600 font-light line-clamp-1 mt-1">
                  {member.specialty}
                </p>
              </div>

              <div className="mt-2.5">
                <BookButton staffId={member.id} variant="dark" size="sm">
                  Reservar
                </BookButton>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
