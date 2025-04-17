"use client";

import React, { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { useSession } from "next-auth/react";
import { redirect } from 'next/navigation';

const DisplayRocks = dynamic(() => import('../../(components)/Classifying/DisplayRock/canvas'), {
  ssr: false,
});

const ClassifyingPage = () => {
  const { data: session } = useSession();

  // Redirect unauthenticated users
  if (!session) {
    redirect('/api/auth/signin?callbackUrl=/Tasks/Classifying');
  }

  const [rocks, setRocks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); // Default to 0
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize currentIndex from localStorage on client-side
  useEffect(() => {
    const savedIndex = localStorage.getItem('lastViewedImage');
    if (savedIndex) {
      setCurrentIndex(parseInt(savedIndex, 10));
    }
  }, []); // Runs once on mount

  // Save currentIndex to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('lastViewedImage', currentIndex.toString());
  }, [currentIndex]);

  // Handle Enter key for submission
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && !loading && !error && rocks.length > 0) {
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
        console.log("Fetched rocks:", data[0]);
        setRocks(data);
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
    if (rocks.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % rocks.length);
    }
  };

  // Render loading, error, or empty states
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (rocks.length === 0) return <div>No rocks available.</div>;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "20px" }}>
        <div style={{ flex: 1 }}>
          <DisplayRocks rock={rocks[currentIndex]} />
        </div>
      </div>
      <button onClick={handleSubmit} disabled={rocks.length === 0}>
        Submit
      </button>
    </>
  );
};

export default ClassifyingPage;