"use client";

import React, { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { useSession, signIn } from "next-auth/react";

const DisplayRocks = dynamic(() => import('../../(components)/Classifying/DisplayRock/canvas'), {
  ssr: false,
});

const ClassifyingPage = () => {
  const { data: session, status } = useSession();

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      signIn('auth0', { callbackUrl: '/Tasks/Classifying' });
    }
  }, [status]);

  const [rocks, setRocks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize currentIndex from localStorage
  useEffect(() => {
    const savedIndex = localStorage.getItem('lastViewedImage');
    if (savedIndex) {
      const index = parseInt(savedIndex, 10);
      if (!isNaN(index) && index >= 0) {
        setCurrentIndex(index);
      } else {
        setCurrentIndex(0);
        localStorage.setItem('lastViewedImage', '0');
      }
    }
  }, []);

  // Save currentIndex to localStorage
  useEffect(() => {
    localStorage.setItem('lastViewedImage', currentIndex.toString());
  }, [currentIndex]);

  // Handle Enter key for submission
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && !loading && !error && rocks.length > 0 && rocks[currentIndex]) {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, rocks.length, loading, error]);

  // Fetch rocks from API
  useEffect(() => {
    const fetchRocks = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/classifying/rocks");
        if (!response.ok) {
          throw new Error(`Failed to fetch rocks: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched rocks:", JSON.stringify(data, null, 2));
        console.log("First rock (if any):", data[0] ? JSON.stringify(data[0], null, 2) : "No rocks");
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No rocks returned from API");
        }
        setRocks(data);
        // Reset currentIndex if out of bounds
        if (currentIndex >= data.length) {
          setCurrentIndex(0);
          localStorage.setItem('lastViewedImage', '0');
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setError("Failed to load rocks. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchRocks();
  }, []);

  const handleSubmit = () => {
    if (rocks.length === 0 || !rocks[currentIndex]) {
      console.error('No valid rock at currentIndex:', currentIndex, 'Rocks:', JSON.stringify(rocks, null, 2));
      setCurrentIndex(0);
      localStorage.setItem('lastViewedImage', '0');
      return;
    }

    console.log('Submitting rock:', JSON.stringify(rocks[currentIndex], null, 2));
    setCurrentIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % Math.max(1, rocks.length);
      console.log('Moving to next rock. CurrentIndex:', nextIndex, 'Rocks length:', rocks.length);
      return nextIndex;
    });
  };

  // Render loading, error, or empty states
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (rocks.length === 0 || !rocks[currentIndex]) {
    console.error('No rocks available. Rocks:', JSON.stringify(rocks, null, 2), 'CurrentIndex:', currentIndex);
    return <div>No rocks available. Check API response for valid data.</div>;
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "20px" }}>
        <div style={{ flex: 1 }}>
          <DisplayRocks
            key={`${rocks[currentIndex].id}-${currentIndex}`}
            rock={rocks[currentIndex]}
          />
        </div>
      </div>
      <button onClick={handleSubmit} disabled={rocks.length === 0 || !rocks[currentIndex]}>
        Submit
      </button>
      <p>helasdfasdfa</p>
    </>
  );
};

export default ClassifyingPage;