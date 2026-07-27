"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Branch = "Navagadh Main Branch" | "Taleti Road Branch";

interface LocationContextProps {
  nearestBranch: Branch | null;
  distanceKm: number | null;
  detecting: boolean;
  manualOverride: (branch: Branch) => void;
  detectLocation: () => void;
  locationDenied: boolean;
}

const LocationContext = createContext<LocationContextProps>({
  nearestBranch: null,
  distanceKm: null,
  detecting: false,
  manualOverride: () => {},
  detectLocation: () => {},
  locationDenied: false,
});

const BRANCHES = {
  NAVAGADH: { lat: 21.5126, lng: 71.8315 },
  TALETI: { lat: 21.4984, lng: 71.8210 },
};

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  return d;
}

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [nearestBranch, setNearestBranch] = useState<Branch | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("mehta_preferred_branch") as Branch;
    if (saved) {
      setNearestBranch(saved);
    }
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationDenied(false);
        const { latitude, longitude } = position.coords;

        const distNavagadh = getDistanceFromLatLonInKm(latitude, longitude, BRANCHES.NAVAGADH.lat, BRANCHES.NAVAGADH.lng);
        const distTaleti = getDistanceFromLatLonInKm(latitude, longitude, BRANCHES.TALETI.lat, BRANCHES.TALETI.lng);

        if (distNavagadh <= distTaleti) {
          setNearestBranch("Navagadh Main Branch");
          setDistanceKm(distNavagadh);
          localStorage.setItem("mehta_preferred_branch", "Navagadh Main Branch");
        } else {
          setNearestBranch("Taleti Road Branch");
          setDistanceKm(distTaleti);
          localStorage.setItem("mehta_preferred_branch", "Taleti Road Branch");
        }
        setDetecting(false);
      },
      (error) => {
        setLocationDenied(true);
        setDetecting(false);
      }
    );
  };

  useEffect(() => {
    // Only auto-detect if permission was previously granted, don't spam the prompt
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        detectLocation();
      }
    });
  }, []);

  const manualOverride = (branch: Branch) => {
    setNearestBranch(branch);
    setDistanceKm(null);
    localStorage.setItem("mehta_preferred_branch", branch);
  };

  return (
    <LocationContext.Provider value={{ nearestBranch, distanceKm, detecting, manualOverride, detectLocation, locationDenied }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
