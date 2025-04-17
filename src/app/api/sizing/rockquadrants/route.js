import { getServerSession } from 'next-auth';
import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';
import { options } from '../../auth/[...nextauth]/options'


export async function GET(req) {
  

    try {
        /*
        const rockQuadrants = await prisma.RockQuadrant.findMany({
         
            include: {
              image: true,
            },
          });*/
        // If images are found, return them

        const res = await fetch("http://localhost:8080/viperws_1_0_SNAPSHOT_war/api/rockQuadrants")

        const rockQuadrants = await res.json();

      return new NextResponse(JSON.stringify( rockQuadrants ), { status: 201 });
    } catch (error) {
      console.error('Error fetching quadrants');
      return new NextResponse(JSON.stringify({
        message: 'Internal Server Error',
        error: error.message,
        requestBody: req.body 
      }), { status: 500 });
    }
  }
  