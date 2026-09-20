import React from "react";
import {
  Wind,
  Truck,
  Zap,
  Droplet,
  BriefcaseMedical,
  Droplets,
  Utensils,
  Home,
  Package,
} from "lucide-react";

export const RESOURCE_TYPES = [
  "Oxygen Cylinder",
  "Ambulance",
  "Generator",
  "Blood Unit",
  "Medical Kit",
  "Water Tanker",
  "Food Packet",
  "Shelter Kit",
];

export const getResourceConfig = (resourceType) => {
  const type = (resourceType || "").toLowerCase();

  if (type.includes("oxygen")) {
    return {
      name: "Oxygen Cylinder",
      Icon: Wind,
      color: "#00d2d3",
      bgColor: "rgba(0, 210, 211, 0.12)",
      borderColor: "rgba(0, 210, 211, 0.3)",
      badgeClass: "badge-cyan",
      unit: "cylinders",
    };
  }
  if (type.includes("ambulance")) {
    return {
      name: "Ambulance Unit",
      Icon: Truck,
      color: "#ff6b6b",
      bgColor: "rgba(255, 107, 107, 0.12)",
      borderColor: "rgba(255, 107, 107, 0.3)",
      badgeClass: "badge-rose",
      unit: "vehicles",
    };
  }
  if (type.includes("generator") || type.includes("power")) {
    return {
      name: "Emergency Generator",
      Icon: Zap,
      color: "#feca57",
      bgColor: "rgba(254, 202, 87, 0.12)",
      borderColor: "rgba(254, 202, 87, 0.3)",
      badgeClass: "badge-amber",
      unit: "kW units",
    };
  }
  if (type.includes("blood")) {
    return {
      name: "Blood Unit",
      Icon: Droplet,
      color: "#ee5253",
      bgColor: "rgba(238, 82, 83, 0.12)",
      borderColor: "rgba(238, 82, 83, 0.3)",
      badgeClass: "badge-red",
      unit: "pints",
    };
  }
  if (type.includes("medical") || type.includes("trauma") || type.includes("kit")) {
    return {
      name: "Medical Trauma Kit",
      Icon: BriefcaseMedical,
      color: "#1dd1a1",
      bgColor: "rgba(29, 209, 161, 0.12)",
      borderColor: "rgba(29, 209, 161, 0.3)",
      badgeClass: "badge-emerald",
      unit: "kits",
    };
  }
  if (type.includes("water")) {
    return {
      name: "Water Tanker",
      Icon: Droplets,
      color: "#54a0ff",
      bgColor: "rgba(84, 160, 255, 0.12)",
      borderColor: "rgba(84, 160, 255, 0.3)",
      badgeClass: "badge-blue",
      unit: "liters/tankers",
    };
  }
  if (type.includes("food")) {
    return {
      name: "Food Supply Packet",
      Icon: Utensils,
      color: "#ff9f43",
      bgColor: "rgba(255, 159, 67, 0.12)",
      borderColor: "rgba(255, 159, 67, 0.3)",
      badgeClass: "badge-orange",
      unit: "rations",
    };
  }
  if (type.includes("shelter")) {
    return {
      name: "Emergency Shelter Kit",
      Icon: Home,
      color: "#9c88ff",
      bgColor: "rgba(156, 136, 255, 0.12)",
      borderColor: "rgba(156, 136, 255, 0.3)",
      badgeClass: "badge-purple",
      unit: "tents",
    };
  }

  return {
    name: resourceType || "Resource Asset",
    Icon: Package,
    color: "#c8d6e5",
    bgColor: "rgba(200, 214, 229, 0.12)",
    borderColor: "rgba(200, 214, 229, 0.3)",
    badgeClass: "badge-neutral",
    unit: "units",
  };
};
