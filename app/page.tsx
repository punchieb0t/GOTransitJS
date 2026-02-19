"use client";

import { useState, useEffect } from "react";
import "./globals.css";

interface Departure {
  platform: string;
  route: string;
  destination: string;
  minutes: number;
}

export default function Home() {
  const [currentStop, setCurrentStop] = useState("CL");
  const [stationName, setStationName] = useState("Clarkson GO");
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    updateTime();
    fetchDepartures();

    const timeInterval = setInterval(updateTime, 1000);
    const fetchInterval = setInterval(fetchDepartures, 30000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(fetchInterval);
    };
  }, [currentStop]);

  const updateTime = () => {
    const now = new Date();
    setCurrentTime(now.toLocaleTimeString("en-US", { hour12: false }));
  };

  const fetchDepartures = async () => {
    try {
      const response = await fetch(`/api/departures?stop=${currentStop}`);
      const data = await response.json();

      const lines = data.NextService?.Lines || [];

      if (lines.length === 0) {
        setDepartures([]);
        return;
      }

      const now = new Date();
      const deps = lines
        .filter((line: any) => line.ComputedDepartureTime)
        .map((line: any) => {
          const depTime = new Date(line.ComputedDepartureTime);
          const mins = Math.round((depTime.getTime() - now.getTime()) / 60000);

          let dest = line.DirectionName || "Union Station";
          dest = dest.replace(/^[A-Z]+\s*-\s*/, "");

          return {
            platform: line.ScheduledPlatform || "-",
            route: line.LineCode || "LW",
            destination: dest,
            minutes: mins,
          };
        })
        .filter((d: Departure) => d.minutes >= 0)
        .sort((a: Departure, b: Departure) => a.minutes - b.minutes)
        .slice(0, 6);

      setDepartures(deps);
    } catch (err) {
      console.error(err);
    }
  };

  const selectStation = (code: string, name: string) => {
    setCurrentStop(code);
    setStationName(name);
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <main>
      <div className="header">
        <div className="station-info">
          <div className="go-logo" onClick={toggleMenu}>
            <img src="/go_transit_logo.svg" alt="GO Transit" />
            <div className={`station-menu ${menuOpen ? "show" : ""}`}>
              <div onClick={() => selectStation("CL", "Clarkson GO")}>
                Clarkson GO
              </div>
              <div onClick={() => selectStation("ML", "Milton GO")}>
                Milton GO
              </div>
              <div onClick={() => selectStation("UN", "Union Station")}>
                Union Station
              </div>
            </div>
          </div>
          <h1 id="stationName">{stationName}</h1>
        </div>
        <div className="current-time" id="currentTime">
          {currentTime}
        </div>
      </div>

      <div className="table-header">
        <div>
          <div style={{ fontWeight: 700 }}>Pltfm.</div>
          <div style={{ fontWeight: 400 }}>Quai</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700 }}>Route</div>
          <div style={{ fontWeight: 400 }}>Ligne</div>
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>Direction</div>
          <div style={{ fontWeight: 400 }}>Direction</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700 }}>Time</div>
          <div style={{ fontWeight: 400 }}>Temps</div>
        </div>
      </div>

      <div className="departures" id="departures">
        {departures.length === 0 ? (
          <div className="loading">Loading departures...</div>
        ) : (
          departures.map((dep, index) => {
            const isApproaching = dep.minutes < 5;
            const routeClass = dep.route || "default";
            const timeDisplay =
              dep.minutes === 0 ? (
                <span className="blink-synced">Due</span>
              ) : (
                dep.minutes
              );

            return (
              <div className="departure-row" key={index}>
                <div className="platform">{dep.platform}</div>
                <div>
                  <span className={`route-badge ${routeClass}`}>{dep.route}</span>
                </div>
                <div className="direction">{dep.destination}</div>
                <div className={`time ${isApproaching ? "approaching" : ""}`}>
                  {timeDisplay}
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
