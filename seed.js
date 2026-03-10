import mongoose from "mongoose";
import dotenv from "dotenv";
import { Company, CompanyProfile, Job } from "./src/modules/company/company.model.js";
import User from "./src/modules/user/user.model.js";

dotenv.config({ quiet: true });

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    // Clear previous data
    await Company.deleteMany({});
    await CompanyProfile.deleteMany({});
    await Job.deleteMany({});
    await User.deleteMany({});

    // Create sample companies
    const company1 = await Company.create({ email: "abc@company.com", password: "123456" });
    const company2 = await Company.create({ email: "xyz@company.com", password: "123456" });

    // Company profiles
    await CompanyProfile.create({ companyId: company1._id, companyName: "ABC Tech", website: "abc.com", location: "Mumbai", description: "We build software" });
    await CompanyProfile.create({ companyId: company2._id, companyName: "XYZ Solutions", website: "xyz.com", location: "Delhi", description: "We provide IT solutions" });

    // Jobs
    await Job.create({ companyId: company1._id, title: "Frontend Developer", experience: "1-3 years", salary: "₹6LPA", location: "Mumbai", description: "React developer" });
    await Job.create({ companyId: company2._id, title: "Backend Developer", experience: "2-5 years", salary: "₹8LPA", location: "Delhi", description: "Node.js & MongoDB" });

    // Users
    await User.create({ name: "Sumit Singh", email: "sumit@example.com", password: "123456", skills: ["Node.js","React"], location: "Mumbai" });
    await User.create({ name: "Ravi Kumar", email: "ravi@example.com", password: "123456", skills: ["Python","Django"], location: "Delhi" });

    console.log("✅ Seed data created successfully!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();