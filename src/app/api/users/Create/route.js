import { NextResponse } from "next/server"; // NextResponse for sending responses as json objects
import { hash } from "bcrypt";              //bcrypt for hashing and salting passwords 
import prisma from "../../../lib/prisma";   //prisma configuration file



// Should be a POST request, GET not allowed
export async function GET(req) {
  return NextResponse.json(
    { error: "Method not allowed" },
    {
      status: 405,
    }
  );
}


// Create a new user
export async function POST(req) {

  try {
    // Get the user data from the request
    const body = await req.json();
    const { username, email, passwordHash } = body;
    console.log("Incoming request body:", { username, email, passwordHash });

    // Confirm email and password data exists
    if (!email || !passwordHash) {
      return NextResponse.json(
        {
          message: "Email and Password are required",
          email,
          passwordHash,
          username,
        },
        { status: 401 }
      );
    };
    
    
    // Check for duplicate emails case-insensitively using Prisma

    // const duplicateUser = await prisma.user.findUnique({
    //   where: {
    //     email: email.toLowerCase(),
    //   },
    // });

    const res = await fetch(`http://localhost:8080/viperws_1_0_SNAPSHOT_war/api/users/${email}`);
    const check = await res.json();

    // If duplicate user exists, return error
    if (check.exists === true) {
      return NextResponse.json(
        { message: "Email already exists", user: null},
        { status: 409 }
      );
    }

    // Create the user with the email, username, and hashed password
    /*
    const newUser = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        username: username,
      },
    });*/

    const res2 = await fetch("http://localhost:8080/viperws_1_0_SNAPSHOT_war/api/users/Create",{
      method : "POST",
      headers : {
        "Content-Type" : "application/json"
      },
      body : JSON.stringify({
        email : email,
        passwordHash : passwordHash,
        username : username
      }),
    });

    const newUser = await res2.json()

    // Return the new user
    return NextResponse.json(
      { message: "User Created.", user: newUser },
      { status: 201 }
    );
  } catch (error) {
    // If there is an error, return the error. This could be a Prisma error or a server error. In my experience, Prisma errors are more common.
    return NextResponse.json({
      message: "Server error",
      error: error instanceof Error ? error.message : JSON.stringify(error),
    }, { status: 500 });
  }

}

// if error returned is "prisma validation error, there is an issue with one of the queries and\or its parameters"