"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import LoadingSpinner from "../../(components)/LoadingSpinner/LoadingSpinner";
import dynamic from 'next/dynamic';
import { signIn, useSession } from "next-auth/react";

const DisplayQuadrant = dynamic(() => import('../../(components)/Sizing/DisplayQuadrant/canvas'), { ssr: false });

const SizingPage = () => {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      signIn('auth0', { callbackUrl: '/Tasks/Sizing' });
    }
  }, [status]);

  const [quadrants, setQuadrants] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); // Default to 0
  const [labels, setLabels] = useState([]); // Default to empty array
  const [isLoading, setIsLoading] = useState(true); // Combined loading state

  // Load initial state from localStorage on client side
  useEffect(() => {
    const savedIndex = localStorage.getItem('lastViewedQuadrant');
    if (savedIndex) {
      setCurrentIndex(parseInt(savedIndex, 10));
    }

    const savedLabels = localStorage.getItem('savedLabels');
    if (savedLabels) {
      try {
        setLabels(JSON.parse(savedLabels));
      } catch (e) {
        console.error('Failed to parse saved labels:', e);
        setLabels([]);
      }
    }
  }, []);

  // Save state to localStorage when currentIndex or labels change
  useEffect(() => {
    localStorage.setItem('lastViewedQuadrant', currentIndex.toString());
    localStorage.setItem('savedLabels', JSON.stringify(labels));
  }, [currentIndex, labels]);

  useEffect(() => {
    const fetchQuadrants = async () => {
      setIsLoading(true);

      // Check for cached quadrants
      const cachedQuadrants = localStorage.getItem("cachedQuadrants");
      const quadrantsData = cachedQuadrants ? JSON.parse(cachedQuadrants) : null;
      // const cacheIsValid = quadrantsData && new Date().getTime() - quadrantsData.timestamp < 86400000; // 24 hours
      const cacheIsValid = false; // Disabled as in ScoutingPage

      if (cacheIsValid) {
        console.log('Using cached quadrants');
        setQuadrants(quadrantsData.data);
        setIsLoading(false);
      } else {
        try {
          const response = await fetch("/api/sizing/rockquadrants");
          if (!response.ok) {
            throw new Error("Failed to fetch quadrants");
          }
          const data = await response.json();
          console.log("Fetched quadrants:", JSON.stringify(data, null, 2));
          setQuadrants(data);
          localStorage.setItem(
            "cachedQuadrants",
            JSON.stringify({ data, timestamp: new Date().getTime() })
          );
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching quadrants:", error);
          setIsLoading(false);
        }
      }
    };

    fetchQuadrants();
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    const geoData = labels.map(label => ({
      type: 'Polygon',
      coordinates: [label.map(point => [point.x, point.y])]
    }));
  
    // Transform quadrant to match backend expectations
    const currentQuadrant = quadrants[currentIndex];
    const transformedQuadrant = {
      width: currentQuadrant.width,
      height: currentQuadrant.height,
      quadrantNumber: currentQuadrant.quadrantnumber, // Map quadrantnumber to quadrantNumber
      image: {
        id: currentQuadrant.imageid || currentQuadrant.image.id,
        numQuadrants: currentQuadrant.image.numquadrants || currentQuadrant.image.numQuadrants
      }
    };
  
    console.log('Submitting...', { geometries: geoData, quadrant: transformedQuadrant });
  
    const response = await fetch('/api/sizing/geometry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        geometries: geoData,
        quadrant: transformedQuadrant,
      })
    });
  
    if (response.ok) {
      console.log('Submission successful');
      localStorage.removeItem('savedLabels');
      setLabels([]);
      handleNextQuadrant();
    } else {
      const errorData = await response.json();
      console.error('Submission failed:', errorData);
    }
    setIsLoading(false);
  };

  const handleNextQuadrant = () => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % quadrants.length);
  };

  return (
    <>
      <div style={{ paddingLeft: "25px", paddingTop: "30px", paddingBottom: "10px" }}>
        <Link href="/Explore">Back</Link>
      </div>

      <h1 style={{ paddingLeft: "20px" }}>Sizing</h1>
      <div style={{ margin: '20px' }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          quadrants.length > 0 && (
            <DisplayQuadrant
              key={`${quadrants[currentIndex].image.imageURL}-${quadrants[currentIndex].id}`}
              quadrant={quadrants[currentIndex]}
              labels={labels}
              setLabels={setLabels}
            />
          )
        )}
        {!isLoading && (
          <button
            style={{
              margin: '10px',
              padding: '10px',
              borderRadius: '10px',
              background: '#007bff',
              color: '#fff',
              cursor: 'pointer',
              border: 'none',
              textDecoration: 'none',
              width: '120px'
            }}
            onClick={handleSubmit}
          >
            Submit
          </button>
        )}
      </div>
    </>
  );
};

export default SizingPage;