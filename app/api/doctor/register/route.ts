import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { UserRole } from "@/generated/prisma/client";

export async function POST(req: Request) {
  try {
    //get the data from the request
    const body = await req.json();
    const { name, email, password } = body;

    //validate the data
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    //check if the user already exists
    const existingDoctor = await db.user.findUnique({where:{ email }});

    if (existingDoctor) {
      return NextResponse.json(
        { message: "Doctor already exists" },
        { status: 409 }
      );
    }

    //hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    //calculate the trial end date (7 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    //create the user and doctor profile in one transaction
    //This is the core logic that ensures both user and doctor profile are created together

    const newDoctor = await db.user.create({
      data: {
        email: email,
        hashedPassword: hashedPassword,
        role: UserRole.DOCTOR, //set the role to DOCTOR

        //Crete the doctor profile at the same time
        //and link it to the new user

        doctorProfile: {
          create: {
            name: name,
            subscriptionStatus: "TRIALING",
            trialEndsAt: trialEndDate,
          },
        },
      },
      //Include the doctor profile in the response
      include: {
        doctorProfile: true,
      },
    });

    //return the new doctor data (excluding the hashed password)
    const { hashedPassword: _, ...userWithoutPassword } = newDoctor;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (err) {
    console.error("Error registering doctor:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
