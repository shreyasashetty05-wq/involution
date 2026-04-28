import { NextResponse } from 'next/server';

/**
 * Seed route: blocked in production. Only callable in development.
 * Populates DB with dummy student startups for the Incubation Center (Incube).
 */
export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { success: false, error: 'Seeding is not available in production.' },
            { status: 403 }
        );
    }

    const { default: dbConnect } = await import("@/database/mongodb");
    const { default: Startup } = await import("@/database/models/Startup");

    try {
        await dbConnect();

        // Delete existing dummy incube startups to avoid duplicates
        await Startup.deleteMany({ name: { $in: ["CampusCart", "EcoPod", "StudyBuddy AI", "EduVR"] } });

        const studentStartups = [
            {
                name: "EduVR",
                ownerEmail: "student4@university.edu",
                sector: "EdTech",
                stage: "Pre-Seed",
                businessModel: "B2B SaaS",
                desc: "An immersive VR platform for medical students to practice surgical procedures in a risk-free virtual environment with real-time AI feedback.",
                requested: 1800000,
                equity: 12,
                revenue: 0,
                burn: 0,
                isStudent: true,
                founderAge: 23,
                risk: "Medium",
                score: 87,
                videos: [
                    {
                        title: "EduVR Surgical Simulation",
                        thumb: "https://images.unsplash.com/photo-1593508512855-d6c2975d59a8?auto=format&fit=crop&q=80&w=800",
                        url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
                    }
                ],
                basicInfo: {
                    founderNames: "Dr. Kabir Das",
                    location: "Hyderabad, India",
                    teamSize: 5
                },
                businessInfo: {
                    targetMarket: "Medical Universities and Teaching Hospitals",
                    uvp: "High-fidelity haptic feedback and real-time AI performance scoring",
                    marketingStrategy: "Pilots with top-tier medical colleges and medical conference showcases"
                },
                analysis: "EduVR leverages the high cost of medical training to offer a cost-effective simulation alternative. The founder's medical background adds significant credibility."
            },
            {
                name: "CampusCart",
                ownerEmail: "student1@university.edu",
                sector: "E-commerce",
                stage: "Idea",
                businessModel: "B2C Marketplace",
                desc: "A hyper-local marketplace for university students to buy, sell, and rent textbooks and dorm essentials safely within campus boundaries.",
                requested: 500000,
                equity: 5,
                revenue: 0,
                burn: 0,
                isStudent: true,
                founderAge: 21,
                risk: "Low",
                score: 78,
                videos: [
                    {
                        title: "CampusCart Vision",
                        thumb: "https://images.unsplash.com/photo-1523240715630-341e2049e6f8?auto=format&fit=crop&q=80&w=800",
                        url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
                    }
                ],
                basicInfo: {
                    founderNames: "Rohan Sharma",
                    location: "New Delhi, India",
                    teamSize: 3
                },
                businessInfo: {
                    targetMarket: "University Students (Ages 18-24)",
                    uvp: "Zero-shipping cost, instant campus delivery",
                    marketingStrategy: "Campus ambassador program and social media contests"
                },
                analysis: "CampusCart addresses a high-frequency pain point in the student community. The hyper-local focus reduces operational costs significantly."
            },
            {
                name: "EcoPod",
                ownerEmail: "student2@university.edu",
                sector: "CleanTech",
                stage: "Pre-Seed",
                businessModel: "D2C Hardware",
                desc: "Sustainable, biodegradable coffee pods compatible with major machines, made from upcycled agricultural waste.",
                requested: 1200000,
                equity: 10,
                revenue: 0,
                burn: 0,
                isStudent: true,
                founderAge: 22,
                risk: "Medium",
                score: 82,
                videos: [
                    {
                        title: "EcoPod Prototype",
                        thumb: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800",
                        url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
                    }
                ],
                basicInfo: {
                    founderNames: "Ananya Iyer",
                    location: "Mumbai, India",
                    teamSize: 2
                },
                businessInfo: {
                    targetMarket: "Environmentally conscious coffee drinkers",
                    uvp: "Fully compostable in 30 days, zero microplastics",
                    marketingStrategy: "Influencer partnerships and sustainable living blog features"
                },
                analysis: "EcoPod taps into the growing sustainable consumer market. The technical challenge is durability, which the team claims to have solved with a patent-pending organic coating."
            },
            {
                name: "StudyBuddy AI",
                ownerEmail: "student3@university.edu",
                sector: "EdTech",
                stage: "Seed",
                businessModel: "SaaS",
                desc: "AI-powered study assistant that generates personalized flashcards and quizzes from lecture recordings and PDFs.",
                requested: 2500000,
                equity: 8,
                revenue: 0,
                burn: 0,
                isStudent: true,
                founderAge: 20,
                risk: "Low",
                score: 91,
                videos: [
                    {
                        title: "StudyBuddy AI Demo",
                        thumb: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=800",
                        url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
                    }
                ],
                basicInfo: {
                    founderNames: "Vikram Malhotra",
                    location: "Bangalore, India",
                    teamSize: 4
                },
                businessInfo: {
                    targetMarket: "High school and college students worldwide",
                    uvp: "Automated high-quality quiz generation in seconds",
                    marketingStrategy: "Freemium model with viral invite-a-friend features"
                },
                analysis: "StudyBuddy AI shows exceptional product-market fit potential. The AI engine's ability to process multiple languages could lead to rapid global scaling."
            }
        ];

        await Startup.insertMany(studentStartups);

        return NextResponse.json({
            success: true,
            message: "Student Incube dummy data seeded successfully",
            count: studentStartups.length
        });
    } catch (error: any) {
        console.error("Incube Seeding failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
