"use client";

import { Button } from "@mui/material";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center h-screen space-y-4">
      <h1 className="text-4xl font-bold text-violet-600">
        Hair Studio Booking
      </h1>
      <p className="text-gray-600">Tailwind + MUI integrated correctly ✅</p>
      <Button variant="contained" color="primary">
        MUI Button
      </Button>
      <button className="bg-violet-600 text-white px-4 py-2 rounded-lg">
        Tailwind Button
      </button>
    </main>
  );
}
