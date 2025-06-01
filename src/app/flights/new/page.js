// src/app/flights/new/page.js
"use client";

import { useRouter } from 'next/navigation';
import FlightLogForm from '../../../components/forms/FlightLogForm';

export default function NewFlightPage() {
  const router = useRouter();

  const handleFlightLogSubmit = async (data) => {
    try {
      const response = await fetch('/api/flights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Flight log submitted successfully:', result);
        alert('Flight log submitted successfully!');
        router.push('/flights'); // Redirect to flight history page
      } else {
        const errorData = await response.json();
        console.error('Failed to submit flight log:', errorData);
        alert(`Failed to submit flight log: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Error submitting flight log:', error);
      alert('An error occurred while submitting the flight log.');
    }
  };

  return (
    <div>
      <FlightLogForm onSubmit={handleFlightLogSubmit} />
    </div>
  );
}
