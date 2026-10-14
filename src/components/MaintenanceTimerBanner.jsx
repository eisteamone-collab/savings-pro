import React, { useState, useEffect } from "react";
import { Clock, CheckCircle2 } from "lucide-react";
import { maintenanceStatus, formatTime, getMaintenanceSeconds } from "../lib/helpers";

export default function MaintenanceTimerBanner({ member, allCodes }) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isGreen, setIsGreen] = useState(false);

  useEffect(() => {
    function update() {
      if (!member) return;
      const status = maintenanceStatus(member, allCodes);
      setIsGreen(status.isGreen);
      setSecondsLeft(status.secondsLeft);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [member, allCodes]);

  if (!member) return null;

  const hours = Math.floor(getMaintenanceSeconds() / 3600);

  // Green/active state — blue banner with countdown
  if (isGreen) {
    return (
      <div className="relative flex items-center gap-2 bg-[#2B7FFF] rounded-xl overflow-hidden">
        {/* Orange left accent stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF8000]" />
        <div className="flex items-center gap-2 py-2 pl-4 pr-3 w-full">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <span className="text-white text-xs font-medium whitespace-nowrap">
            Maintenance Active — Expires in:
          </span>
          <span className="bg-[#194294] text-white text-xs font-bold rounded-lg px-2 py-0.5 tracking-wider">
            {formatTime(secondsLeft)}
          </span>
          <span className="text-white text-xs font-medium whitespace-nowrap">
            {hours} Hours
          </span>
        </div>
      </div>
    );
  }

  // Red/inactive state — black banner
  return (
    <div className="relative flex items-center gap-2 bg-black rounded-xl overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF8000]" />
      <div className="flex items-center gap-2 py-2 pl-4 pr-3 w-full">
        <Clock className="w-4 h-4 text-white shrink-0" />
        <span className="text-white text-xs font-medium">
          Maintenance Inactive — Redeem a code to activate
        </span>
      </div>
    </div>
  );
}
