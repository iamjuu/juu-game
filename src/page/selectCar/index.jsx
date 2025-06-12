import React from "react";
import { FaCoins } from "react-icons/fa";

export default function VehicleSelectScreen() {
  return (
    <div className="min-h-screen bg-gray-800 text-white p-4 flex flex-col items-center">
      {/* Top bar */}
      <div className="w-full flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2 text-yellow-400 text-xl">
          <FaCoins />
          <span>2000</span>
        </div>
        <div className="text-3xl font-bold">
          <span className="text-yellow-500">HILL</span> CLIMB <span className="text-yellow-500">2</span>
        </div>
        <div className="w-12" /> {/* Spacer */}
      </div>

      {/* Vehicle title */}
      <h2 className="text-2xl mb-4">Hill Climber</h2>

      {/* Main vehicle preview */}
      <div className="flex space-x-6">
        <div className="bg-blue-200 rounded-md p-4 shadow-xl w-72 h-44 flex items-center justify-center">
          <img src="/red-jeep.png" alt="Red Jeep" className="h-full object-contain" />
        </div>

        {/* Locked vehicle */}
        <div className="relative bg-blue-900 rounded-md p-2 shadow-xl w-40 h-28 flex items-center justify-center">
          <img src="/bike.png" alt="Motorbike" className="h-full object-contain opacity-40" />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white font-bold">
            <span>LOCKED</span>
            <div className="flex items-center text-yellow-400 mt-1">
              <FaCoins className="mr-1" />
              <span>10000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="mt-8 flex space-x-4">
        <button className="bg-gray-700 px-6 py-2 rounded shadow">STAGE</button>
        <button className="bg-gray-700 px-6 py-2 rounded shadow">VEHICLE</button>
        <button className="bg-green-500 px-6 py-2 rounded shadow font-bold">START</button>
      </div>
    </div>
  );
}
